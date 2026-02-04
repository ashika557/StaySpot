from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .serializers import NotificationSerializer

def send_notification(recipient, actor, notification_type, text, related_id=None):
    """
    Create a notification in database and send it via WebSocket.
    """
    from .models import Notification
    # 1. Save to Database
    notification = Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        text=text,
        related_id=related_id
    )

    # 2. Serialize
    serializer = NotificationSerializer(notification)
    
    # 3. Send via WebSocket
    channel_layer = get_channel_layer()
    group_name = f"user_{recipient.id}_notifications"
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_notification",
            "notification": serializer.data
        }
    )
    
    return notification
