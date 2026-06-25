import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { BannerAd, NativeAd } from '../components/AdUnits';
import { Video, Sparkles, Shield, Compass, Heart, Globe, Users, Zap, Lock } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden transition-colors duration-300">
      {/* Dynamic Animated background wrapper */}
      <div className="animated-bg" />

      {/* NEW HERO SECTION */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 flex-grow flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy & CTAs */}
          <div className="space-y-8 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left z-10">
            {/* Tagline */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm transition-colors duration-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>The Next Generation of Random Video Chat</span>
            </div>

            {/* Headline */}
            <h1 className="font-outfit text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl xl:text-7xl transition-colors duration-300 leading-tight">
              Woomegle. Meet. Match. <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">Connect.</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg text-slate-600 dark:text-gray-400 sm:text-xl transition-colors duration-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Join thousands of people worldwide in high-quality video conversations. Discover new friendships, meaningful connections, and exciting conversations in just one click.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                to="/signup"
                className="group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-bold text-white shadow-xl shadow-purple-600/20 hover:shadow-purple-600/40 transition-all duration-300 hover:-translate-y-1"
              >
                <span>🚀 Start Video Chat</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-8 py-4 font-bold text-slate-800 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors duration-300"
              >
                <span>⭐ Sign Up Free</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-sm">
                  <Globe className="h-4 w-4 text-blue-500" /> 150+
                </div>
                <span className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Countries</span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-sm">
                  <Users className="h-4 w-4 text-purple-500" /> 1M+
                </div>
                <span className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Connections</span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-sm">
                  <Zap className="h-4 w-4 text-amber-500" /> Instant
                </div>
                <span className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Matching</span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-sm">
                  <Lock className="h-4 w-4 text-emerald-500" /> Safe
                </div>
                <span className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">& Secure</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Mockup */}
          <div className="relative hidden lg:block h-[500px] w-full z-10">
            {/* Glowing background blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-500/30 rounded-full blur-[80px] animate-pulse-slow" />
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-[60px]" />

            {/* Mockup Container */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Main App Window Mockup */}
              <div className="relative w-full max-w-md bg-white/80 dark:bg-[#0a0d1a]/80 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-4 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                {/* Header Mockup */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-0.5">
                      <div className="w-full h-full bg-white dark:bg-black rounded-full border-2 border-transparent" />
                    </div>
                    <div>
                      <div className="h-3 w-20 bg-slate-200 dark:bg-white/10 rounded-full mb-1" />
                      <div className="h-2 w-12 bg-slate-100 dark:bg-white/5 rounded-full" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">Live</span>
                  </div>
                </div>

                {/* Video Grids Mockup */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Remote Video */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group">
                    <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80" alt="User 1" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-xl p-2 border border-slate-200/50 dark:border-white/10 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white">Sarah, 24</span>
                      <Globe className="h-3 w-3 text-blue-500" />
                    </div>
                  </div>
                  {/* Local Video */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group">
                    <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80" alt="User 2" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-xl p-2 border border-slate-200/50 dark:border-white/10 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white">You</span>
                      <Video className="h-3 w-3 text-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Controls Mockup */}
                <div className="flex justify-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/5">
                    <div className="w-4 h-4 rounded bg-slate-400 dark:bg-gray-500" />
                  </div>
                  <div className="h-10 w-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <div className="w-5 h-2 rounded-full bg-red-500" />
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/5">
                    <div className="w-4 h-4 rounded-full bg-slate-400 dark:bg-gray-500" />
                  </div>
                </div>
              </div>

              {/* Floating Element 1 */}
              <div className="absolute -left-10 top-20 glass-card rounded-2xl p-3 border border-slate-200 dark:border-white/10 shadow-xl animate-[bounce_4s_infinite] bg-white/90 dark:bg-black/60 backdrop-blur-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-500/30">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-900 dark:text-white">New Match!</div>
                  <div className="text-[8px] text-slate-500 dark:text-gray-400">United States</div>
                </div>
              </div>

              {/* Floating Element 2 */}
              <div className="absolute -right-8 bottom-32 glass-card rounded-2xl p-3 border border-slate-200 dark:border-white/10 shadow-xl animate-[bounce_5s_infinite_0.5s] bg-white/90 dark:bg-black/60 backdrop-blur-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center border border-amber-200 dark:border-amber-500/30">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-900 dark:text-white">Premium Connected</div>
                  <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-semibold">Priority Queue Active</div>
                </div>
              </div>
              
              {/* Connection Line */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent blur-[1px] -z-10 -rotate-12" />

            </div>
          </div>
        </div>

        {/* Landing Page Banner Ad */}
        <div className="mt-16 w-full max-w-7xl mx-auto z-10">
          <BannerAd />
        </div>

        {/* Features grid with Native Ad */}
        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto z-10">
          {/* Card 1 */}
          <div className="glass-card rounded-3xl p-6 text-left transition-all duration-300 hover:translate-y-[-4px] hover:border-indigo-200 dark:hover:border-white/20 bg-white/60 dark:bg-white/5">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center mb-4 transition-colors duration-300">
              <Compass className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-2 transition-colors duration-300">Instant Matchmaking</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
              Connect with random users instantly. One click is all it takes to spin the queue and make new global connections.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-3xl p-6 text-left transition-all duration-300 hover:translate-y-[-4px] hover:border-purple-200 dark:hover:border-white/20 bg-white/60 dark:bg-white/5">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center mb-4 transition-colors duration-300">
              <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-2 transition-colors duration-300">Interests Overlay</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
              Input your hobbies or interests and match with people sharing similar vibes. Say goodbye to awkward silences.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-3xl p-6 text-left transition-all duration-300 hover:translate-y-[-4px] hover:border-emerald-200 dark:hover:border-white/20 bg-white/60 dark:bg-white/5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center mb-4 transition-colors duration-300">
              <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-2 transition-colors duration-300">Safety First</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
              Equipped with reporting interfaces, user blocks, profanity filters, and admin dashboards to enforce positive behaviour.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card rounded-3xl p-6 text-left transition-all duration-300 hover:translate-y-[-4px] hover:border-amber-200 dark:hover:border-white/20 bg-white/60 dark:bg-white/5">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center mb-4 transition-colors duration-300">
              <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-2 transition-colors duration-300 flex items-center gap-2">
              <span>Premium Perks</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                83% OFF
              </span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
              Starting at just ₹99/week or ₹299/month! Unlock advanced filters like gender preference, customized search tags, special profile badges, and complete ad-free chats.
            </p>
          </div>

          {/* Card 5: Native Ad */}
          <NativeAd />
        </div>
      </div>
    </div>
  );
}
