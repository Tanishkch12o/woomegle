import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-16 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
        
        <h1 className="font-outfit text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 relative z-10">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-8 font-medium">Last Updated: June 21, 2026</p>
        
        <div className="space-y-8 text-slate-600 dark:text-gray-300 relative z-10">
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Woomegle, you agree to be bound by these Terms of Service. If you do not agree to all the terms, you may not access the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">2. User Conduct & Acceptable Use</h2>
            <p className="mb-4">You agree not to engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Transmitting nudity, sexually explicit content, or graphic violence.</li>
              <li>Harassing, bullying, or threatening other users.</li>
              <li>Using automation (bots, scrapers) to access the service.</li>
              <li>Impersonating another person or entity.</li>
            </ul>
            <p className="mt-4">Violations may result in immediate IP bans and account termination.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">3. Premium Subscriptions</h2>
            <p>Woomegle Premium features are billed on a recurring basis or as one-time purchases via Razorpay. All purchases are non-refundable unless required by applicable law.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">4. Limitation of Liability</h2>
            <p>Woomegle provides random peer-to-peer video connections. We do not control the content transmitted by other users and are not liable for user-generated content encountered on the platform.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
