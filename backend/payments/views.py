import hmac
import hashlib
import base64
import json
from django.conf import settings
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
            
            print(f"DEBUG: Verifying message: {message_str}")
            
            secret_key = settings.ESEWA_SECRET_KEY
            expected_sig = base64.b64encode(
                hmac.new(secret_key.encode(), message_str.encode(), hashlib.sha256).digest()
            ).decode()
            
            print(f"DEBUG: Expected signature: {expected_sig}")
            print(f"DEBUG: Received signature: {resp_sig}")
            
            if resp_sig != expected_sig:
                 print(f"DEBUG: Sig mismatch!")
                 return Response({'error': 'Invalid signature verification failed'}, status=status.HTTP_400_BAD_REQUEST)

            if response_data.get('status') != 'COMPLETE':
                 print(f"DEBUG: Status is {response_data.get('status')}, not COMPLETE")
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
