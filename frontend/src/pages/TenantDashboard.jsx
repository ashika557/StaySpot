import React from 'react';

function TenantDashboard({ user }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.full_name}!
          </h1>
          <p className="text-gray-600 mb-8">Tenant Dashboard</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">Browse Properties</h2>
              <p className="text-gray-700 mb-4">Explore available properties and find your perfect stay</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Browse Now
              </button>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-semibold text-green-900 mb-2">My Bookings</h2>
              <p className="text-gray-700 mb-4">View and manage your current and past bookings</p>
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                View Bookings
              </button>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h2 className="text-xl font-semibold text-purple-900 mb-2">Favorites</h2>
              <p className="text-gray-700 mb-4">Save your favorite properties for later</p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                View Favorites
              </button>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h2 className="text-xl font-semibold text-yellow-900 mb-2">Search Properties</h2>
              <p className="text-gray-700 mb-4">Search for properties by location, price, or amenities</p>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition">
                Search
              </button>
            </div>

            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h2 className="text-xl font-semibold text-red-900 mb-2">Messages</h2>
              <p className="text-gray-700 mb-4">Communicate with property owners</p>
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                View Messages
              </button>
            </div>

            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <h2 className="text-xl font-semibold text-indigo-900 mb-2">Settings</h2>
              <p className="text-gray-700 mb-4">Manage your account settings and preferences</p>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
                Settings
              </button>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-lg font-medium text-gray-900">{user.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-lg font-medium text-gray-900">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantDashboard;

