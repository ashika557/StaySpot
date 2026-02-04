import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message
from django.contrib.auth import get_user_model
from django.utils import timezone
from notifications.utils import send_notification

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type')

        if event_type == 'chat_message':
            message_text = data.get('message')
            sender_id = data.get('sender_id')
            media_url = data.get('media_url')
            media_type = data.get('media_type') # 'image' or 'file'

            if not message_text and not media_url:
                return

            # Save text message to database (media messages are saved via API first)
            if not media_url:
                saved_msg = await self.save_message(sender_id, message_text)
                timestamp = saved_msg.timestamp.isoformat()
                sender_name = saved_msg.sender.full_name
                msg_id = saved_msg.id
            else:
                timestamp = timezone.now().isoformat()
                sender_name = data.get('sender_name', 'User')
                msg_id = data.get('msg_id')

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat.message',
                    'text': message_text,
                    'sender_id': sender_id,
                    'sender_name': sender_name,
                    'timestamp': timestamp,
                    'media_url': media_url,
                    'media_type': media_type,
                    'msg_id': msg_id
                }
            )
        
        elif event_type == 'message_seen':
            # Broadcast that message was seen
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat.seen',
                    'user_id': data.get('user_id'),
                    'conversation_id': self.conversation_id
                }
            )

    # Receive message from room group
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'text': event.get('text'),
            'sender_id': event.get('sender_id'),
            'sender_name': event.get('sender_name'),
            'timestamp': event.get('timestamp'),
            'media_url': event.get('media_url'),
            'media_type': event.get('media_type'),
            'id': event.get('msg_id')
        }))

    async def chat_seen(self, event):
        await self.send(text_data=json.dumps({
            'type': 'seen',
            'user_id': event.get('user_id'),
            'conversation_id': event.get('conversation_id')
        }))

    @database_sync_to_async
    def save_message(self, sender_id, message_text):
        conversation = Conversation.objects.get(id=self.conversation_id)
        sender = User.objects.get(id=sender_id)
        msg = Message.objects.create(
            conversation=conversation,
            sender=sender,
            text=message_text
        )
        conversation.updated_at = timezone.now()
        conversation.save()

        # Send global notification to the other user
        recipient = conversation.tenant if conversation.owner == sender else conversation.owner
        send_notification(
            recipient=recipient,
            actor=sender,
            notification_type='message',
            text=f"New message from {sender.full_name}: {message_text[:30]}...",
            related_id=conversation.id
        )

        return msg
