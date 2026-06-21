import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-16 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
        
        <h1 className="font-outfit text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 relative z-10">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-8 font-medium">Last Updated: June 21, 2026</p>
        
        <div className="space-y-8 text-slate-600 dark:text-gray-300 relative z-10">
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">1. Information We Collect</h2>
            <p className="mb-4">When you use Woomegle, we may collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Information:</strong> If you create an account, we collect your name, email address, gender, country, and profile picture.</li>
              <li><strong>Usage Data:</strong> We automatically collect information about your interactions with the platform, including matching preferences, chat duration, and site activity.</li>
              <li><strong>Device Information:</strong> We collect IP addresses, browser types, and operating system details to ensure secure connections.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">2. How We Use Your Information</h2>
            <p>We use the collected data to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Provide, maintain, and improve the Woomegle matching algorithm.</li>
              <li>Facilitate WebRTC video connections efficiently.</li>
              <li>Enforce our safety guidelines and prevent abusive behavior.</li>
              <li>Process premium subscription payments via Razorpay.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">3. Data Security</h2>
            <p>We implement industry-standard security measures including end-to-end encryption for WebRTC peer connections. We do not record or store your video or audio streams on our servers. All profile data is securely stored in Firebase Firestore.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">4. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact our support team via the Safety Center.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
