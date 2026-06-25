import React from 'react';
import { Sparkles } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="animated-bg" />
      <div className="mx-auto max-w-4xl space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Transparency & Privacy</span>
          </div>
          <h1 className="font-outfit text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Cookie Policy
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Discover how Woomegle uses cookies and similar tracking technologies to protect your sessions and improve your matching experience.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-white/10 shadow-2xl bg-white/80 dark:bg-[#0a0d1a]/80 backdrop-blur-2xl text-left space-y-8">
          <section className="space-y-4">
            <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">1. What Are Cookies?</h2>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-sm">
              Cookies are small text files placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, enable specific functionalities like user authentication, and provide analytical data to website proprietors.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">2. How We Use Cookies</h2>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-sm">
              Woomegle utilizes cookies for several vital operating reasons:
            </p>
            <ul className="list-disc pl-6 text-sm text-slate-600 dark:text-gray-300 space-y-2">
              <li><strong>Essential Auth Cookies:</strong> Required to authenticate your requests, keep you logged into the member dashboard, and protect your data from unauthorized access.</li>
              <li><strong>Preference Cookies:</strong> Used to remember your matching filters, language selection, country location, and UI theme preferences (dark or light mode).</li>
              <li><strong>Advertising & Sponsor Cookies:</strong> Utilized by advertising partners (such as Google AdSense) to serve relevant native ads and manage frequency capping for interstitials.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">3. Third-Party Cookies</h2>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-sm">
              We permit select third-party networks, including Google AdSense, to place cookies on your browser for advertising monetization purposes. These partners use cookies to serve personalized advertisements based on your visit to Woomegle and other sites across the Internet.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">4. Managing Your Cookie Preferences</h2>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-sm">
              You have the right to decide whether to accept or decline cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use Woomegle, though your access to specific core functionality (such as authenticated member dashboards) will be restricted.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
