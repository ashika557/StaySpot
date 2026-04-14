import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Map as MapIcon,
  Calendar,
  MessageSquare,
  Star,
  CreditCard,
  MapPin,
  Shield,
  Zap,
} from "lucide-react";
import Footer from "../components/Footer";

// This is the main landing page for StaySpot.
// It shows different buttons if the user is logged in or not.
export default function StaySpotLanding({ onGetStarted, onSignIn, user }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f0f7ff] font-sans relative overflow-hidden selection:bg-blue-200">
      {/* Decorative blurred backgrounds to add depth while maintaining brand colors */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-300/30 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* Top Navigation Bar - Now Sticky and Glassmorphic */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-800">
              StaySpot
            </span>
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <button
                  className="px-5 py-2.5 text-sm text-slate-600 font-bold hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all"
                  onClick={() => {
                    if (onSignIn) onSignIn();
                    navigate("/login");
                  }}
                >
                  Sign In
                </button>
                <button
                  className="px-6 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-bold shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 transition-all active:scale-95"
                  onClick={() => {
                    if (onGetStarted) onGetStarted();
                    navigate("/register");
                  }}
                >
                  Get Started
                </button>
              </>
            ) : (
              <button
                className="px-6 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-bold shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 transition-all active:scale-95"
                onClick={() => {
                  if (onGetStarted) onGetStarted();
                  navigate(
                    user.role === "Owner"
                      ? "/owner/dashboard"
                      : "/tenant/dashboard",
                  );
                }}
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white pt-32 pb-16 lg:pt-40 lg:pb-24 z-10 overflow-hidden">
        {/* Abstract Hero Overlays for Premium Vibe */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 hidden md:block pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-[30rem] h-[30rem] bg-white/10 blur-3xl rounded-full mix-blend-overlay pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            <h1 className="text-5xl lg:text-[5.5rem] font-black mb-6 tracking-tight leading-[1.1] drop-shadow-sm">
              StaySpot
            </h1>
            <p className="text-lg lg:text-xl text-blue-50 max-w-md leading-relaxed font-semibold opacity-95 mb-8 md:mb-10 drop-shadow-sm">
              Smart, transparent, and modern room-renting experience in Nepal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full justify-center lg:justify-start">
               <button
                  className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-700 rounded-xl font-black text-[15px] shadow-[0_8px_20px_rgba(255,255,255,0.25)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 transition-all active:scale-95 uppercase tracking-wide"
                  onClick={() => {
                    if (!user) {
                      if (onGetStarted) onGetStarted();
                      navigate("/register");
                    } else {
                       navigate(user.role === "Owner" ? "/owner/dashboard" : "/tenant/dashboard");
                    }
                  }}
                >
                  {user ? "Go to Dashboard" : "Get Started Now"}
                </button>
            </div>
          </div>
          
          <div className="hidden lg:block relative mx-auto w-full max-w-[520px]">
            <div className="absolute inset-0 bg-blue-300/30 blur-[40px] rounded-[3rem] transform rotate-3"></div>
            <img
              src="https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&h=600&fit=crop"
              alt="Premium room rental"
              className="relative w-full aspect-[4/3] object-cover rounded-3xl shadow-2xl ring-8 ring-white/10 transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 ease-out"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative z-10 bg-white/40 backdrop-blur-xl border-y border-white/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              What We Provide
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              All the tools you need for modern room renting
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Home,
                title: "Smart Search Filters",
                desc: "Filter rooms by location, price, and amenities with ease.",
              },
              {
                icon: MapIcon,
                title: "Map-Based View",
                desc: "Interactive map results to find the perfect location.",
              },
              {
                icon: Calendar,
                title: "Bookings & Visits",
                desc: "Schedule visits and book rooms instantly.",
              },
              {
                icon: MessageSquare,
                title: "Secure Communication",
                desc: "Chat directly and safely with property owners.",
              },
              {
                icon: Star,
                title: "Transparent Reviews",
                desc: "Honest ratings from verified previous tenants.",
              },
              {
                icon: CreditCard,
                title: "Digital Payments",
                desc: "Secure online payments with automatic receipts.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/80 p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300 ease-out">
                  <item.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-black mb-4 text-slate-800 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 gap-4 flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Why Choose StaySpot
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Three reasons why our platform is trusted
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: "Verified Listings",
                desc: "Every property is verified for your peace of mind.",
              },
              {
                icon: Shield,
                title: "Secure Platform",
                desc: "Your data and payments are always protected.",
              },
              {
                icon: Zap,
                title: "Instant Booking",
                desc: "Speedy process from search to moving in.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/60 backdrop-blur-md p-12 rounded-[2.5rem] border border-white/80 text-center hover:bg-white hover:shadow-[0_20px_40px_rgba(37,99,235,0.06)] transition-all duration-500 group"
              >
                <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-white group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-slate-800 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-lg font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-28 relative z-10 bg-slate-900 text-white rounded-[3rem] mx-4 md:mx-8 mb-24 overflow-hidden shadow-2xl">
        {/* Subtle glowing orbs in dark section */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] -ml-20 -mb-20 rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">How It Works</h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Four simple steps to get your room
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-12 relative">
            {/* Connecting Line (hidden on mobile) */}
            <div className="hidden md:block absolute top-[2.5rem] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-blue-600/0 via-blue-600/50 to-blue-600/0 z-0"></div>

            {[
              {
                num: "1",
                title: "Find Your Spot",
                desc: "Use smart filters to find rooms that fit your needs.",
              },
              {
                num: "2",
                title: "Schedule Visit",
                desc: "Visit the room or view verified high-quality media.",
              },
              {
                num: "3",
                title: "Direct Booking",
                desc: "Pay securely and book your room in minutes.",
              },
              {
                num: "4",
                title: "Welcome Home",
                desc: "Complete the process digitally and move in easily.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center group relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 text-3xl font-black shadow-[0_0_30px_rgba(37,99,235,0.3)] ring-4 ring-slate-900 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {item.num}
                </div>
                <h3 className="font-black text-xl mb-4 tracking-tight">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
