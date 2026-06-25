import React from 'react';
import { Sparkles, ShieldCheck, AlertOctagon, Heart, Users } from 'lucide-react';

export default function CommunityGuidelines() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="animated-bg" />
      <div className="mx-auto max-w-4xl space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Respect & Positive Vibes</span>
          </div>
          <h1 className="font-outfit text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Community Guidelines
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            To maintain a safe, welcoming, and enjoyable video chat platform for everyone, all Woomegle members must strictly adhere to our foundational community rules.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-white/10 shadow-2xl bg-white/80 dark:bg-[#0a0d1a]/80 backdrop-blur-2xl text-left space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center shrink-0">
                <AlertOctagon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">1. Zero Tolerance for Nudity & Sexual Content</h2>
            </div>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-sm pl-13">
              Woomegle strictly prohibits explicit sexual content, nudity, and sexually suggestive behavior. Our automated AI moderation and user report logs monitor video streams actively. Immediate permanent bans are issued to violators without prior warning.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">2. Respectful Conduct & Anti-Harassment</h2>
            </div>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-sm pl-13">
              We celebrate global diversity. Hate speech, bullying, harassment, intimidation, and discrimination based on race, gender, religion, sexual orientation, or nationality are fundamentally contrary to our values and strictly forbidden.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">3. Minimum Age Requirement</h2>
            </div>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-sm pl-13">
              You must be at least 18 years of age (or the age of legal majority in your local jurisdiction) to access and utilize Woomegle. Underage users will be banned immediately from accessing our matching queues.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">4. Protecting Your Privacy</h2>
            </div>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-sm pl-13">
              Never share sensitive personal information—such as full legal names, physical addresses, phone numbers, banking credentials, or social security details—with strangers during a video chat. Be vigilant and protect your personal safety.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
