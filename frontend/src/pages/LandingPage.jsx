import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Map, Calendar, MessageSquare, Star, CreditCard, MapPin, Shield, Zap, Twitter, Facebook, Linkedin } from 'lucide-react';
import Footer from '../components/Footer';

// This is the main landing page for StaySpot. 
// It shows different buttons if the user is logged in or not.
export default function StaySpotLanding({ onGetStarted, onSignIn, user }) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo and name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">StaySpot</span>
          </div>
          
          {/* Navigation links (hidden on small screens) */}
          <nav className="hidden md:flex gap-8">
            <a href="#" className="text-gray-600">Home</a>
            <a href="#" className="text-gray-600">About</a>
            <a href="#" className="text-gray-600">Features</a>
            <a href="#" className="text-gray-600">Contact</a>
          </nav>
          
          {/* Login / Dashboard buttons */}
          <div className="flex gap-3">
            {!user ? (
              // If nobody is logged in, show Sign In and Get Started
              <>
                <button
                  className="px-4 py-2 text-blue-600"
                  onClick={() => {
                    if (onSignIn) onSignIn();
                    navigate('/login'); // Go to login page
                  }}
                >
                  Sign In
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => {
                    if (onGetStarted) onGetStarted();
                    navigate('/register'); // Go to register page
                  }}
                >
                  Get Started
                </button>
              </>
            ) : (
              // If user is logged in, show button to go to their dashboard
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
                onClick={() => {
                  if (onGetStarted) onGetStarted();
                  // Go to owner dashboard if role is Owner, else go to tenant dashboard
                  navigate(user.role === 'Owner' ? '/owner/dashboard' : '/tenant/dashboard');
                }}
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-5xl font-bold mb-4">StaySpot</h1>
            <p className="text-xl">Smart, transparent, and modern room-renting in Nepal.</p>
          </div>
          <div className="hidden md:block">
            {/* Example image of a room */}
            <img src="https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop" alt="room" className="w-80 h-64 rounded-xl" />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          {/* Small icon on top */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-600">StaySpot makes room renting simple with smart search, interactive maps, secure chat, digital payments, and reliable owner-tenant connections.</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">What We Provide</h2>
            <p className="text-gray-600">All the tools you need for modern room renting</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Looping through features instead of writing each one separately */}
            {[
              { icon: Home, title: 'Smart Search Filters', desc: 'Filter rooms by location, price, amenities easily.' },
              { icon: Map, title: 'Interactive Map View', desc: 'See available rooms on a map and find the best location.' },
              { icon: Calendar, title: 'Online Booking & Visits', desc: 'Book rooms and schedule visits without hassle.' },
              { icon: MessageSquare, title: 'Secure Chat', desc: 'Chat safely with property owners.' },
              { icon: Star, title: 'Reviews & Ratings', desc: 'Check honest reviews from previous tenants.' },
              { icon: CreditCard, title: 'Online Payments', desc: 'Pay online safely with automated reminders.' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Why Choose StaySpot</h2>
            <p className="text-gray-600">Three reasons why our platform is trusted</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: 'Verified Rooms', desc: 'All listings are checked to make sure they are real.' },
              { icon: Shield, title: 'Safe Communication', desc: 'Your privacy is protected when messaging.' },
              { icon: Zap, title: 'Fast & Transparent', desc: 'Quick bookings with no hidden fees.' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">StaySpot started because finding a good rental in Nepal was hard. Old methods were slow and unsafe.</p>
            <p className="text-gray-600 mb-4">We made a digital platform to connect tenants and owners with trust, security, and ease.</p>
            <p className="text-gray-600">Now, StaySpot is helping people find rooms faster and smarter in Nepal.</p>
          </div>
          <div className="hidden md:block flex-1">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=400&fit=crop" alt="team" className="rounded-xl" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">How It Works</h2>
            <p className="text-gray-600">Four simple steps to get your room</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Search & Filter', desc: 'Use filters to find rooms in your budget' },
              { num: '2', title: 'View & Compare', desc: 'Check rooms on a map and compare details' },
              { num: '3', title: 'Book or Visit', desc: 'Book online or visit the room' },
              { num: '4', title: 'Move In', desc: 'Complete payment and settle in easily' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">{item.num}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}