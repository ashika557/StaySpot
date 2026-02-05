
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Room, RoomImage, UserSearchPreference, Booking, Visit
from payments.models import Payment
from .serializers import (
    RoomSerializer, BookingSerializer, VisitSerializer, 
    TenantDashboardSerializer
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
        else:
            # Tenants see only Available rooms (or rooms they are interested in)
            queryset = queryset.filter(status='Available')
            
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
        kitchen = self.request.query_params.get('kitchen')
        furniture = self.request.query_params.get('furniture')

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
        if kitchen == 'true': queryset = queryset.filter(kitchen=True)
        if furniture == 'true': queryset = queryset.filter(furniture=True)

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
            if pref.ac:
                q_objects |= Q(ac=True)
            if pref.tv:
                q_objects |= Q(tv=True)
            
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
                if booking.room.owner != user and user.role != 'Admin':
                    # Allow Admin to manage any booking, but regular owner only their own
                    pass 
                elif booking.room.owner != user:
                    raise serializers.ValidationError("You do not own this room.")
                    
        serializer.save()

        # Update Room status based on booking status
        if new_status in ['Confirmed', 'Active']:
            booking.room.status = 'Occupied'
            booking.room.save()
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

            # Auto-create Payment if confirmed
            if new_status in ['Confirmed', 'Active']:
                from payments.models import Payment
                # Check if initial rent payment exists
                if not Payment.objects.filter(booking=booking, payment_type='Rent').exists():
                    Payment.objects.create(
                        booking=booking,
                        amount=booking.monthly_rent,
                        due_date=booking.start_date,
                        status='Pending',
                        payment_type='Rent'
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
    
    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_identity_verified and user.role != 'Admin':
            from rest_framework import serializers
            raise serializers.ValidationError({"error": "Your identity document is pending verification by an administrator." if user.identity_document else "You must provide an identity document before this action."})
        visit = serializer.save(tenant=user)
        
        # Notify room owner about new visit request
        send_notification(
            recipient=visit.owner,
            actor=user,
            notification_type='visit_requested',
            text=f"New visit request for {visit.room.title} from {user.full_name}.",
            related_id=visit.id
        )

    def perform_update(self, serializer):
        user = self.request.user
        visit = self.get_object()
        old_status = visit.status
        new_status = serializer.validated_data.get('status')
        
        serializer.save()
        
        if new_status and new_status != old_status:
            # Determine notification recipient and type
            recipient = visit.owner if user.role == 'Tenant' else visit.tenant
            
            # Map status to notification type
            notif_type = f'visit_{new_status.lower()}'
            if new_status == 'Scheduled':
                notif_type = 'visit_approved'
            elif new_status == 'Completed':
                # Maybe no notification for completed? Or add it. 
                # For now let's just stick to the ones we added to model.
                return

            if notif_type in ['visit_approved', 'visit_rejected', 'visit_cancelled']:
                send_notification(
                    recipient=recipient,
                    actor=user,
                    notification_type=notif_type,
                    text=f"Your visit request for {visit.room.title} has been {new_status.lower()}.",
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
    
    # Get payment reminders (pending and overdue)
    payment_reminders = Payment.objects.filter(
        booking__tenant=user,
        status__in=['Pending', 'Overdue']
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
