from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, UserSerializer
from django.contrib.auth import get_user_model
from notifications.utils import send_notification

User = get_user_model()

class ChatViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """List all conversations for the current user."""
        conversations = Conversation.objects.filter(
            Q(owner=request.user) | Q(tenant=request.user)
        ).order_by('-updated_at')
        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Start or get a conversation with another user."""
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Determine owner/tenant roles based on request user
        if request.user.role == 'Owner':
            owner, tenant = request.user, other_user
        else:
            owner, tenant = other_user, request.user

        conversation, created = Conversation.objects.get_or_create(
            owner=owner,
            tenant=tenant
        )
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get message history for a conversation."""
        try:
            conversation = Conversation.objects.get(
                Q(id=pk) & (Q(owner=request.user) | Q(tenant=request.user))
            )
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

        # Mark messages as read when fetched
        Message.objects.filter(conversation=conversation, is_read=False).exclude(sender=request.user).update(is_read=True)

        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark all messages in a conversation as read by current user."""
        try:
            conversation = Conversation.objects.get(
                Q(id=pk) & (Q(owner=request.user) | Q(tenant=request.user))
            )
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

        Message.objects.filter(conversation=conversation, is_read=False).exclude(sender=request.user).update(is_read=True)
        return Response({"message": "Messages marked as read"})

    @action(detail=True, methods=['post'])
    def send_media(self, request, pk=None):
        """Send a message with media (image or file)."""
        try:
            conversation = Conversation.objects.get(
                Q(id=pk) & (Q(owner=request.user) | Q(tenant=request.user))
            )
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

        image = request.FILES.get('image')
        file = request.FILES.get('file')
        text = request.data.get('text', '')

        if not image and not file and not text:
            return Response({"error": "No content provided"}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            text=text,
            image=image,
            file=file
        )

        # Update conversation timestamp
        conversation.save() 

        # Send global notification to the other user
        recipient = conversation.tenant if conversation.owner == request.user else conversation.owner
        media_type = 'image' if image else 'file' if file else 'message'
        send_notification(
            recipient=recipient,
            actor=request.user,
            notification_type='message',
            text=f"New {media_type} from {request.user.full_name}",
            related_id=conversation.id
        )

        serializer = MessageSerializer(message)
        return Response(serializer.data)
