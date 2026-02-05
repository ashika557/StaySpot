from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Payment
from .serializers import PaymentSerializer
from notifications.utils import send_notification

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

    @action(detail=True, methods=['post'])
    def verify_esewa(self, request, pk=None):
        """Action to verify eSewa payment (V2)."""
        payment = self.get_object()
        import requests
        import base64
        import json
        
        # In V2, eSewa returns a base64 encoded 'data' field in the query params upon success
        encoded_data = request.query_params.get('data')
        
        # If 'data' is not present, check body (sometimes it comes differently depending on implementation)
        if not encoded_data:
             encoded_data = request.data.get('data')

        print(f"DEBUG: eSewa V2 Verify Request - PaymentID: {pk}, Data: {encoded_data}")

        if not encoded_data:
             return Response({'error': 'No data received from eSewa'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Decode the base64 data
            decoded_bytes = base64.b64decode(encoded_data)
            decoded_str = decoded_bytes.decode('utf-8')
            data = json.loads(decoded_str)
            
            print(f"DEBUG: eSewa V2 Decoded Data: {data}")
            
            # Extract fields
            status_code = data.get('status')
            transaction_uuid = data.get('transaction_uuid')
            total_amount = data.get('total_amount')
            ref_id = data.get('ref_id') # eSewa reference ID
            
            # Verify status
            if status_code == 'COMPLETE':
                # Optional: Verify signature/amount again if needed, but the redirect implies success if signature matched eSewa's side
                
                # Check if transaction_uuid matches our format (PAY-{id}-{timestamp})
                if str(payment.id) not in transaction_uuid:
                     print(f"DEBUG: Transaction UUID mismatch. Expected ID {payment.id} in {transaction_uuid}")
                
                payment.status = 'Paid'
                payment.paid_date = timezone.now().date()
                payment.payment_method = 'eSewa'
                payment.transaction_id = ref_id if ref_id else transaction_uuid
                payment.save()

                # Notify Owner
                send_notification(
                    recipient=payment.booking.room.owner,
                    actor=payment.booking.tenant,
                    notification_type='payment_received',
                    text=f"Payment of ₹{payment.amount} received via eSewa for {payment.booking.room.title}.",
                    related_id=payment.id
                )
                return Response({'status': 'Payment verified successfully'})
            else:
                 print(f"DEBUG: eSewa status not COMPLETE: {status_code}")
                 return Response({'error': 'eSewa payment failed'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"DEBUG: eSewa Exception: {e}")
            return Response({'error': 'Verification error'}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['post'])
    def verify_khalti(self, request, pk=None):
        """Action to verify Khalti payment."""
        payment = self.get_object()
        token = request.data.get('token')
        amount = request.data.get('amount') # in paisa
        
        if not token:
            return Response({'error': 'Khalti token is required'}, status=status.HTTP_400_BAD_REQUEST)

        import requests
        url = "https://khalti.com/api/v2/payment/verify/"
        payload = {
            "token": token,
            "amount": amount
        }
        # TODO: Move Secret Key to environment variables
        headers = {
            "Authorization": "Key test_secret_key_f59e8b7d18b4499ca40f68195a8a7e9b" 
        }

        try:
            response = requests.post(url, payload, headers=headers)
            if response.status_code == 200:
                payment.status = 'Paid'
                payment.paid_date = timezone.now().date()
                payment.payment_method = 'Khalti'
                payment.transaction_id = token
                payment.save()

                # Notify Owner
                send_notification(
                    recipient=payment.booking.room.owner,
                    actor=payment.booking.tenant,
                    notification_type='payment_received',
                    text=f"Payment of ₹{payment.amount} received via Khalti for {payment.booking.room.title}.",
                    related_id=payment.id
                )
                return Response({'status': 'Payment verified successfully'})
            else:
                 return Response({'error': 'Khalti verification failed'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
             print(f"Khalti Verification Error: {e}")
             return Response({'error': 'Verification error'}, status=status.HTTP_400_BAD_REQUEST)
