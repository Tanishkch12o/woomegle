import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Gift, Copy, CheckCircle, Share2, Crown, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralCode = user.referralCode || 'N/A';
  const referralCount = user.referralCount || 0;
  const target = 5;
  const progress = Math.min((referralCount % target) / target * 100, 100);
  const remaining = target - (referralCount % target);
  
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header section */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-outfit text-4xl font-extrabold text-slate-900 dark:text-white">
            Refer & Earn Premium
          </h1>
          <p className="text-lg text-slate-500 dark:text-gray-400 max-w-xl mx-auto">
            Invite your friends to Woomegle and unlock <span className="font-semibold text-amber-500">7 Days of PRO Premium</span> for every {target} friends who sign up using your link!
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8 relative overflow-hidden">
          {/* Decorative background aura */}
          <div className="absolute -top-24 -right-24 h-48 w-48 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Code & Link Section */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Your Referral Code
              </h3>
              <div className="bg-slate-100 dark:bg-darkBg rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-white/5">
                <span className="font-mono text-2xl font-bold tracking-widest text-slate-900 dark:text-white">
                  {referralCode}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Your Invite Link
              </h3>
              <div className="bg-slate-100 dark:bg-darkBg rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-white/5 group">
                <span className="font-mono text-sm text-slate-600 dark:text-gray-300 truncate mr-4">
                  {referralLink}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="relative z-10 pt-6 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Current Progress
              </h3>
              <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">
                {referralCount % target} / {target} Friends
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-4 w-full bg-slate-100 dark:bg-darkBg rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <p className="mt-4 text-center text-sm font-medium text-slate-600 dark:text-gray-300">
              {remaining === target ? (
                "Share your link to start earning Premium!"
              ) : remaining === 1 ? (
                "Just 1 more friend to go for 7 Days of Premium!"
              ) : (
                `Invite ${remaining} more friends to unlock your reward!`
              )}
            </p>
          </div>
        </div>

        {/* Stats / Total Referrals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-gray-400">Total Friends Invited</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{referralCount}</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <Crown className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-gray-400">Total Premium Earned</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{Math.floor(referralCount / target) * 7} Days</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
