from rest_framework import serializers
from accounts.models import User
from .models import Payment
from OwnerRooms.models import Booking

class PaymentSerializer(serializers.ModelSerializer):
    booking = serializers.SerializerMethodField()
    booking_id = serializers.PrimaryKeyRelatedField(
        queryset=Booking.objects.all(), 
        source='booking', 
        write_only=True
    )
    tenant_name = serializers.CharField(source='booking.tenant.full_name', read_only=True)
    room_number = serializers.CharField(source='booking.room.room_number', read_only=True)

    def get_booking(self, obj):
        from OwnerRooms.serializers import BookingSerializer
        return BookingSerializer(obj.booking).data
    
    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'booking_id', 'tenant_name', 'room_number',
            'amount', 'due_date', 'paid_date', 'status', 'payment_type', 
            'payment_method', 'transaction_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
