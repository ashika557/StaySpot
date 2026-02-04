import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user = self.scope.get("user")
            
            if not self.user or self.user.is_anonymous:
                await self.accept() # Accept then close to provide a cleaner close
                await self.close(code=4001) # Use a custom close code for debugging
                return

            self.group_name = f"user_{self.user.id}_notifications"
            
            # Join room group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            await self.accept()
            logger.info(f"Notification WebSocket connected for user {self.user.id}")
            
        except Exception as e:
            logger.error(f"Error in NotificationConsumer.connect: {str(e)}")
            # If we haven't accepted yet, this might cause a 500 error during handshake
            # So we try to accept and then close if an error occurred
            try:
                await self.accept()
                await self.close()
            except:
                pass

    async def disconnect(self, close_code):
        try:
            if hasattr(self, "group_name"):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
        except Exception as e:
            logger.error(f"Error in NotificationConsumer.disconnect: {str(e)}")

    async def send_notification(self, event):
        try:
            await self.send(text_data=json.dumps(event["notification"]))
        except Exception as e:
            logger.error(f"Error in NotificationConsumer.send_notification: {str(e)}")
