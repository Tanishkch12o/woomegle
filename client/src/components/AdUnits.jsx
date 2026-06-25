import React, { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, ShieldCheck, Zap, X, Volume2, Star } from 'lucide-react';

/**
 * BannerAd - A horizontal banner ad unit with subtle pulsing glow and prominent CTA.
 * Designed for Landing Page and Dashboard.
 */
export const BannerAd = () => {
  return (
    <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl p-6 sm:p-8 my-6 group transition-all duration-500 hover:border-indigo-500/60 hover:shadow-indigo-500/20">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700 animate-pulse-slow" />
      
      {/* Sponsor Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 tracking-widest uppercase">
          <Star className="h-3 w-3 text-indigo-400 fill-indigo-400" />
          <span>Sponsored</span>
        </span>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex items-center gap-6">
          {/* Ad Icon */}
          <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-500">
            <div className="h-full w-full rounded-2xl bg-slate-900 flex items-center justify-center">
              <Zap className="h-8 w-8 text-indigo-400 animate-pulse" />
            </div>
          </div>

          <div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-white font-outfit tracking-tight">
              Apex Audio - Next-Gen Wireless Earbuds
            </h4>
            <p className="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Experience flawless audio clarity during your Woomegle video chats with 3D spatial audio and active noise cancellation. 
              <span className="text-amber-400 font-semibold ml-1">Claim 50% off today with code VIBE50.</span>
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="group/btn relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 font-bold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 hover:-translate-y-1 shrink-0"
        >
          <span>Claim Offer</span>
          <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
};

/**
 * NativeAd - Embedded content card designed to blend elegantly with native app layout grids.
 * Used in Landing Page features grid and post-chat idle screen.
 */
export const NativeAd = () => {
  return (
    <div className="glass-card rounded-3xl p-6 text-left border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-500 hover:-translate-y-1 bg-white/60 dark:bg-white/5 shadow-xl">
      <div className="absolute top-4 right-4">
        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold text-slate-500 dark:text-gray-400 bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10 uppercase tracking-widest">
          Ad
        </span>
      </div>

      <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
        Woomegle PRO Unlimited
      </h3>
      <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed mb-6">
        Tired of waiting in standard queues? Get priority matchmaking, advanced gender filters, and 100% ad-free video calls instantly.
      </p>

      <button 
        type="button"
        onClick={(e) => e.preventDefault()}
        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-purple-600 dark:hover:bg-purple-400 hover:text-white dark:hover:text-slate-900 font-bold rounded-2xl text-xs transition-colors duration-300 shadow-md"
      >
        Explore PRO Perks
      </button>
    </div>
  );
};

/**
 * SponsoredCard - A featured premium sponsor card for the Dashboard.
 */
export const SponsoredCard = () => {
  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden group hover:border-amber-500/50 transition-all duration-500">
      <div className="absolute top-4 right-4">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-amber-400 bg-amber-500/20 border border-amber-500/30 uppercase tracking-widest">
          Featured Sponsor
        </span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
          <ShieldCheck className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">SecureLine VPN Elite</h4>
          <p className="text-xs text-slate-500 dark:text-gray-400">Military-grade privacy for high-speed video streaming</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed mb-6">
        Keep your IP address completely private and unlock global high-definition WebRTC connections with zero throttling. 
        Special partnership discount for Woomegle users included.
      </p>

      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3.5 px-6 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:-translate-y-0.5"
      >
        <span>Activate Privacy Pass</span>
        <ExternalLink className="h-4 w-4 text-slate-950" />
      </a>
    </div>
  );
};

/**
 * SmallBannerAd - A compact, non-intrusive banner ad for matching and video chat screens.
 */
export const SmallBannerAd = () => {
  return (
    <div className="w-full bg-slate-900/80 dark:bg-black/60 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-2xl p-3 sm:px-4 flex items-center justify-between gap-4 shadow-lg my-2 transition-all duration-300 hover:border-indigo-500/40">
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 uppercase tracking-widest shrink-0">
          AD
        </span>
        <p className="text-xs text-slate-300 truncate font-medium">
          ⚡ <span className="font-bold text-white">UltraSpeed Fiber:</span> 1Gbps Seamless Video Calling & Streaming. 
          <span className="text-indigo-400 hidden sm:inline ml-1">Check availability in your area ➔</span>
        </p>
      </div>
      <button 
        type="button"
        onClick={(e) => e.preventDefault()} 
        className="shrink-0 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl transition-colors shadow-md"
      >
        View Offer
      </button>
    </div>
  );
};

/**
 * InterstitialModal - Fullscreen modal overlay with a countdown timer before allowing skip.
 */
export const InterstitialModal = ({ isOpen, onClose }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-xl p-4 transition-all duration-500">
      <div className="w-full max-w-md bg-white dark:bg-[#0a0d1a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Top bar with ad tag */}
        <div className="w-full flex justify-between items-center mb-6">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest">
            Advertisement
          </span>
          <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">
            {countdown > 0 ? (
              <span>You can skip in <span className="text-slate-900 dark:text-white font-bold">{countdown}s</span></span>
            ) : (
              <span className="text-emerald-500 font-bold">Ready to skip</span>
            )}
          </div>
        </div>

        {/* Ad Content Visual */}
        <div className="w-full aspect-video rounded-2xl bg-gradient-to-tr from-indigo-950 via-purple-900 to-indigo-950 border border-indigo-500/30 p-6 flex flex-col items-center justify-center mb-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-80 animate-pulse-slow" />
          <Volume2 className="h-12 w-12 text-indigo-400 animate-bounce mb-3 relative z-10" />
          <h4 className="text-xl font-extrabold text-white font-outfit relative z-10">
            Epic Beats Cloud Studio
          </h4>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-[240px] relative z-10">
            Professional AI-powered noise removal for crystal clear live vocal streams.
          </p>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-2">
          Keep Woomegle Free for Everyone
        </h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
          Ads support our servers and global WebRTC relay infrastructure. Upgrade to Woomegle PRO to remove all interstitial ads forever.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={countdown > 0}
            className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {countdown > 0 ? `Skip Ad (${countdown})` : 'Skip Ad ➔'}
          </button>
          
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClose(); }}
            className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Visit Sponsor</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
