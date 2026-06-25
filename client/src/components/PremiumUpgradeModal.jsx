import React from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, Check, Users, Globe, Shield } from 'lucide-react';

const FEATURES = [
  { icon: Users, text: 'Gender preference matching (Male / Female / Other)' },
  { icon: Globe,  text: 'Unlimited session time — no 3-minute cap' },
  { icon: Shield, text: 'Ad-free browsing experience' },
  { icon: Sparkles, text: 'Priority queue — shorter wait times' },
];

/**
 * PremiumUpgradeModal
 * Props:
 *   onClose  – () => void  – called when modal should close
 */
export default function PremiumUpgradeModal({ onClose }) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Premium upgrade required"
    >
      {/* Blurred dark overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl glass-card border border-white/10 p-8 shadow-2xl overflow-hidden">

        {/* Decorative glow */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="font-outfit text-2xl font-bold text-white">
            Premium Feature
          </h2>
          <p className="mt-1.5 text-sm text-gray-400">
            Gender preference matching is exclusive to Premium members.
          </p>
        </div>

        {/* Feature list */}
        <ul className="mb-6 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/30">
                <Check className="h-3 w-3 text-amber-400" />
              </span>
              <span className="text-sm text-gray-300">{text}</span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            to="/premium"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 font-semibold text-white shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Premium (From ₹99/wk)
          </Link>
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
