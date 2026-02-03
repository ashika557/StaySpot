import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Smile, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { chatService } from '../services/chatService';
import { Navigate, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/api';
import Sidebar from './sidebar';
import TenantSidebar from './TenantNavbar';

const Chat = ({ user }) => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    // Initial Load
    useEffect(() => {
        if (!user) return;
        fetchConversations();

        return () => {
            chatService.disconnect();
        };
    }, [user]);

    // Connect WebSocket when active chat changes
    useEffect(() => {
        if (activeChat) {
            setMessages([]); // Clear previous messages while loading
            fetchMessages(activeChat.id);
            chatService.connect(activeChat.id, (incomingMessage) => {
                setMessages(prev => [...prev, incomingMessage]);
            });
        }
    }, [activeChat]);

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

    const filteredConversations = conversations.filter(c =>
        c.other_user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return <Navigate to={ROUTES.LOGIN} />;

    return (
        <div className="flex h-screen bg-gray-50">
            {user?.role === 'Owner' ? <Sidebar /> : <TenantSidebar />}

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-xl overflow-hidden flex">
                    {/* Sidebar */}
                    <div className={`w-full md:w-1/3 bg-white border-r border-gray-100 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {user.full_name[0]}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800">Messages</h2>
                                    <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm transition-all text-gray-700 placeholder-gray-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Conversation List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : filteredConversations.length > 0 ? (
                                filteredConversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setActiveChat(conv)}
                                        className={`p-4 flex items-center gap-3 cursor-pointer transition-all border-l-4 hover:bg-gray-50
                                            ${activeChat?.id === conv.id ? 'border-blue-600 bg-blue-50/30' : 'border-transparent'}
                                        `}
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-100 to-blue-100 flex items-center justify-center text-gray-700 font-bold border-2 border-white shadow-sm">
                                                {conv.other_user.full_name[0]}
                                            </div>
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className={`text-sm font-bold truncate ${activeChat?.id === conv.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                                    {conv.other_user.full_name}
                                                </h3>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate pr-4">
                                                {conv.last_message ? conv.last_message.text : 'Start a conversation...'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400">
                                    <p>No conversations found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={`w-full md:w-2/3 bg-white flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                        {activeChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-gray-500">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-100 to-blue-100 flex items-center justify-center text-gray-700 font-bold">
                                            {activeChat.other_user.full_name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{activeChat.other_user.full_name}</h3>
                                            <p className="text-xs text-gray-500">Online now</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition"><Phone className="w-5 h-5" /></button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition"><Video className="w-5 h-5" /></button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition"><MoreVertical className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar space-y-4">
                                    {messages.map((msg, index) => {
                                        const isMe = msg.sender === user.id;
                                        return (
                                            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm relative group ${isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed">{msg.text || msg.message}</p>
                                                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-blue-100' : 'text-gray-400'
                                                        }`}>
                                                        <span>
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && (
                                                            <CheckCheck className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
                                    <button type="button" className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <button type="button" className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                            <Smile className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-3 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                    <Send className="w-10 h-10 text-gray-400 ml-1" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700">Your Messages</h3>
                                <p className="max-w-xs text-center text-sm mt-2">
                                    Select a conversation from the left to start chatting with your tenants or owners.
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
