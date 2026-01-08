from rest_framework import serializers
from .models import Room, RoomImage

class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ['id', 'image', 'uploaded_at']


class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Room
        fields = [
            'id', 'title', 'location', 'room_number', 'room_type',
            'floor', 'size', 'price', 'status', 'wifi', 'ac', 'tv',
            'gender_preference', 'latitude', 'longitude',  # NEW FIELDS
            'views', 'images', 'uploaded_images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'views', 'created_at', 'updated_at']
    
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