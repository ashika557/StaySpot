from django.test import TestCase
from django.utils import timezone
from accounts.models import User
from .models import Conversation, Message


class ConversationModelTests(TestCase):
    """
    UNIT TESTS — Conversation Model
    Tests conversation creation and participant constraints.
    """

    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner@gmail.com',
            email='owner@gmail.com',
            password='Pass@123',
            full_name='Chat Owner',
            phone='9800000010',
            role='Owner',
            is_active=True
        )
        self.tenant = User.objects.create_user(
            username='tenant@gmail.com',
            email='tenant@gmail.com',
            password='Pass@123',
            full_name='Chat Tenant',
            phone='9800000011',
            role='Tenant',
            is_active=True
        )

    def test_create_conversation(self):
        """Should successfully create a conversation between owner and tenant."""
        print("\n[RUNNING]: test_create_conversation")
        conv = Conversation.objects.create(
            owner=self.owner,
            tenant=self.tenant
        )
        self.assertEqual(conv.owner, self.owner)
        self.assertEqual(conv.tenant, self.tenant)
        print("[RESULT]: SUCCESS - Conversation created between owner and tenant.")

    def test_conversation_string_representation(self):
        """Conversation __str__ should mention both participants."""
        print("\n[RUNNING]: test_conversation_string_representation")
        conv = Conversation.objects.create(
            owner=self.owner,
            tenant=self.tenant
        )
        self.assertIn('Chat Owner', str(conv))
        self.assertIn('Chat Tenant', str(conv))
        print("[RESULT]: SUCCESS - Conversation string representation is correct.")

    def test_duplicate_conversation_not_allowed(self):
        """Same owner-tenant pair cannot have two conversations."""
        print("\n[RUNNING]: test_duplicate_conversation_not_allowed")
        from django.db import IntegrityError
        Conversation.objects.create(owner=self.owner, tenant=self.tenant)
        with self.assertRaises(IntegrityError):
            Conversation.objects.create(owner=self.owner, tenant=self.tenant)
        print("[RESULT]: SUCCESS - Duplicate conversation correctly blocked.")


class MessageModelTests(TestCase):
    """
    UNIT TESTS — Message Model
    Tests message creation, ordering, and read status.
    """

    def setUp(self):
        self.owner = User.objects.create_user(
            username='msgowner@gmail.com',
            email='msgowner@gmail.com',
            password='Pass@123',
            full_name='Message Owner',
            phone='9800000012',
            role='Owner',
            is_active=True
        )
        self.tenant = User.objects.create_user(
            username='msgtenant@gmail.com',
            email='msgtenant@gmail.com',
            password='Pass@123',
            full_name='Message Tenant',
            phone='9800000013',
            role='Tenant',
            is_active=True
        )
        self.conversation = Conversation.objects.create(
            owner=self.owner,
            tenant=self.tenant
        )

    def test_create_message(self):
        """Owner should be able to send a message in the conversation."""
        print("\n[RUNNING]: test_create_message")
        msg = Message.objects.create(
            conversation=self.conversation,
            sender=self.owner,
            text='Hello, is the room available?'
        )
        self.assertEqual(msg.text, 'Hello, is the room available?')
        self.assertFalse(msg.is_read)
        print("[RESULT]: SUCCESS - Message created successfully.")

    def test_message_is_unread_by_default(self):
        """New messages should default to unread."""
        print("\n[RUNNING]: test_message_is_unread_by_default")
        msg = Message.objects.create(
            conversation=self.conversation,
            sender=self.tenant,
            text='Yes, it is!'
        )
        self.assertFalse(msg.is_read)
        print("[RESULT]: SUCCESS - New message defaults to unread.")

    def test_mark_message_as_read(self):
        """Marking a message as read should update is_read flag."""
        print("\n[RUNNING]: test_mark_message_as_read")
        msg = Message.objects.create(
            conversation=self.conversation,
            sender=self.owner,
            text='Please confirm your visit date.'
        )
        msg.is_read = True
        msg.save()
        msg.refresh_from_db()
        self.assertTrue(msg.is_read)
        print("[RESULT]: SUCCESS - Message successfully marked as read.")

    def test_messages_ordered_by_timestamp(self):
        """Messages should be returned oldest first."""
        print("\n[RUNNING]: test_messages_ordered_by_timestamp")
        msg1 = Message.objects.create(
            conversation=self.conversation, sender=self.owner, text='First message'
        )
        msg2 = Message.objects.create(
            conversation=self.conversation, sender=self.tenant, text='Second message'
        )
        messages = Message.objects.filter(conversation=self.conversation)
        self.assertEqual(messages[0].text, 'First message')
        self.assertEqual(messages[1].text, 'Second message')
        print("[RESULT]: SUCCESS - Messages are correctly ordered by timestamp.")


class ChatIntegrationTests(TestCase):
    """
    INTEGRATION TESTS — Chat API
    Tests the main chat listing and access control.
    """
    def setUp(self):
        from django.test import Client
        self.client = Client()
        self.user = User.objects.create_user(
            username='chat_inc@gmail.com', email='chat_inc@gmail.com', password='123', role='Tenant'
        )

    def test_unauthenticated_cannot_access_chat_api(self):
        """Chat API should block unauthenticated users."""
        print("\n[RUNNING]: test_unauthenticated_cannot_access_chat_api")
        response = self.client.get('/api/chat/')
        self.assertIn(response.status_code, [401, 403, 302])
        print(f"[RESULT]: SUCCESS - Chat access correctly denied (Status {response.status_code}).")

    def test_authenticated_can_access_chat_api(self):
        """Logged-in user should get 200 from chat API."""
        print("\n[RUNNING]: test_authenticated_can_access_chat_api")
        self.client.force_login(self.user)
        response = self.client.get('/api/chat/')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        print("[RESULT]: SUCCESS - Authenticated chat API call returned 200 OK.")
