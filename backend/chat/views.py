from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, UserSerializer
from django.contrib.auth import get_user_model

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

        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
