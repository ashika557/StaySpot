from django.test import TestCase, Client
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
            username='owner@chat.com',
            email='owner@chat.com',
            password='Pass@123',
            full_name='Chat Owner',
            phone='9800000010',
            role='Owner',
            is_active=True
        )
        self.tenant = User.objects.create_user(
            username='tenant@chat.com',
            email='tenant@chat.com',
            password='Pass@123',
            full_name='Chat Tenant',
            phone='9800000011',
            role='Tenant',
            is_active=True
        )

    def test_create_conversation(self):
        """Should successfully create a conversation between owner and tenant."""
        conv = Conversation.objects.create(
            owner=self.owner,
            tenant=self.tenant
        )
        self.assertEqual(conv.owner, self.owner)
        self.assertEqual(conv.tenant, self.tenant)

    def test_conversation_string_representation(self):
        """Conversation __str__ should mention both participants."""
        conv = Conversation.objects.create(
            owner=self.owner,
            tenant=self.tenant
        )
        self.assertIn('Chat Owner', str(conv))
        self.assertIn('Chat Tenant', str(conv))

    def test_duplicate_conversation_not_allowed(self):
        """Same owner-tenant pair cannot have two conversations."""
        from django.db import IntegrityError
        Conversation.objects.create(owner=self.owner, tenant=self.tenant)
        with self.assertRaises(IntegrityError):
            Conversation.objects.create(owner=self.owner, tenant=self.tenant)


class MessageModelTests(TestCase):
    """
    UNIT TESTS — Message Model
    Tests message creation, ordering, and read status.
    """

    def setUp(self):
        self.owner = User.objects.create_user(
            username='msgowner@chat.com',
            email='msgowner@chat.com',
            password='Pass@123',
            full_name='Message Owner',
            phone='9800000012',
            role='Owner',
            is_active=True
        )
        self.tenant = User.objects.create_user(
            username='msgtenant@chat.com',
            email='msgtenant@chat.com',
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
        msg = Message.objects.create(
            conversation=self.conversation,
            sender=self.owner,
            text='Hello, is the room available?'
        )
        self.assertEqual(msg.text, 'Hello, is the room available?')
        self.assertFalse(msg.is_read)

    def test_message_is_unread_by_default(self):
        """New messages should default to unread."""
        msg = Message.objects.create(
            conversation=self.conversation,
            sender=self.tenant,
            text='Yes, it is!'
        )
        self.assertFalse(msg.is_read)

    def test_mark_message_as_read(self):
        """Marking a message as read should update is_read flag."""
        msg = Message.objects.create(
            conversation=self.conversation,
            sender=self.owner,
            text='Please confirm your visit date.'
        )
        msg.is_read = True
        msg.save()
        msg.refresh_from_db()
        self.assertTrue(msg.is_read)

    def test_messages_ordered_by_timestamp(self):
        """Messages should be returned oldest first."""
        msg1 = Message.objects.create(
            conversation=self.conversation, sender=self.owner, text='First message'
        )
        msg2 = Message.objects.create(
            conversation=self.conversation, sender=self.tenant, text='Second message'
        )
        messages = Message.objects.filter(conversation=self.conversation)
        self.assertEqual(messages[0].text, 'First message')
        self.assertEqual(messages[1].text, 'Second message')


class ChatApiIntegrationTests(TestCase):
    """
    INTEGRATION TESTS — Chat API Endpoints
    Tests the conversations list endpoint for authenticated users.
    """

    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user(
            username='apiowner@chat.com',
            email='apiowner@chat.com',
            password='Pass@123',
            full_name='API Owner',
            phone='9800000014',
            role='Owner',
            is_active=True
        )
        self.tenant = User.objects.create_user(
            username='apitenant@chat.com',
            email='apitenant@chat.com',
            password='Pass@123',
            full_name='API Tenant',
            phone='9800000015',
            role='Tenant',
            is_active=True
        )

    def test_unauthenticated_cannot_access_chat(self):
        """Unauthenticated requests to chat endpoint should fail."""
        response = self.client.get('/api/chat/')
        self.assertIn(response.status_code, [401, 403, 302])

    def test_authenticated_user_can_list_conversations(self):
        """Logged-in user should be able to view their conversations."""
        # Create a conversation
        Conversation.objects.create(owner=self.owner, tenant=self.tenant)

        # Log in as owner
        self.client.post('/api/login/', {
            'email': 'apiowner@chat.com',
            'password': 'Pass@123',
            'role': 'Owner'
        })

        response = self.client.get('/api/chat/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

    def test_conversation_privacy_isolation(self):
        """A tenant should NOT see conversations between an owner and a different tenant."""
        # Setup: Conv between OWNER & TENANT-1
        Conversation.objects.create(owner=self.owner, tenant=self.tenant)

        # 1. Create TENANT-2 (Hacker)
        hacker = User.objects.create_user(
            username='stranger@chat.com', email='stranger@chat.com', 
            password='Pass@123', role='Tenant'
        )
        self.client.force_login(hacker)
        
        # 2. Try to view conversation list
        response = self.client.get('/api/chat/')
        
        # 3. List should be EMPTY for the hacker
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 0)
