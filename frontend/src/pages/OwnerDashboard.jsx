import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import { Home, Calendar, DollarSign, Bell } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function OwnerDashboard({ user }) {
  const [totalRooms, setTotalRooms] = useState(0);
  const [availableRooms, setAvailableRooms] = useState(0);
  const [occupiedRooms, setOccupiedRooms] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch room data when component loads
  useEffect(() => {
    getRoomData();
  }, []);

  // Function to get room statistics from backend
  async function getRoomData() {
    try {
      console.log('Fetching rooms from: /rooms/');
      
      const response = await apiRequest('/rooms/');

      console.log('Response status:', response.status);

      if (response.ok) {
        const rooms = await response.json();
        console.log('Rooms data:', rooms);
        
        // Count total rooms
        setTotalRooms(rooms.length);
        console.log('Total rooms:', rooms.length);
        
        // Count available rooms
        const available = rooms.filter(room => room.status === 'Available').length;
        setAvailableRooms(available);
        console.log('Available rooms:', available);
        
        // Count occupied rooms
        const occupied = rooms.filter(room => room.status === 'Occupied').length;
        setOccupiedRooms(occupied);
        console.log('Occupied rooms:', occupied);
        
        // TODO: Calculate income later
        setTotalIncome(0);
      } else {
        console.error('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="bg-white border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user?.full_name}! Here's what's happening with your properties.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full relative">
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                <Bell className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/150?img=10" alt="Profile" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-sm font-semibold">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading dashboard...</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6 mb-8">
              {/* Card 1: Total Rooms */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Total Rooms Listed</p>
                    <p className="text-3xl font-bold">{totalRooms}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-blue-600">Active listings</p>
              </div>

              {/* Card 2: Available Rooms */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Available Rooms</p>
                    <p className="text-3xl font-bold">{availableRooms}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-green-600">Ready for booking</p>
              </div>

              {/* Card 3: Occupied Rooms */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Occupied Rooms</p>
                    <p className="text-3xl font-bold">{occupiedRooms}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-orange-100">
                    <Home className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-orange-600">Currently rented</p>
              </div>

              {/* Card 4: Total Income */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Total Income</p>
                    <p className="text-3xl font-bold">Rs {totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </div>
          )}

          {/* Bottom Section with two columns */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column: Visit Requests */}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Visit Requests</h3>
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  3 New
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <img src="https://i.pravatar.cc/150?img=20" className="w-10 h-10 rounded-full" alt="" />
                    <div>
                      <p className="font-semibold">Anshu Khadka</p>
                      <p className="text-sm text-gray-500">Itahari, Tarahara</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Dec 15, 2025</p>
                    <p className="text-xs text-gray-500">2:00 PM</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <img src="https://i.pravatar.cc/150?img=21" className="w-10 h-10 rounded-full" alt="" />
                    <div>
                      <p className="font-semibold">Hari Sharma</p>
                      <p className="text-sm text-gray-500">Riverside Studio</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Dec 16, 2025</p>
                    <p className="text-xs text-gray-500">10:30 AM</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <img src="https://i.pravatar.cc/150?img=22" className="w-10 h-10 rounded-full" alt="" />
                    <div>
                      <p className="font-semibold">Mamata Wagle</p>
                      <p className="text-sm text-gray-500">Garden View</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Dec 18, 2025</p>
                    <p className="text-xs text-gray-500">4:00 PM</p>
                  </div>
                </div>

                <button className="w-full mt-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg">
                  View All Requests
                </button>
              </div>
            </div>

            {/* Right Column: Tenant Chats */}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Recent Tenant Chats</h3>
              </div>
              <div className="p-6">
                <div className="py-3 border-b">
                  <div className="flex items-start gap-3">
                    <img src="https://i.pravatar.cc/150?img=30" className="w-10 h-10 rounded-full" alt="" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">Preety Singh</p>
                        <span className="text-xs text-gray-500">2m ago</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Hi! The heating system seems to be making some noise. Could you...
                      </p>
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                  </div>
                </div>

                <div className="py-3 border-b">
                  <div className="flex items-start gap-3">
                    <img src="https://i.pravatar.cc/150?img=31" className="w-10 h-10 rounded-full" alt="" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">David Basnet</p>
                        <span className="text-xs text-gray-500">1h ago</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Thank you for fixing the water pressure issue so quickly!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-3">
                  <div className="flex items-start gap-3">
                    <img src="https://i.pravatar.cc/150?img=32" className="w-10 h-10 rounded-full" alt="" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">Anna Sharma</p>
                        <span className="text-xs text-gray-500">2h ago</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Is it possible to get a parking spot closer to the entrance?
                      </p>
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg">
                  View All Messages
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}