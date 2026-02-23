import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Home, Map, Calendar, MessageSquare, Star, CreditCard, MapPin, Shield, Zap, Twitter, Facebook, Linkedin } from 'lucide-react';
import Footer from '../components/Footer';

export default function StaySpotLanding({ onGetStarted, onSignIn, user }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">StaySpot</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#" className="text-gray-600">Home</a>
            <a href="#" className="text-gray-600">About</a>
            <a href="#" className="text-gray-600">Features</a>
            <a href="#" className="text-gray-600">Contact</a>
          </nav>
          <div className="flex gap-3">
            {!user ? (
              <>
                <button
                  className="px-4 py-2 text-blue-600"
                  onClick={() => {
                    if (onSignIn) onSignIn();
                    navigate('/login');
                  }}
                >
                  Sign In
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => {
                    if (onGetStarted) onGetStarted();
                    navigate('/register');
                  }}
                >
                  Get Started
                </button>
              </>
            ) : (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
                onClick={() => {
                  if (onGetStarted) onGetStarted();
                  navigate(user.role === 'Owner' ? '/owner/dashboard' : '/tenant/dashboard');
                }}
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-5xl font-bold mb-4">StaySpot</h1>
            <p className="text-xl">Smart, transparent, and modern room-renting in Nepal.</p>
          </div>
          <div className="hidden md:block">
            <img src="https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop" alt="room" className="w-80 h-64 rounded-xl" />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-600">StaySpot makes room renting simple with smart search, interactive maps, secure chat, digital payments, and reliable owner-tenant connections.</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">What We Provide</h2>
            <p className="text-gray-600">Comprehensive features for modern room renting</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Home, title: 'Smart Search Filters', desc: 'Advanced filtering options to find your perfect room based on location, price, and amenities.' },
              { icon: Map, title: 'Interactive Map View', desc: 'Explore available rooms on an interactive map to find the best location for you.' },
              { icon: Calendar, title: 'Online Booking & Visits', desc: 'Book rooms online and schedule visits with property owners seamlessly.' },
              { icon: MessageSquare, title: 'Secure Chat', desc: 'Communicate safely with property owners through our encrypted messaging system.' },
              { icon: Star, title: 'Reviews & Ratings', desc: 'Read authentic reviews and ratings from previous tenants to make informed decisions.' },
              { icon: CreditCard, title: 'Online Payments', desc: 'Secure digital payments with automated rent reminders for hassle-free transactions.' }
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

      {/* Why Choose */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Why Choose StaySpot</h2>
            <p className="text-gray-600">Three key reasons to trust us with your room search</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: 'Verified Rooms', desc: 'Every room listing is verified by our team to ensure authenticity and quality standards.' },
              { icon: Shield, title: 'Safe Communication', desc: 'Protected messaging system ensures your privacy and security throughout the process.' },
              { icon: Zap, title: 'Fast & Transparent', desc: 'Quick booking process with transparent pricing and no hidden fees.' }
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

      {/* Story */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">StaySpot was born from the frustration of finding quality rental accommodations in Nepal. Traditional methods were time-consuming, unreliable, and often unsafe.</p>
            <p className="text-gray-600 mb-4">We recognized the need for a digital platform that could bridge the gap between property owners and tenants, providing transparency, security, and convenience.</p>
            <p className="text-gray-600">Today, StaySpot is revolutionizing the rental market in Nepal by leveraging technology to create meaningful connections and streamline the entire renting process.</p>
          </div>
          <div className="hidden md:block flex-1">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=400&fit=crop" alt="team" className="rounded-xl" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">How It Works</h2>
            <p className="text-gray-600">Simple steps to find your perfect room</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Search & Filter', desc: 'Use smart filters to find room listings that match your budget' },
              { num: '2', title: 'View & Compare', desc: 'Explore rooms on full interactive map with detailed information' },
              { num: '3', title: 'Book or Visit', desc: 'Book instantly or schedule a visit to see the room and make a decision' },
              { num: '4', title: 'Move In', desc: 'Complete payment process and settle with round with ongoing support' }
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
      <Footer />
    </div>
  );
}
