import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Smile, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { chatService } from '../services/chatService';
import { Navigate, useNavigate } from 'react-router-dom';
import { ROUTES, getMediaUrl } from '../constants/api';
import Sidebar from './sidebar';
import TenantSidebar from './TenantNavbar';
import { useLocation } from 'react-router-dom';

const Chat = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Initial Load
    useEffect(() => {
        if (!user) return;
        fetchConversations();

        // Handle auto-start conversation from query params
        const params = new URLSearchParams(location.search);
        const autoUserId = params.get('userId');
        if (autoUserId) {
            handleAutoStartChat(autoUserId);
        }

        return () => {
            chatService.disconnect();
        };
    }, [user, location.search]);

    const handleAutoStartChat = async (userId) => {
        try {
            const data = await chatService.startConversation(userId);
            setActiveChat(data);
            fetchConversations();
        } catch (error) {
            console.error('Failed to auto-start chat:', error);
        }
    };

    // Connect WebSocket when active chat changes
    useEffect(() => {
        if (activeChat) {
            setMessages([]); // Clear previous messages while loading
            fetchMessages(activeChat.id);

            chatService.connect(activeChat.id, (event) => {
                if (event.type === 'message') {
                    setMessages(prev => [...prev, event]);
                    // If we are looking at the chat, mark as read
                    chatService.sendSeenEvent(user.id, activeChat.id);
                } else if (event.type === 'seen') {
                    // Update read status in UI for other user's seen event
                    if (event.user_id !== user.id) {
                        setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
                    }
                }
            });

            // Mark existing messages as read
            chatService.markAsRead(activeChat.id);
            chatService.sendSeenEvent(user.id, activeChat.id);
        }
    }, [activeChat, user.id]);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const data = await chatService.getConversations();
            setConversations(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load conversations', error);
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const data = await chatService.getMessages(conversationId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        chatService.sendMessage(newMessage, user.id);
        setNewMessage('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeChat) return;

        try {
            setUploading(true);
            await chatService.sendMedia(activeChat.id, file, '', user.id, user.full_name);
            setUploading(false);
        } catch (error) {
            console.error('Media upload failed:', error);
            setUploading(false);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.other_user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return <Navigate to={ROUTES.LOGIN} />;

    return (
        <div className="flex h-screen bg-gray-50">
            {user?.role === 'Owner' ? <Sidebar /> : <TenantSidebar />}

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-xl overflow-hidden flex transition-all duration-300">
                    {/* Sidebar */}
                    <div className={`w-full md:w-1/3 bg-white border-r border-gray-100 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                    {user.profile_photo ? (
                                        <img src={getMediaUrl(user.profile_photo)} alt={user.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        user.full_name[0]
                                    )}
                                </div>
                                <h2 className="font-bold text-gray-800">Messages</h2>
                            </div>
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                            ) : filteredConversations.length > 0 ? (
                                filteredConversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setActiveChat(conv)}
                                        className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-l-4 hover:bg-gray-50
                                            ${activeChat?.id === conv.id ? 'border-blue-600 bg-blue-50/30' : 'border-transparent'}
                                        `}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm overflow-hidden">
                                            {conv.other_user.profile_photo ? (
                                                <img src={getMediaUrl(conv.other_user.profile_photo)} alt={conv.other_user.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                conv.other_user.full_name[0]
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h3 className="text-sm font-bold truncate text-gray-800">{conv.other_user.full_name}</h3>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                {conv.last_message?.text || (conv.last_message?.image ? 'Shared an image' : conv.last_message?.file ? 'Shared a file' : 'No messages')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400"><p>No conversations found</p></div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={`w-full md:w-2/3 bg-white flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                        {activeChat ? (
                            <>
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden">
                                            {activeChat.other_user.profile_photo ? (
                                                <img src={getMediaUrl(activeChat.other_user.profile_photo)} alt={activeChat.other_user.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                activeChat.other_user.full_name[0]
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{activeChat.other_user.full_name}</h3>
                                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><MoreVertical className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 custom-scrollbar space-y-4">
                                    {messages.map((msg, index) => {
                                        const isMe = msg.sender === user.id || msg.sender_id === user.id;
                                        return (
                                            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm relative group ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                                                    {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text || msg.message}</p>}

                                                    {msg.image && (
                                                        <div className="mt-2 rounded-lg overflow-hidden border border-white/20">
                                                            <img src={getMediaUrl(msg.image)} alt="Shared" className="max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(getMediaUrl(msg.image), '_blank')} />
                                                        </div>
                                                    )}
                                                    {msg.media_url && msg.media_type === 'image' && (
                                                        <div className="mt-2 rounded-lg overflow-hidden border border-white/20">
                                                            <img src={getMediaUrl(msg.media_url)} alt="Shared" className="max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(getMediaUrl(msg.media_url), '_blank')} />
                                                        </div>
                                                    )}

                                                    {msg.file && (
                                                        <a href={getMediaUrl(msg.file)} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 p-2 rounded-lg transition-colors ${isMe ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-100 hover:bg-gray-200'} `}>
                                                            <Paperclip className="w-4 h-4" />
                                                            <span className="text-xs truncate max-w-[150px]">View Attachment</span>
                                                        </a>
                                                    )}
                                                    {msg.media_url && msg.media_type === 'file' && (
                                                        <a href={getMediaUrl(msg.media_url)} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 p-2 rounded-lg transition-colors ${isMe ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-100 hover:bg-gray-200'} `}>
                                                            <Paperclip className="w-4 h-4" />
                                                            <span className="text-xs truncate max-w-[150px]">View Attachment</span>
                                                        </a>
                                                    )}

                                                    <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1.5 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {isMe && (
                                                            <span>{msg.is_read ? <CheckCheck className="w-3.5 h-3.5" title="Seen" /> : <Check className="w-3.5 h-3.5" title="Sent" />}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-all">
                                        {uploading ? <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" /> : <Paperclip className="w-5 h-5" />}
                                    </button>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Type message here..."
                                            className="w-full pl-5 pr-12 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <button type="button" className="absolute right-3 top-2.5 text-gray-300 hover:text-gray-500 transition-colors"><Smile className="w-5 h-5" /></button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || uploading}
                                        className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                                <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                                    <Send className="w-10 h-10 text-blue-200 transform rotate-12" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-700">Select a Conversation</h3>
                                <p className="max-w-xs text-center text-sm mt-3 leading-relaxed text-gray-500">
                                    Connect with owners or tenants to discuss room details and bookings.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
