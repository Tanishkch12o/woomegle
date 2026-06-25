import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdManager } from '../context/AdContext';
import { BannerAd, SponsoredCard } from '../components/AdUnits';
import { Video, Users, Sparkles, Shield, Crown, MessageSquare, ArrowRight, Compass, Heart } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerInterstitial } = useAdManager();

  const handleStartChat = () => {
    triggerInterstitial(() => {
      navigate('/chat');
    });
  };

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="animated-bg" />

      <div className="mx-auto max-w-7xl space-y-12 relative z-10">
        
        {/* Welcome Hero Card */}
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden bg-white/80 dark:bg-[#0a0d1a]/80 backdrop-blur-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Woomegle Member Dashboard</span>
              </div>
              
              <h1 className="font-outfit text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome back, <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">{user.username}</span>!
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
                Your WebRTC high-definition streaming relay is online. Instantly match with random global callers or filter by your unique interests.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleStartChat}
                  className="w-full sm:w-auto group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-4 font-extrabold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <Video className="h-5 w-5" />
                  <span>Start Video Chat</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>

                {!user.isPremium && (
                  <Link
                    to="/premium"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-8 py-4 font-bold text-amber-600 dark:text-amber-400 shadow-sm hover:bg-amber-500/20 transition-colors duration-300"
                  >
                    <Crown className="h-5 w-5" />
                    <span>Upgrade to PRO</span>
                  </Link>
                )}
              </div>
            </div>

            {/* User Avatar & Badge Summary */}
            <div className="flex flex-col items-center p-6 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-md min-w-[240px]">
              <div className="relative mb-4">
                <img
                  src={user.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"}
                  alt={user.username}
                  className="h-24 w-24 rounded-2xl object-cover ring-4 ring-indigo-500/30 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#0a0d1a]" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white font-outfit text-lg">{user.username}</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">{user.country || 'Global'} | {user.language || 'English'}</p>
              
              {user.isPremium ? (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Crown className="h-4 w-4" />
                  <span>Premium Active</span>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
                  <span>Basic Member</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Banner Ad (Hidden for Premium Users) */}
        {!user.isPremium && (
          <div>
            <BannerAd />
          </div>
        )}

        {/* Action Grids & Sponsored Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Quick Stats & Navigation Cards */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Quick Card 1: Friends List */}
            <Link to="/friends" className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 block group bg-white/60 dark:bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-1">My Friends & History</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                Review past video conversations, manage incoming friend requests, and reconnect with your favorite matches.
              </p>
            </Link>

            {/* Quick Card 2: Profile Settings */}
            <Link to="/profile" className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 block group bg-white/60 dark:bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-1">Match Preferences</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                Update your matching tags, language filters, country location, and customize your profile avatar.
              </p>
            </Link>

            {/* Quick Card 3: Safety Center */}
            <Link to="/safety" className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 block group bg-white/60 dark:bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-1">Trust & Safety</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                Review community guidelines, reporting mechanisms, moderation policies, and peer blocklists.
              </p>
            </Link>

            {/* Quick Card 4: Premium Perks */}
            <Link to="/premium" className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 block group bg-white/60 dark:bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-1 flex items-center gap-2">
                <span>Woomegle PRO</span>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  83% OFF
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                Explore priority matchmaking queues, advanced gender filtering, custom badges, and 100% ad-free calling. Now starting at just ₹99/week!
              </p>
            </Link>

          </div>

          {/* Sponsored Card (Hidden for Premium Users) or PRO Thank You Card */}
          <div className="md:col-span-1">
            {!user.isPremium ? (
              <SponsoredCard />
            ) : (
              <div className="glass-card rounded-3xl p-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent shadow-2xl text-center flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-amber-500 animate-bounce" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white font-outfit mb-2">Thank you for being PRO!</h4>
                <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed mb-6">
                  Your premium subscription directly supports our global high-speed WebRTC infrastructure. Enjoy your completely ad-free, priority matchmaking experience.
                </p>
                <button
                  onClick={handleStartChat}
                  className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3.5 px-6 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:-translate-y-0.5"
                >
                  🚀 Priority Match Now
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
