import React from 'react';
import { Home, LayoutDashboard, Search, Calendar, AlertTriangle, MessageSquare, DollarSign, User, Bell } from 'lucide-react';

export default function TenantDashboard({ user }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div className="text-xl font-bold text-blue-600">Stay Spot</div>
          </div>
        </div>
        
        <nav className="p-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-lg mb-2">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 mb-2">
            <Search className="w-5 h-5" />
            Search Rooms
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 mb-2">
            <Calendar className="w-5 h-5" />
            Bookings
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            Complaints & Reviews
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 mb-2">
            <MessageSquare className="w-5 h-5" />
            Chat
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 mb-2">
            <DollarSign className="w-5 h-5" />
            Payments
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 mb-2">
            <User className="w-5 h-5" />
            Profile
          </a>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">{user?.full_name || "User"}</div>
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full" />
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Upcoming Visit */}
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Upcoming Visit</h2>
                  <div className="text-sm text-gray-500">Today, 3:00 PM</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="https://i.pravatar.cc/150?img=8" className="w-12 h-12 rounded-full" />
                    <div>
                      <div className="font-semibold">Meeting with Ramesh Basnet</div>
                      <div className="text-sm text-gray-500">Room viewing at Bargaon, Dharan</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">View Details</button>
                </div>
              </div>

              {/* Current Booking */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Current Booking</h2>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="font-semibold">Deluxe Room - Dharan</div>
                    <div className="text-sm text-gray-500">Booked from Jan 15 - Feb 15, 2025</div>
                    <div className="text-sm text-gray-500">Tenant: Sita Sharma</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">₹12,000/month</div>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full mt-2">Active</span>
                  </div>
                </div>
              </div>

              {/* Suggested Rooms */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Suggested Rooms</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="font-semibold">Single Room</div>
                      <div className="text-xs">in Bargaon</div>
                      <div className="text-sm font-bold mt-1">₹10,000/month</div>
                    </div>
                  </div>
                  <div className="relative rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&h=300&fit=crop" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="font-semibold">Double Room</div>
                      <div className="text-xs">luxe, Dharan</div>
                      <div className="text-sm font-bold mt-1">₹15,000/month</div>
                    </div>
                  </div>
                  <div className="relative rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="font-semibold">Nice Apartment</div>
                      <div className="text-xs">Bhatbhateni, Itahari</div>
                      <div className="text-sm font-bold mt-1">₹20,000/month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Payment Reminders */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Payment Reminders</h2>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm">Rent Due</div>
                      <div className="text-red-600 font-bold">₹12,000</div>
                    </div>
                    <div className="text-xs text-gray-600">Sita Sharma - Room 101</div>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm">Due Soon</div>
                      <div className="text-orange-600 font-bold">₹8,500</div>
                    </div>
                    <div className="text-xs text-gray-600">Krishna Tamang - Room 205</div>
                  </div>
                </div>
              </div>

              {/* Recent Chats */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Recent Chats</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <img src="https://i.pravatar.cc/150?img=12" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm">Pravin Ghimire</div>
                        <div className="text-xs text-gray-400">2m ago</div>
                      </div>
                      <div className="text-xs text-gray-600">Interested in the studio apartment...</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <img src="https://i.pravatar.cc/150?img=13" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm">Manoj Rai</div>
                        <div className="text-xs text-gray-400">5m ago</div>
                      </div>
                      <div className="text-xs text-gray-600">When can I visit the room?</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <img src="https://i.pravatar.cc/150?img=14" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm">Sunita Poudel</div>
                        <div className="text-xs text-gray-400">1h ago</div>
                      </div>
                      <div className="text-xs text-gray-600">Thank you for the quick response</div>
                    </div>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium mt-4">View All Chats</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}