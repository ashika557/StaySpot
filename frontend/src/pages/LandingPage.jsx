import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Map as MapIcon, Calendar, MessageSquare, Star, CreditCard, MapPin, Shield, Zap } from 'lucide-react';
import Footer from '../components/Footer';

// This is the main landing page for StaySpot. 
// It shows different buttons if the user is logged in or not.
export default function StaySpotLanding({ onGetStarted, onSignIn, user }) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#f0f7ff] relative overflow-hidden">
      {/* Attractive background decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-200/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-300/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* Top Navigation Bar */}
      <header className="border-b bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">StaySpot</span>
          </div>
          
          <div className="flex gap-4">
            {!user ? (
              <>
                <button
                  className="px-6 py-2.5 text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors"
                  onClick={() => {
                    if (onSignIn) onSignIn();
                    navigate('/login');
                  }}
                >
                  Sign In
                </button>
                <button
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all active:scale-95"
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
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-28 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-6xl md:text-7xl font-black mb-8 tracking-tighter leading-none">StaySpot</h1>
            <p className="text-2xl text-blue-50 max-w-lg leading-relaxed font-medium">Smart, transparent, and modern room-renting experience in Nepal.</p>
          </div>
          <div className="hidden md:block flex-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-400/20 blur-2xl rounded-full"></div>
              <img src="https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&h=600&fit=crop" alt="room" className="relative w-full max-w-md h-auto rounded-3xl shadow-2xl border-8 border-white/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/80 backdrop-blur-sm shadow-sm border-y border-blue-50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">What We Provide</h2>
            <p className="text-slate-500 text-lg">All the tools you need for modern room renting</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Home, title: 'Smart Search Filters', desc: 'Filter rooms by location, price, and amenities with ease.' },
              { icon: MapIcon, title: 'Map-Based View', desc: 'Interactive map results to find the perfect location.' },
              { icon: Calendar, title: 'Bookings & Visits', desc: 'Schedule visits and book rooms instantly.' },
              { icon: MessageSquare, title: 'Secure Communication', desc: 'Chat directly and safely with property owners.' },
              { icon: Star, title: 'Transparent Reviews', desc: 'Honest ratings from verified previous tenants.' },
              { icon: CreditCard, title: 'Digital Payments', desc: 'Secure online payments with automatic receipts.' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <item.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Why Choose StaySpot</h2>
            <p className="text-slate-500 text-lg">Three reasons why our platform is trusted</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: MapPin, title: 'Verified Listings', desc: 'Every property is verified for your peace of mind.' },
              { icon: Shield, title: 'Secure Platform', desc: 'Your data and payments are always protected.' },
              { icon: Zap, title: 'Instant Booking', desc: 'Speedy process from search to moving in.' }
            ].map((item, i) => (
              <div key={i} className="bg-white/50 backdrop-blur-sm p-10 rounded-3xl border border-white text-center hover:bg-white transition-all duration-300">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <item.icon className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-lg">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative z-10 bg-slate-900 text-white rounded-[3rem] mx-6 mb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-3xl -mr-32 -mt-32"></div>
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4">How It Works</h2>
            <p className="text-slate-400 text-lg">Four simple steps to get your room</p>
          </div>
          <div className="grid md:grid-cols-4 gap-12">
            {[
              { num: '1', title: 'Find Your Spot', desc: 'Use smart filters to find rooms that fit your needs.' },
              { num: '2', title: 'Schedule Visit', desc: 'Visit the room or view verified high-quality media.' },
              { num: '3', title: 'Direct Booking', desc: 'Pay securely and book your room in minutes.' },
              { num: '4', title: 'Welcome Home', desc: 'Complete the process digitally and move in easily.' }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 text-3xl font-black shadow-xl shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">{item.num}</div>
                <h3 className="font-bold text-xl mb-4">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}