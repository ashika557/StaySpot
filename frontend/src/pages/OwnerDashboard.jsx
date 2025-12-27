import React from 'react';
import { Home, LayoutDashboard, Calendar, MessageSquare, Settings, Bell } from 'lucide-react';

export default function OwnerDashboard({ user }) {
  const visits = [
    { name: 'Anshu Khadka', location: 'Itahari, Tarahara', date: 'Dec 15, 2025', time: '3:00 PM' },
    { name: 'Hari Sharma', location: 'Riverside Studio', date: 'Dec 16, 2025', time: '10:30 AM' },
    { name: 'Mamata Wagle', location: 'Garden View', date: 'Dec 18, 2025', time: '2:00 PM' }
  ];

  const chats = [
    { name: 'Preety Singh', message: 'Hi! The heating system seems noisy...', time: '2m ago', unread: true },
    { name: 'David Basnet', message: 'Thanks for fixing the water issue!', time: '1h ago' },
    { name: 'Anna Sharma', message: 'Can I get a parking spot closer?', time: '3h ago' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold">StaySpot</div>
            <div className="text-xs text-gray-500">Tenant Portal</div>
          </div>
        </div>
        <nav className="p-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-lg mb-2">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 mb-2">
            <Calendar className="w-5 h-5" /> Upcoming Visits
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 mb-2">
            <MessageSquare className="w-5 h-5" /> Messages
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 mb-2">
            <Settings className="w-5 h-5" /> Settings
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm">Welcome back, {user.full_name}!</p>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-6 h-6 text-gray-400" />
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/150?img=10" className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-semibold text-sm">{user.full_name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Visits */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-bold mb-6">Recent Visit Requests</h2>
            {visits.map((visit, i) => (
              <div key={i} className="flex items-center justify-between pb-4 mb-4 border-b">
                <div className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/150?img=${i + 20}`} className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="font-semibold text-sm">{visit.name}</div>
                    <div className="text-gray-500 text-xs">{visit.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{visit.date}</div>
                  <div className="text-gray-500 text-xs">{visit.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chats */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-bold mb-6">Recent Messages</h2>
            {chats.map((chat, i) => (
              <div key={i} className="pb-4 mb-4 border-b">
                <div className="flex items-start gap-3">
                  <img src={`https://i.pravatar.cc/150?img=${i + 30}`} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm">{chat.name}</div>
                      <div className="text-gray-400 text-xs">{chat.time}</div>
                    </div>
                    <div className="text-gray-600 text-sm">{chat.message}</div>
                    {chat.unread && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
