import React from 'react';
import { Shield, Flag, AlertTriangle, LifeBuoy } from 'lucide-react';

export default function SafetyCenter() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-16 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 mb-6">
          <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="font-outfit text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
          Safety Center
        </h1>
        <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your safety is our top priority. Learn about our community guidelines, how to report abusive behavior, and the tools we use to keep Woomegle a safe place for everyone.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        <div className="glass-card rounded-3xl p-8 hover:-translate-y-1 transition-transform duration-300">
          <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center mb-6">
            <Flag className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Reporting Users</h3>
          <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-sm">
            During any video call, you can instantly click the 'Report' button to flag inappropriate behavior. Our automated moderation systems will process reports and ban repeat offenders from the platform.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 hover:-translate-y-1 transition-transform duration-300">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Community Guidelines</h3>
          <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-sm">
            We operate a strict zero-tolerance policy for nudity, sexual content, harassment, racism, and illegal activities. Adhering to these guidelines ensures you remain a member of our community.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 hover:-translate-y-1 transition-transform duration-300">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center mb-6">
            <LifeBuoy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Support & Appeal</h3>
          <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-sm">
            If you believe your account was banned by mistake, you can submit an appeal ticket. Our human moderation team reviews appeals within 48 hours.
          </p>
        </div>

      </div>

    </div>
  );
}
