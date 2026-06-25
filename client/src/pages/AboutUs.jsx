import React from 'react';
import { Sparkles, Users, Globe, Shield, Heart } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="animated-bg" />
      <div className="mx-auto max-w-4xl space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Connecting the World</span>
          </div>
          <h1 className="font-outfit text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            About Woomegle
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            We are dedicated to breaking down global barriers and enabling authentic, safe, and high-definition video conversations across cultures and continents.
          </p>
        </div>

        {/* Core Mission Card */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-white/10 shadow-2xl bg-white/80 dark:bg-[#0a0d1a]/80 backdrop-blur-2xl text-left space-y-6">
          <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
          <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
            Founded with the conviction that real human connection happens face-to-face, Woomegle leverages cutting-edge WebRTC streaming infrastructure to bring people together instantly. Whether you are looking to practice a new language, meet people with shared hobbies, or simply have a friendly conversation, Woomegle provides the secure space to make it happen.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-white/10">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white font-outfit text-lg">Global Reach</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">Active callers from over 150 countries sharing stories and expanding horizons daily.</p>
            </div>

            <div className="space-y-2">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white font-outfit text-lg">Uncompromising Safety</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">Industry-leading moderation, automated reporting interfaces, and user empowerment tools.</p>
            </div>

            <div className="space-y-2">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white font-outfit text-lg">Community First</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">Built on feedback from our passionate base of users to ensure respectful and rewarding experiences.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
