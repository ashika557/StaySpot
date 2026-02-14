import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/api';

const NotificationBell = ({ user, isDark = false }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        // Fetch initial notifications
        fetchNotifications();

        // Connect to WebSocket
        notificationService.connect((newNotif) => {
            console.log('Received notification:', newNotif);

            // Safety check: Is this notification actually for us?
            if (newNotif.recipient && newNotif.recipient !== user.id) {
                console.log('Skipping notification intended for another user');
                return;
            }

            setNotifications(prev => {
                // Deduplicate: Don't add if we already have this ID
                if (prev.some(n => n.id === newNotif.id)) {
                    console.log('Skipping duplicate notification ID:', newNotif.id);
                    return prev;
                }

                // Add to start of list
                const updatedList = [newNotif, ...prev];
                setUnreadCount(updatedList.filter(n => !n.is_read).length);
                return updatedList;
            });

            // Optional: Play a sound or show a system notification
        });

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            notificationService.disconnect();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user]);

    const fetchNotifications = async () => {
        const data = await notificationService.getNotifications();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
    };

    const handleMarkAsRead = async (id) => {
        const success = await notificationService.markAsRead(id);
        if (success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleMarkAllAsRead = async () => {
        const success = await notificationService.markAllAsRead();
        if (success) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    const handleNotificationClick = (notification) => {
        handleMarkAsRead(notification.id);

        // Navigate based on type
        if (notification.notification_type === 'message') {
            navigate(ROUTES.CHAT);
        } else if (notification.notification_type.startsWith('booking')) {
            if (user.role === 'Tenant') {
                navigate(ROUTES.TENANT_BOOKINGS);
            } else {
                navigate(ROUTES.OWNER_BOOKINGS);
            }
        } else if (notification.notification_type.startsWith('visit')) {
            if (user.role === 'Tenant') {
                navigate('/tenant/visits');
            } else {
                navigate('/owner/visits');
            }
        } else if (notification.notification_type === 'rent_reminder') {
            navigate(ROUTES.TENANT_PAYMENTS);
        }
        setIsOpen(false);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'booking_request':
            case 'visit_requested': return <Calendar className="w-4 h-4 text-orange-500" />;
            case 'booking_accepted':
            case 'booking_approved':
            case 'visit_approved':
            case 'booking_confirmed': return <Check className="w-4 h-4 text-green-500" />;
            case 'booking_rejected':
            case 'visit_rejected':
            case 'booking_cancelled':
            case 'visit_cancelled': return <Trash2 className="w-4 h-4 text-red-500" />;
            case 'rent_reminder': return <Calendar className="w-4 h-4 text-purple-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-0.5 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-blue-600 font-bold hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-gray-50 last:border-0 cursor-pointer transition-colors flex gap-3 ${!notif.is_read ? 'bg-blue-50/40 hover:bg-blue-50/80' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="mt-1 shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
                                            {getIcon(notif.notification_type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-tight ${!notif.is_read ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                                            {notif.text}
                                        </p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 5 && (
                        <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
                            <button className="text-xs text-gray-500 font-bold flex items-center gap-1 mx-auto hover:text-gray-700">
                                View all notifications
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
