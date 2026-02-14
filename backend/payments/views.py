import hmac
import hashlib
import requests
import base64
import json
from django.conf import settings
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Payment
from .serializers import PaymentSerializer
from notifications.utils import send_notification
from .utils import trigger_rent_reminders

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'Tenant':
            return Payment.objects.filter(booking__tenant=user)
        elif user.role == 'Owner':
            return Payment.objects.filter(booking__room__owner=user)
        return Payment.objects.none()

    @action(detail=True, methods=['get'])
    def get_esewa_params(self, request, pk=None):
        """Generates signed parameters for eSewa v2 initiation."""
        payment = self.get_object()
        transaction_uuid = f"PAY-{payment.id}-{timezone.now().timestamp()}"
        
        # Format string for signature calculation
        # Format: total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}
        amount_str = str(int(payment.amount)) if payment.amount == int(payment.amount) else str(payment.amount)
        data_to_sign = f"total_amount={amount_str},transaction_uuid={transaction_uuid},product_code={settings.ESEWA_PRODUCT_CODE}"
        
        secret_key = settings.ESEWA_SECRET_KEY
        signature = hmac.new(
            secret_key.encode(),
            data_to_sign.encode(),
            hashlib.sha256
        ).digest()
        signature_base64 = base64.b64encode(signature).decode()

        params = {
            "amount": amount_str,
            "failure_url": f"{settings.FRONTEND_URL}/tenant/payments",
            "product_delivery_charge": "0",
            "product_service_charge": "0",
            "product_code": settings.ESEWA_PRODUCT_CODE,
            "signature": signature_base64,
            "signed_field_names": "total_amount,transaction_uuid,product_code",
            "success_url": f"{settings.FRONTEND_URL}/tenant/payments",
            "tax_amount": "0",
            "total_amount": amount_str,
            "transaction_uuid": transaction_uuid,
            "esewa_url": settings.ESEWA_GATEWAY_URL
        }
        return Response(params)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['post'])
    def verify_esewa(self, request, pk=None):
        """Action to verify eSewa v2 payment."""
        payment = self.get_object()
        encoded_data = request.data.get('data')
        
        if not encoded_data:
            return Response({'error': 'Encoded data is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Decode the base64 data from eSewa
            decoded_bytes = base64.b64decode(encoded_data)
            decoded_str = decoded_bytes.decode('utf-8')
            response_data = json.loads(decoded_str)
            
            # Verify signature in response
            # eSewa v2 sends 'data' as a base64 encoded JSON string
            
            resp_sig = response_data.get('signature')
            resp_fields = response_data.get('signed_field_names', '').split(',')
            
            # Reconstruct the message string for verification based on EXACT fields sent by eSewa
            message_parts = []
            for field in resp_fields:
                message_parts.append(f"{field}={response_data.get(field)}")
            message_str = ",".join(message_parts)
            
            secret_key = settings.ESEWA_SECRET_KEY
            expected_sig = base64.b64encode(
                hmac.new(secret_key.encode(), message_str.encode(), hashlib.sha256).digest()
            ).decode()
            
            if resp_sig != expected_sig:
                 return Response({'error': 'Invalid signature verification failed'}, status=status.HTTP_400_BAD_REQUEST)

            if response_data.get('status') != 'COMPLETE':
                 return Response({'error': 'Payment status is not COMPLETE'}, status=status.HTTP_400_BAD_REQUEST)

            transaction_id = response_data.get('transaction_code')
            
            payment.status = 'Paid'
            payment.paid_date = timezone.now().date()
            payment.payment_method = 'eSewa'
            payment.transaction_id = transaction_id
            payment.save()
    
            # Notify Owner
            send_notification(
                recipient=payment.booking.room.owner,
                actor=payment.booking.tenant,
                notification_type='payment_received',
                text=f"Payment of NPR {payment.amount} received via eSewa for {payment.booking.room.title}.",
                related_id=payment.id
            )
    
            return Response({'status': 'Payment verified successfully'})
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['post'])
    def initiate_khalti(self, request, pk=None):
        """Action to initiate Khalti payment (KPG-2)."""
        payment = self.get_object()
        
        # Use Gateway URL from settings
        url = settings.KHALTI_GATEWAY_URL
        # This will be the URL Khalti redirects back to
        return_url = request.data.get('return_url') or request.build_absolute_uri('/payments/khalti_callback/')
        
        payload = json.dumps({
            "return_url": return_url,
            "website_url": settings.FRONTEND_URL,
            "amount": int(float(payment.amount) * 100),
            "purchase_order_id": f"PAY-{payment.id}-{int(timezone.now().timestamp())}",
            "purchase_order_name": f"Payment for {payment.payment_type}",
            "customer_info": {
                "name": payment.booking.tenant.full_name,
                "email": payment.booking.tenant.email,
                "phone": "9800000000"
            }
        })
        
        # Using the secret key from settings
        headers = {
            'Authorization': f'Key {settings.KHALTI_SECRET_KEY}',
            'Content-Type': 'application/json',
        }

        try:
            response = requests.post(url, headers=headers, data=payload)
            if response.status_code == 200:
                data = response.json()
                payment.transaction_id = data.get('pidx')
                payment.save()
                return Response(data)
            else:
                return Response(response.json(), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['post'])
    def verify_khalti(self, request, pk=None):
        """Action to verify Khalti payment (v2 lookup)."""
        payment = self.get_object()
        pidx = request.data.get('pidx') or payment.transaction_id
        
        if not pidx:
            return Response({'error': 'pidx is required. Please initiate payment or contact support.'}, status=status.HTTP_400_BAD_REQUEST)

        print(f"DEBUG: Verifying Khalti Payment ID: {payment.id} with pidx: {pidx}")
        url = settings.KHALTI_LOOKUP_URL
        payload = json.dumps({"pidx": pidx})
        headers = {
            'Authorization': f'Key {settings.KHALTI_SECRET_KEY}',
            'Content-Type': 'application/json',
        }

        try:
            response = requests.post(url, headers=headers, data=payload)
            print(f"DEBUG: Khalti Lookup Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"DEBUG: Khalti Lookup Data: {data}")
                # Use case-insensitive check and include 'success' as a fallback
                khalti_state = data.get('status', '').lower()
                if khalti_state in ['completed', 'success']:
                    payment.status = 'Paid'
                    payment.paid_date = timezone.now().date()
                    payment.payment_method = 'Khalti'
                    payment.transaction_id = pidx # Update transaction ID with the verified pidx
                    payment.save()

                    try:
                        # Notify Owner
                        send_notification(
                            recipient=payment.booking.room.owner,
                            actor=payment.booking.tenant,
                            notification_type='payment_received',
                            text=f"Payment of NPR {payment.amount} received via Khalti for {payment.booking.room.title}.",
                            related_id=payment.id
                        )
                    except Exception as ne:
                        print(f"DEBUG: Owner notification failed but payment was saved: {ne}")

                    return Response({'status': 'Payment verified successfully'})
                return Response({'status': data.get('status'), 'message': 'Payment state is not Completed'})
            else:
                print(f"DEBUG: Khalti Lookup Failed! Content: {response.text}")
                return Response(response.json(), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"DEBUG: Request Exception: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_financial_dashboard(request):
    """
    Endpoint for owner's earnings and payments dashboard.
    Calculates stats (This Month, Last Month, All-Time) and returns payment logs.
    """
    user = request.user
    if user.role != 'Owner':
        return Response({'error': 'Only owners can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    # Filter params
    month = request.query_params.get('month') # '1' to '12' or 'All Months'
    year = request.query_params.get('year') # e.g., '2025'
    room_id = request.query_params.get('room_id') # 'All Rooms' or ID

    # Base queryset for owner's payments
    owner_payments = Payment.objects.filter(booking__room__owner=user)
    paid_payments = owner_payments.filter(status='Paid')

    # Current Month Stats
    now = timezone.now()
    current_month_paid = paid_payments.filter(paid_date__month=now.month, paid_date__year=now.year)
    this_month_earnings = sum(p.amount for p in current_month_paid)
    this_month_count = current_month_paid.count()

    # Last Month Stats
    last_month_val = now.month - 1 if now.month > 1 else 12
    last_month_year = now.year if now.month > 1 else now.year - 1
    last_month_paid = paid_payments.filter(paid_date__month=last_month_val, paid_date__year=last_month_year)
    last_month_earnings = sum(p.amount for p in last_month_paid)
    last_month_count = last_month_paid.count()

    # All-Time Earnings
    all_time_earnings = sum(p.amount for p in paid_payments)

    # Percentage changes (simplified)
    this_month_change = 0
    if last_month_earnings > 0:
        this_month_change = ((this_month_earnings - last_month_earnings) / last_month_earnings) * 100

    # Apply Filters to Logs
    logs_queryset = owner_payments.select_related('booking__tenant', 'booking__room').order_by('-created_at')
    
    if year and year != 'All' and year.isdigit():
        logs_queryset = logs_queryset.filter(created_at__year=int(year))
    
    if month and month != 'All Months' and month.isdigit():
        logs_queryset = logs_queryset.filter(created_at__month=int(month))
        
    if room_id and room_id != 'All Rooms' and room_id.isdigit():
        logs_queryset = logs_queryset.filter(booking__room_id=int(room_id))

    # Prepare logs data
    logs_data = []
    for p in logs_queryset:
        logs_data.append({
            'id': p.id,
            'date': p.paid_date.strftime('%b %d, %Y') if p.paid_date else p.created_at.strftime('%b %d, %Y'),
            'tenant': {
                'id': p.booking.tenant.id,
                'full_name': p.booking.tenant.full_name,
                'email': p.booking.tenant.email,
                'profile_photo': request.build_absolute_uri(p.booking.tenant.profile_photo.url) if p.booking.tenant.profile_photo else None
            },
            'room': p.booking.room.title,
            'payment_method': p.payment_method or 'Pending',
            'amount': p.amount,
            'status': p.status,
            'payment_type': p.payment_type
        })

    # Get unique rooms for the filter dropdown
    from OwnerRooms.models import Room
    owner_rooms = Room.objects.filter(owner=user).values('id', 'title')

    return Response({
        'stats': {
            'this_month': {
                'earnings': this_month_earnings,
                'transactions': this_month_count,
                'change': round(this_month_change, 1)
            },
            'last_month': {
                'earnings': last_month_earnings,
                'transactions': last_month_count,
                'change': 0
            },
            'all_time': {
                'earnings': all_time_earnings,
                'since': user.date_joined.strftime('%B %Y')
            }
        },
        'logs': logs_data,
        'filters': {
            'rooms': list(owner_rooms)
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_reminders(request):
    """
    API endpoint to manually/automatically trigger rent reminders.
    Can be called by frontend on app load or login.
    """
    count, skipped = trigger_rent_reminders()
    return Response({
        'status': 'success',
        'reminders_sent': count,
        'reminders_skipped': skipped,
        'message': f"Processed rent reminders. Sent: {count}, Skipped: {skipped}"
    })
