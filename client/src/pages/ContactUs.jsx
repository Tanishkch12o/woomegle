import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle, Sparkles } from 'lucide-react';

export default function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="animated-bg" />
      <div className="mx-auto max-w-2xl space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>We would love to hear from you</span>
          </div>
          <h1 className="font-outfit text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Contact Us
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
            Have a question about your account, advertising opportunities, or partnership inquiries? Drop us a message below.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-white/10 shadow-2xl bg-white/80 dark:bg-[#0a0d1a]/80 backdrop-blur-2xl text-left">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto animate-bounce" />
              <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">Message Sent Successfully!</h2>
              <p className="text-sm text-slate-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                Thank you for reaching out to Woomegle. Our support team will review your inquiry and get back to you within 24-48 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setName(''); setEmail(''); setMessage(''); }}
                className="mt-6 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-lg shadow-indigo-600/20"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">Message Inquiry</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 rounded-2xl p-4 text-sm text-slate-900 dark:text-white outline-none transition-all resize-none"
                  placeholder="How can we help you today?"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
              >
                <span>Submit Message</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
