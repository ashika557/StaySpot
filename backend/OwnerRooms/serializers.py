from rest_framework import serializers
from .models import Room, RoomImage, Booking, Visit, Chat, RoomReview, Complaint
from accounts.models import User
from chat.serializers import MessageSerializer
from payments.models import Payment
from payments.serializers import PaymentSerializer
# PaymentSerializer imported locally in TenantDashboardSerializer

class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ['id', 'image', 'uploaded_at']


# User serializer for nested data
class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'role', 'identity_document', 'is_identity_verified']


class RoomReviewSerializer(serializers.ModelSerializer):
    tenant = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = RoomReview
        fields = ['id', 'tenant', 'room', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'tenant', 'created_at']


class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    owner = UserBasicSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'owner', 'title', 'location', 'room_type',
            'floor', 'size', 'price', 'deposit', 'status', 
            'preferred_tenant', 'toilet_type', 'kitchen_access', 
            'furnished', 'available_from', 'wifi', 'parking', 
            'attached_bathroom', 'water_supply', 'electricity_backup',
            'cooking_allowed', 'smoking_allowed', 'drinking_allowed', 
            'pets_allowed', 'visitor_allowed', 'gender_preference', 
            'latitude', 'longitude', 'description', 'amenities', 'views', 'images', 'uploaded_images', 
            'average_rating', 'review_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'views', 'created_at', 'updated_at']
    
    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews.exists():
            return 0
        return sum(r.rating for r in reviews) / reviews.count()
    
    def get_review_count(self, obj):
        return obj.reviews.count()
    
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        room = Room.objects.create(**validated_data)
        
        for image in uploaded_images:
            RoomImage.objects.create(room=room, image=image)
        
        return room
    
    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        for image in uploaded_images:
            RoomImage.objects.create(room=instance, image=image)
        
        return instance


# User serializer for nested data
# Booking serializers
class BookingSerializer(serializers.ModelSerializer):
    tenant = UserBasicSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(), 
        source='room', 
        write_only=True
    )
    
    class Meta:
        model = Booking
        fields = [
            'id', 'tenant', 'room', 'room_id', 'start_date', 'end_date',
            'monthly_rent', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# Visit serializers
class VisitSerializer(serializers.ModelSerializer):
    tenant = UserBasicSerializer(read_only=True)
    owner = UserBasicSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(), 
        source='room', 
        write_only=True
    )
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='owner', 
        write_only=True
    )
    
    class Meta:
        model = Visit
        fields = [
            'id', 'tenant', 'owner', 'owner_id', 'room', 'room_id',
            'visit_date', 'visit_time', 'purpose', 'notes', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        # Only validate on creation
        if not self.instance:
            request = self.context.get('request')
            if request and request.user:
                tenant = request.user
                room = data.get('room')
                visit_date = data.get('visit_date')
                
                # Check for existing pending or scheduled visits for the same day and room
                from .models import Visit
                existing_visit = Visit.objects.filter(
                    tenant=tenant,
                    room=room,
                    visit_date=visit_date,
                    status__in=['Pending', 'Scheduled', 'Approved']
                ).exists()
                
                if existing_visit:
                    raise serializers.ValidationError({
                        "error": "You already have a pending or scheduled visit for this room on this date."
                    })
        return data


# Payment serializers
# PaymentSerializer moved to payments app




# Dashboard aggregated serializer
class TenantDashboardSerializer(serializers.Serializer):
    upcoming_visit = VisitSerializer(allow_null=True)
    current_booking = BookingSerializer(allow_null=True)
    payment_reminders = PaymentSerializer(many=True)
    recent_chats = MessageSerializer(many=True)
    suggested_rooms = RoomSerializer(many=True)


class ComplaintSerializer(serializers.ModelSerializer):
    tenant = UserBasicSerializer(read_only=True)
    owner = UserBasicSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='owner', 
        write_only=True,
        required=False
    )
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(), 
        source='room', 
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'tenant', 'owner', 'owner_id', 'room', 'room_id',
            'complaint_type', 'description', 'image', 'status', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']