from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'actor', 'actor_name', 'notification_type', 'text', 'related_id', 'is_read', 'created_at']

    def get_actor_name(self, obj):
        return obj.actor.full_name if obj.actor else "System"
