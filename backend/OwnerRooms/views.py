
from accounts.models import User
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Room, RoomImage, UserSearchPreference, Booking, Visit, RoomReview, Complaint, Chat
from payments.models import Payment
from .serializers import (
    RoomSerializer, BookingSerializer, VisitSerializer,
    TenantDashboardSerializer, RoomReviewSerializer,
    ComplaintSerializer
)
# PaymentSerializer imported locally in tenant_dashboard to avoid circular import
from chat.models import Conversation, Message
from chat.serializers import MessageSerializer
from notifications.utils import send_notification

class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Room.objects.all()
        
        # Owners only see their own rooms
        if user.role == 'Owner':
            queryset = queryset.filter(owner=user)
        elif user.role == 'Admin':
            # Admins see all rooms (including Hidden ones if they want to manage them)
            # By default filter to showing all unless admin specifically filters
            pass
        else:
            # Tenants see Available rooms (and Occupied rooms so they can still see details)
            queryset = queryset.filter(status__in=['Available', 'Occupied'])
            
        # Filtering logic
        location = self.request.query_params.get('location')
        gender = self.request.query_params.get('gender_preference')
        room_type = self.request.query_params.get('room_type')
        
        # Amenities
        wifi = self.request.query_params.get('wifi')
        ac = self.request.query_params.get('ac')
        tv = self.request.query_params.get('tv')
        parking = self.request.query_params.get('parking')
        water_supply = self.request.query_params.get('water_supply')
        attached_bathroom = self.request.query_params.get('attached_bathroom')
        cctv = self.request.query_params.get('cctv')
        kitchen_access = self.request.query_params.get('kitchen_access')
        furnished = self.request.query_params.get('furnished')

        # Price Range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        # Distance Search
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius') # in km
        
        if location:
            queryset = queryset.filter(location__icontains=location)
        if gender and gender != 'Any':
            queryset = queryset.filter(Q(gender_preference=gender) | Q(gender_preference='Any'))
        if room_type:
            queryset = queryset.filter(room_type=room_type)
        
        # Boolean Filters
        if wifi == 'true': queryset = queryset.filter(wifi=True)
        if ac == 'true': queryset = queryset.filter(ac=True)
        if tv == 'true': queryset = queryset.filter(tv=True)
        if parking == 'true': queryset = queryset.filter(parking=True)
        if water_supply == 'true': queryset = queryset.filter(water_supply=True)
        if attached_bathroom == 'true': queryset = queryset.filter(attached_bathroom=True)
        if cctv == 'true': queryset = queryset.filter(cctv=True)
        if kitchen_access == 'true': queryset = queryset.filter(kitchen_access=True)
        if furnished == 'true': queryset = queryset.filter(furnished=True)

        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Basic distance filtering if lat/lng/radius provided
        if lat and lng and radius:
            try:
                lat = float(lat)
                lng = float(lng)
                radius = float(radius)
                # Simple bounding box for rough distance filtering
                # 1 degree of latitude is approx 111km
                lat_deg = radius / 111.0
                # 1 degree of longitude depends on latitude
                import math
                lng_deg = radius / (111.0 * math.cos(math.radians(lat)))
                
                queryset = queryset.filter(
                    latitude__gte=lat - lat_deg,
                    latitude__lte=lat + lat_deg,
                    longitude__gte=lng - lng_deg,
                    longitude__lte=lng + lng_deg
                )
            except (ValueError, TypeError):
                pass
            
        # Update user preferences if filtering (only for Tenants)
        if user.role == 'Tenant' and (location or gender or room_type or min_price or max_price):
            self.update_user_preferences(user, location, gender, room_type, wifi, ac, tv)
            
        return queryset

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        room = self.get_object()
        reviews = room.reviews.all()
        serializer = RoomReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    def update_user_preferences(self, user, location, gender, room_type, wifi, ac, tv):
        pref, created = UserSearchPreference.objects.get_or_create(user=user)
        if location: pref.location = location
        if gender: pref.gender_preference = gender
        if room_type: pref.room_type = room_type
        if wifi == 'true': pref.wifi = True
        if ac == 'true': pref.ac = True
        if tv == 'true': pref.tv = True
        pref.save()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_identity_verified and user.role != 'Admin':
            from rest_framework import serializers
            raise serializers.ValidationError({"error": "Your identity document is pending verification by an administrator." if user.identity_document else "You must provide an identity document before adding a room."})
        serializer.save(owner=user)
    
    @action(detail=False, methods=['get'])
    def suggested(self, request):
        """Return suggested rooms based on user preferences."""
        user = request.user
        if user.role != 'Tenant':
            return Response({'error': 'Only tenants have suggestions'}, status=status.HTTP_400_BAD_REQUEST)
            
        queryset = Room.objects.filter(status='Available')
        
        try:
            pref = user.search_preference
            # Build query based on preferences
            q_objects = Q()
            if pref.location:
                q_objects |= Q(location__icontains=pref.location)
            if pref.gender_preference and pref.gender_preference != 'Any':
                q_objects |= Q(gender_preference=pref.gender_preference)
            if pref.room_type:
                q_objects |= Q(room_type=pref.room_type)
            if pref.wifi:
                q_objects |= Q(wifi=True)
            if hasattr(Room, 'ac') and pref.ac:
                q_objects |= Q(ac=True)
            if hasattr(Room, 'tv') and pref.tv:
                q_objects |= Q(tv=True)
            if hasattr(Room, 'cctv') and getattr(pref, 'cctv', False):
                q_objects |= Q(cctv=True)
            
            if q_objects:
                queryset = queryset.filter(q_objects).distinct()
        except UserSearchPreference.DoesNotExist:
            # No preferences yet, just return recent available rooms
            pass
            
        # Fallback to recent available rooms if no matches or no preferences
        if not queryset.exists():
            queryset = Room.objects.filter(status='Available')[:6]
        else:
            queryset = queryset.order_by('-created_at')[:6]
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        room = self.get_object()
        images = request.FILES.getlist('images')
        
        for image in images:
            RoomImage.objects.create(room=room, image=image)
        
        serializer = self.get_serializer(room)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='images/(?P<image_id>[^/.]+)')
    def delete_image(self, request, pk=None, image_id=None):
        room = self.get_object()
        try:
            image = RoomImage.objects.get(id=image_id, room=room)
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RoomImage.DoesNotExist:
            return Response(
                {'error': 'Image not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='admin-action')
    def admin_action(self, request, pk=None):
        """Admin action to moderate a room (approve or disable)."""
        if request.user.role != 'Admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        room = self.get_object()
        action = request.data.get('action') # 'Approve' or 'Disable'
        
        if action == 'Approve':
            room.status = 'Available'
            message = 'Room approved and listed successfully.'
        elif action == 'Disable':
            room.status = 'Disabled'
            message = 'Room has been disabled/hidden from users.'
        else:
            return Response({'error': 'Invalid action. Use Approve or Disable.'}, status=status.HTTP_400_BAD_REQUEST)
            
        room.save()
        return Response({'message': message, 'status': room.status})

    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        room = self.get_object()
        room.views += 1
        room.save()
        return Response({'views': room.views})


# New ViewSets for tenant dashboard features
class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'Tenant':
            return Booking.objects.filter(tenant=user)
        elif user.role in ['Owner', 'Admin']:
            # Owners and Admins see bookings for their rooms (requests and active)
            return Booking.objects.filter(room__owner=user)
        return Booking.objects.none()

    def perform_update(self, serializer):
        user = self.request.user
        booking = self.get_object()
        new_status = serializer.validated_data.get('status')
        
        if new_status:
            if user.role == 'Tenant':
                # Tenants can only Cancel their own bookings
                if new_status != 'Cancelled':
                     raise serializers.ValidationError("Tenants can only cancel bookings.")
            elif user.role in ['Owner', 'Admin']:
                # Owners and Admins can Confirm or Reject, or Cancel
                if user.role == 'Admin':
                    # Superadmin has full control
                    pass
                elif booking.room.owner != user:
                    raise serializers.ValidationError("You do not own this room.")
                    
        serializer.save()

        # Update Room status based on booking status
        if new_status in ['Confirmed', 'Active']:
            booking.room.status = 'Occupied'
            booking.room.save()
            
            # Auto-create Payment if confirmed
            from payments.models import Payment
            from dateutil.relativedelta import relativedelta
            
            # Use 1 month after start date as the first due date
            first_due_date = booking.start_date + relativedelta(months=1)
            
            # If the booking is very short (ends before 1 month), set due date to end_date
            if booking.end_date and first_due_date > booking.end_date:
                first_due_date = booking.end_date
            
            # Check if initial rent payment exists for this specific booking and period
            if not Payment.objects.filter(booking=booking, payment_type='Rent', due_date=first_due_date).exists():
                Payment.objects.create(
                    booking=booking,
                    amount=booking.monthly_rent,
                    due_date=first_due_date,
                    status='Pending',
                    payment_type='Rent'
                )
                print(f"DEBUG: Auto-created first Rent payment (due {first_due_date}) for booking {booking.id}")

        elif new_status in ['Cancelled', 'Rejected', 'Completed']:
            # If a booking is cancelled/rejected/completed, room becomes available again
            booking.room.status = 'Available'
            booking.room.save()

        # Send notification about status change
        if new_status:
            recipient = booking.room.owner if user.role == 'Tenant' else booking.tenant
            notif_type = f'booking_{new_status.lower()}'
            send_notification(
                recipient=recipient,
                actor=user,
                notification_type=notif_type,
                text=f"Booking for {booking.room.title} has been {new_status.lower()}.",
                related_id=booking.id
            )
    
    def perform_destroy(self, instance):
        recipient = instance.room.owner if self.request.user.role == 'Tenant' else instance.tenant
        
        # If the booking was confirmed/active, make the room available again upon deletion
        if instance.status in ['Confirmed', 'Active']:
            instance.room.status = 'Available'
            instance.room.save()

        # Send notification before deletion
        send_notification(
            recipient=recipient,
            actor=self.request.user,
            notification_type='booking_cancelled',
            text=f"Booking for {instance.room.title} has been deleted/cancelled.",
            related_id=instance.id
        )
        instance.delete()
    
    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_identity_verified and user.role != 'Admin':
            from rest_framework import serializers
            raise serializers.ValidationError({"error": "Your identity document is pending verification by an administrator." if user.identity_document else "You must provide an identity document before this action."})
        
        # Check if room is already occupied
        room_id = serializer.validated_data.get('room').id
        room = Room.objects.get(id=room_id)
        if room.status not in ['Available']:
             raise serializers.ValidationError({"error": "This room is already occupied/unavailable."})

        booking = serializer.save(tenant=user)
        
        # Notify room owner about new booking request
        send_notification(
            recipient=booking.room.owner,
            actor=user,
            notification_type='booking_request',
            text=f"New booking request for {booking.room.title} from {user.full_name}.",
            related_id=booking.id
        )


class VisitViewSet(viewsets.ModelViewSet):
    serializer_class = VisitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'Tenant':
            return Visit.objects.filter(tenant=user)
        elif user.role in ['Owner', 'Admin']:
            return Visit.objects.filter(owner=user)
        return Visit.objects.none()

    def list(self, request, *args, **kwargs):
        # Auto-cleanup of duplicate visits to solve the "shown twice" error
        if request.user.is_authenticated:
            from django.db.models import Count
            from .models import Visit
            # Find groups of potential duplicates
            duplicates = Visit.objects.values('tenant', 'room', 'visit_date', 'visit_time', 'purpose')\
                .annotate(count=Count('id')).filter(count__gt=1)
            
            for duplicate in duplicates:
                v_ids = Visit.objects.filter(
                    tenant_id=duplicate['tenant'],
                    room_id=duplicate['room'],
                    visit_date=duplicate['visit_date'],
                    visit_time=duplicate['visit_time'],
                    purpose=duplicate['purpose']
                ).values_list('id', flat=True)
                
                # Keep the first ID, delete the rest
                if len(v_ids) > 1:
                    Visit.objects.filter(id__in=v_ids[1:]).delete()
        
        return super().list(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_identity_verified and user.role != 'Admin':
            from rest_framework import serializers
            raise serializers.ValidationError({"error": "Your identity document is pending verification by an administrator." if user.identity_document else "You must provide an identity document before this action."})
        visit = serializer.save(tenant=user)
        
        # Notify room owner about new visit request
        send_notification(
            recipient=visit.room.owner,
            actor=user,
            notification_type='visit_request',
            text=f"New visit request for {visit.room.title} from {user.full_name}.",
            related_id=visit.id
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        visit = serializer.save()
        new_status = visit.status
        
        if old_status != new_status:
            # Map 'Scheduled' to 'accepted' for better readability in notification
            status_text = new_status.lower()
            if new_status == 'Scheduled':
                status_text = 'accepted'
            
            send_notification(
                recipient=visit.tenant,
                actor=self.request.user,
                notification_type='visit_status',
                text=f"Your visit request for {visit.room.title} has been {status_text}.",
                related_id=visit.id
            )


# PaymentViewSet moved to payments app


# Debug endpoint to check user info
@api_view(['GET'])
@permission_classes([AllowAny])
def debug_user_info(request):
    """Debug endpoint to check current user's authentication and role."""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'phone': user.phone,
        'role': user.role,
        'is_authenticated': request.user.is_authenticated,
        'auth_header_present': 'Authorization' in request.headers,
    })


# Tenant Dashboard API endpoint
@api_view(['GET'])
@permission_classes([AllowAny])
def tenant_dashboard(request):
    """
    Aggregated endpoint for tenant dashboard data.
    Returns: upcoming visit, current booking, payment reminders, recent chats, suggested rooms
    """
    user = request.user
    print(f"DEBUG: Tenant Dashboard - User: {user}, Auth: {user.is_authenticated}")
    print(f"DEBUG: Cookies: {request.COOKIES}")
    
    if not user.is_authenticated:
        return Response(
            {'error': 'Authentication required', 'debug_cookies': str(request.COOKIES)}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Temporarily disabled role check for debugging
    # TODO: Re-enable this once authentication is properly set up
    # if user.role != 'Tenant':
    #     return Response(
    #         {'error': 'This endpoint is only for tenants'}, 
    #         status=status.HTTP_403_FORBIDDEN
    #     )
    
    # Get upcoming visit (next scheduled visit)
    upcoming_visit = Visit.objects.filter(
        tenant=user, 
        status='Scheduled',
        visit_date__gte=timezone.now().date()
    ).order_by('visit_date', 'visit_time').first()
    
    # Get current active booking (Active or Confirmed)
    current_booking = Booking.objects.filter(
        tenant=user, 
        status__in=['Active', 'Confirmed']
    ).first()
    
    # Get payment reminders — only show rent due within 7 days (or overdue)
    from datetime import timedelta
    today = timezone.now().date()
    reminder_window = today + timedelta(days=7)

    payment_reminders = Payment.objects.filter(
        booking__tenant=user,
        status__in=['Pending', 'Overdue'],
        due_date__lte=reminder_window,   # due today, within 7 days, or already overdue
    ).order_by('due_date')[:5]

    
    # Get recent chats (last 3 messages from different conversations)
    recent_messages = Message.objects.filter(
        Q(conversation__owner=user) | Q(conversation__tenant=user)
    ).order_by('-timestamp')[:3]
    
    # Get suggested rooms (fallback to any available if no preferences)
    suggested_rooms = Room.objects.filter(status='Available')
    print(f"DEBUG: All available rooms count: {suggested_rooms.count()}")
    
    try:
        pref = user.search_preference
        print(f"DEBUG: User preferences: loc={pref.location}, gender={pref.gender_preference}, type={pref.room_type}")
        q_objects = Q()
        if pref.location:
            q_objects |= Q(location__icontains=pref.location)
        if pref.gender_preference and pref.gender_preference != 'Any':
            q_objects |= Q(gender_preference=pref.gender_preference)
        if pref.room_type:
            q_objects |= Q(room_type=pref.room_type)
        if pref.wifi:
            q_objects |= Q(wifi=True)
        if pref.ac:
            q_objects |= Q(ac=True)
        if pref.tv:
            q_objects |= Q(tv=True)
        
        if q_objects:
            suggested_rooms = suggested_rooms.filter(q_objects).distinct()
            print(f"DEBUG: Filtered suggested rooms count: {suggested_rooms.count()}")
        
        suggested_rooms = suggested_rooms.order_by('-created_at')[:3]
    except Exception as e:
        print(f"DEBUG: Preference processing error: {e}")
        suggested_rooms = suggested_rooms.order_by('-created_at')[:3]
    
    print(f"DEBUG: Final suggested rooms count: {len(suggested_rooms)}")
    
    # Serialize data and return
    from payments.serializers import PaymentSerializer
    return Response({
        'upcoming_visit': VisitSerializer(upcoming_visit, context={'request': request}).data if upcoming_visit else None,
        'current_booking': BookingSerializer(current_booking, context={'request': request}).data if current_booking else None,
        'payment_reminders': PaymentSerializer(payment_reminders, many=True, context={'request': request}).data,
        'recent_chats': MessageSerializer(recent_messages, many=True, context={'request': request}).data,
        'suggested_rooms': RoomSerializer(suggested_rooms, many=True, context={'request': request}).data,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_tenant_management(request):
    """
    Endpoint for owner's tenant management dashboard.
    Returns: stats and tenant directory.
    """
    user = request.user
    if user.role != 'Owner':
        return Response({'error': 'Only owners can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    # Get all active/confirmed bookings for the owner's rooms
    active_bookings = Booking.objects.filter(
        room__owner=user,
        status__in=['Active', 'Confirmed']
    ).select_related('tenant', 'room')

    # Calculate Stats
    total_tenants = active_bookings.values('tenant').distinct().count()
    active_leases = active_bookings.count()
    
    # Pending Rent: Count of payments with 'Pending' status for owner's bookings
    pending_rent_count = Payment.objects.filter(
        booking__room__owner=user,
        status='Pending'
    ).count()

    # Maintenance Requests: Complaints for owner's rooms that are maintenance and pending
    maintenance_requests_count = Complaint.objects.filter(
        owner=user,
        complaint_type='Maintenance',
        status='Pending'
    ).count()

    # Prepare Tenant Directory
    tenant_directory = []
    for booking in active_bookings:
        # Get the latest payment status for this booking
        latest_payment = Payment.objects.filter(booking=booking).order_by('-due_date').first()
        rent_status = latest_payment.status if latest_payment else 'Paid' # Default to Paid if no payment record found
        
        # Calculate Lease Status (Simulated for mockup consistency)
        lease_status = booking.status
        # If end_date is within 30 days, mark as 'Expiring Soon'
        if booking.end_date and (booking.end_date - timezone.now().date()).days <= 30:
            lease_status = 'Expiring Soon'

        tenant_directory.append({
            'id': booking.id,
            'tenant': {
                'id': booking.tenant.id,
                'full_name': booking.tenant.full_name,
                'email': booking.tenant.email,
                'profile_photo': request.build_absolute_uri(booking.tenant.profile_photo.url) if booking.tenant.profile_photo else None
            },
            'property': f"{booking.room.location}, {booking.room.title}",
            'lease_status': lease_status,
            'rent_status': rent_status,
            'move_in_date': booking.start_date.strftime('%b %d, %Y'),
        })

    return Response({
        'stats': {
            'total_tenants': total_tenants,
            'active_leases': active_leases,
            'pending_rent': pending_rent_count,
            'maintenance_requests': maintenance_requests_count
        },
        'tenants': tenant_directory
    })

class RoomReviewViewSet(viewsets.ModelViewSet):
    serializer_class = RoomReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RoomReview.objects.all()

    def perform_create(self, serializer):
        room_id = self.request.data.get('room')
        user = self.request.user
        
        # Check if user has a valid booking for this room
        from .models import Booking
        has_booking = Booking.objects.filter(
            tenant=user,
            room_id=room_id,
            status__in=['Confirmed', 'Active', 'Completed']
        ).exists()
        
        if not has_booking:
            from rest_framework import serializers
            raise serializers.ValidationError("You can only review rooms you have a confirmed booking for.")
            
        # Assign the current tenant to the review
        try:
            serializer.save(tenant=user)
        except Exception as e:
            from django.db import IntegrityError
            if isinstance(e, IntegrityError):
                from rest_framework import serializers
                raise serializers.ValidationError("You have already reviewed this room.")
            raise e

    def perform_update(self, serializer):
        if serializer.instance.tenant != self.request.user:
            from rest_framework import serializers
            raise serializers.ValidationError("You can only edit your own reviews.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.tenant != self.request.user:
            from rest_framework import serializers
            raise serializers.ValidationError("You can only delete your own reviews.")
        instance.delete()

    @action(detail=False, methods=['get'], url_path='room/(?P<room_id>[^/.]+)')
    def by_room(self, request, room_id=None):
        reviews = RoomReview.objects.filter(room_id=room_id)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)


class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Tenant':
            return Complaint.objects.filter(tenant=user)
        elif user.role == 'Owner':
            return Complaint.objects.filter(owner=user)
        elif user.role == 'Admin':
            return Complaint.objects.all()
        return Complaint.objects.none()

    def perform_create(self, serializer):
        complaint = serializer.save(tenant=self.request.user)
        
        # Notify room owner about new complaint
        send_notification(
            recipient=complaint.owner,
            actor=self.request.user,
            notification_type='complaint_filed',
            text=f"New {complaint.complaint_type} request from {self.request.user.full_name}.",
            related_id=complaint.id
        )

    def perform_update(self, serializer):
        user = self.request.user
        complaint = self.get_object()
        new_status = serializer.validated_data.get('status')
        
        if new_status and new_status != complaint.status:
            if user.role == 'Tenant':
                from rest_framework import serializers
                raise serializers.ValidationError({"error": "Tenants cannot change the status of a complaint."})
            
            # Only owner of the room/complaint or admin can change status
            if user.role == 'Owner' and complaint.owner != user:
                from rest_framework import serializers
                raise serializers.ValidationError({"error": "You do not have permission to update this complaint."})

            serializer.save()
            
            # Notify tenant about status change
            send_notification(
                recipient=complaint.tenant,
                actor=user,
                notification_type='complaint_status_change',
                text=f"Your request '{complaint.complaint_type}' has been marked as {new_status}.",
                related_id=complaint.id
            )
        else:
            serializer.save()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """
    Aggregated endpoint for admin dashboard data.
    """
    if request.user.role != 'Admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    # 1. Base Stats
    total_users = User.objects.count()
    verified_users = User.objects.filter(is_identity_verified=True).count()
    total_rooms = Room.objects.count()
    total_bookings = Booking.objects.count()
    active_complaints = Complaint.objects.filter(status__in=['Pending', 'Investigating']).count()
    
    # 1a. Financial Stats
    from payments.models import Payment
    from django.db.models import Sum
    from django.utils import timezone
    
    all_paid = Payment.objects.filter(status='Paid')
    total_revenue = all_paid.aggregate(Sum('amount'))['amount__sum'] or 0
    
    now = timezone.now()
    month_paid = all_paid.filter(paid_date__month=now.month, paid_date__year=now.year)
    this_month_revenue = month_paid.aggregate(Sum('amount'))['amount__sum'] or 0
    
    # 2. Complaint Status Breakdown
    complaint_stats = {
        'Resolved': Complaint.objects.filter(status='Resolved').count(),
        'In Progress': Complaint.objects.filter(status='Investigating').count(),
        'Pending': Complaint.objects.filter(status='Pending').count(),
    }
    
    # Calculate percentages for pie chart
    total_complaints = sum(complaint_stats.values()) or 1
    complaint_percentages = {
        'Resolved': round((complaint_stats['Resolved'] / total_complaints) * 100),
        'In Progress': round((complaint_stats['In Progress'] / total_complaints) * 100),
        'Pending': round((complaint_stats['Pending'] / total_complaints) * 100),
    }

    # 3. Recent Activity (Latest 5 items)
    activities = []
    
    # Recent User Registrations
    recent_users = User.objects.order_by('-date_joined')[:3]
    for u in recent_users:
        activities.append({
            'type': 'New user registration',
            'detail': f"{u.full_name} signed up as {u.role.lower()}",
            'time': u.date_joined,
            'icon': 'user'
        })
        
    # Recent Room Uploads
    recent_rooms = Room.objects.order_by('-created_at')[:3]
    for r in recent_rooms:
        activities.append({
            'type': 'Room uploaded',
            'detail': f"{r.owner.full_name} added new property",
            'time': r.created_at,
            'icon': 'home'
        })
        
    # Recent Bookings
    recent_bookings = Booking.objects.order_by('-created_at')[:3]
    for b in recent_bookings:
        activities.append({
            'type': 'New booking',
            'detail': f"{b.tenant.full_name} booked a room",
            'time': b.created_at,
            'icon': 'calendar'
        })
        
    # Recent Complaints
    recent_complaints = Complaint.objects.order_by('-created_at')[:3]
    for c in recent_complaints:
        activities.append({
            'type': 'Complaint filed',
            'detail': f"Issue with {c.complaint_type.lower()}",
            'time': c.created_at,
            'icon': 'alert'
        })
        
    # Sort all by time and take top 5
    activities.sort(key=lambda x: x['time'], reverse=True)
    recent_activities = activities[:5]

    return Response({
        'stats': {
            'total_users': total_users,
            'verified_users': verified_users,
            'total_rooms': total_rooms,
            'total_bookings': total_bookings,
            'active_complaints': active_complaints,
            'total_revenue': total_revenue,
            'this_month_revenue': this_month_revenue,
        },
        'complaint_breakdown': complaint_percentages,
        'recent_activity': recent_activities
    })

