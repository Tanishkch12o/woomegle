import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Sparkles, Check, Flame, ShieldCheck, Heart, Crown, Loader2 } from 'lucide-react';
import { apiFetch } from '../config/api';

export default function PremiumPage() {
  const { user, token, fetchProfile } = useAuth();
  const { pricing, currency, countryCode, loading: currencyLoading, formatPrice } = useCurrency();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState(null);

  const PLANS = [
    {
      name: 'Weekly Pass',
      price: pricing.weekly,
      originalPrice: pricing.weeklyOriginal,
      period: 'week',
      popular: false,
      bestValue: false,
      color: 'indigo',
      description: 'Perfect for testing out all premium matchmaking parameters.'
    },
    {
      name: 'Monthly Vibe',
      price: pricing.monthly,
      originalPrice: pricing.monthlyOriginal,
      period: 'month',
      popular: true,
      bestValue: false,
      color: 'purple',
      description: 'Most popular option. Full access with interest priorities.'
    },
    {
      name: 'Yearly Elite',
      price: pricing.yearly,
      originalPrice: pricing.yearlyOriginal,
      period: 'year',
      popular: false,
      bestValue: true,
      color: 'amber',
      description: 'Ultimate value pass. Permanent premium credentials.'
    }
  ];

  // Load external Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan) => {
    if (!user) {
      alert('Please log in or register to buy a subscription.');
      return;
    }
    
    try {
      setLoadingPlan(plan.name);
      setPurchaseStatus(null);

      // Create Order using apiFetch
      const { res: orderRes, data: orderData } = await apiFetch('/api/payments/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planName: plan.name, country: countryCode })
      });

      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Check if SDK already loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you offline?');
      }

      // Trigger Razorpay payment
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Woomegle Premium',
        description: `Upgrade to ${plan.name}`,
        image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%236366f1%22%3E%3Cpath d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z%22/%3E%3C/svg%3E',
        order_id: orderData.orderId,
        handler: async (response) => {
          // Send verification payload to backend using apiFetch
          try {
            const { res: verifyRes, data: verifyData } = await apiFetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id || 'pay_mock_' + Math.random().toString(36).substring(2, 9),
                razorpay_signature: response.razorpay_signature || '',
                planName: plan.name
              })
            });
            
            if (verifyRes.ok) {
              setPurchaseStatus({
                success: true,
                message: `Congratulations! Plan "${plan.name}" has been unlocked successfully.`
              });
              fetchProfile(); // update local state
            } else {
              setPurchaseStatus({
                success: false,
                message: verifyData.message || 'Signature verification failed.'
              });
            }
          } catch (err) {
            setPurchaseStatus({
              success: false,
              message: err.message || 'Payment verification network error.'
            });
          }
        },
        prefill: {
          name: user.username,
          email: user.email
        },
        theme: {
          color: '#6366f1'
        }
      };

      if (orderData.orderId.startsWith('order_mock_')) {
        console.log("Simulating mock payment check...");
        setTimeout(() => {
          options.handler({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 10)}`
          });
        }, 1200);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }

    } catch (err) {
      console.error("Subscription Error:", err);
      alert(err.message || 'Payment initialization error');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="animated-bg" />

      <div className="mx-auto max-w-5xl space-y-12 relative z-10 text-center">
        {/* Page Header */}
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-500 dark:text-amber-400 transition-colors duration-300">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="font-outfit text-4xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">Upgrade to Woomegle Premium</h1>
          <p className="text-slate-500 dark:text-gray-400 transition-colors duration-300">
            Unlock advanced features, find matching genders, and experience ad-free connections with priority queues.
          </p>
        </div>

        {/* Purchase Status Notifications */}
        {purchaseStatus && (
          <div className={`max-w-xl mx-auto rounded-2xl p-5 border text-left flex gap-3 transition-colors duration-300 ${
            purchaseStatus.success 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            <ShieldCheck className="h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold text-sm font-outfit">
                {purchaseStatus.success ? 'Upgrade Successful' : 'Upgrade Failed'}
              </span>
              <span className="block text-xs opacity-80 mt-1">{purchaseStatus.message}</span>
            </div>
          </div>
        )}

        {/* Features Comparison */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto text-left">
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex gap-3 transition-colors duration-300">
            <Heart className="h-6 w-6 text-pink-500 dark:text-pink-400 shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm font-outfit transition-colors duration-300">Gender Matching</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 transition-colors duration-300">Select your preferred gender filter and chat with the right people.</p>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex gap-3 transition-colors duration-300">
            <Crown className="h-6 w-6 text-amber-500 dark:text-amber-400 shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm font-outfit transition-colors duration-300">Vibe Pro Badge</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 transition-colors duration-300">Display a glowing VIP badge on your profile. Command attention.</p>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex gap-3 transition-colors duration-300">
            <Flame className="h-6 w-6 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm font-outfit transition-colors duration-300">Priority Match</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 transition-colors duration-300">Skip waiting delays. Premium users bypass standard queues.</p>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const isWeekly = plan.name === 'Weekly Pass';
            const isYearly = plan.name === 'Yearly Elite';
            
            // Calculate savings percentage
            const savingsPercent = plan.originalPrice 
              ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
              : 0;

            // Estimated tax calculation (e.g. 18% GST/VAT included)
            const taxAmount = plan.price * 0.18;
            
            let accentBorder = 'border-slate-200 dark:border-white/5';
            let btnStyle = 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white border border-slate-200 dark:border-white/10';

            if (plan.popular) {
              accentBorder = 'border-indigo-400 dark:border-indigo-500 scale-105 ring-4 ring-indigo-500/10';
              btnStyle = 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20';
            } else if (isYearly) {
              accentBorder = 'border-amber-300 dark:border-amber-500/50';
              btnStyle = 'bg-amber-500 hover:bg-amber-400 text-slate-900 dark:text-black shadow-lg shadow-amber-500/10 font-bold';
            }

            return (
              <div
                key={plan.name}
                className={`relative glass-card rounded-3xl p-8 flex flex-col justify-between text-left transition-all duration-300 ${accentBorder}`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-6 translate-y-[-50%] bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                    Most Popular
                  </span>
                )}
                {plan.bestValue && (
                  <span className="absolute top-0 right-6 translate-y-[-50%] bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                    Best Value
                  </span>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-outfit text-xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">{plan.name}</h3>
                    {savingsPercent > 0 && (
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Save {savingsPercent}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed mb-6 transition-colors duration-300">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white transition-colors duration-300">
                        {currencyLoading ? 'Loading prices...' : formatPrice(plan.price)}
                      </span>
                      {!currencyLoading && plan.originalPrice && (
                        <span className="text-base text-slate-400 dark:text-gray-500 line-through font-semibold font-outfit">
                          {formatPrice(plan.originalPrice)}
                        </span>
                      )}
                      <span className="text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">/ {plan.period}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-gray-500 mt-1.5 flex items-center gap-1.5">
                      <span>Includes {currencyLoading ? '...' : formatPrice(taxAmount)} applicable taxes & fees</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300 transition-colors duration-300">
                      <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      <span>Advanced Gender filter</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300 transition-colors duration-300">
                      <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      <span>Glowing Profile Tag Badge</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300 transition-colors duration-300">
                      <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      <span>Priority Match Queue</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300 transition-colors duration-300">
                      <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      <span>Ad-Free UX Interface</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubscribe(plan)}
                  disabled={currencyLoading || loadingPlan !== null}
                  className={`w-full py-3.5 rounded-2xl font-semibold transition-all ${btnStyle} ${(currencyLoading || loadingPlan !== null) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {currencyLoading ? 'Loading prices...' : loadingPlan === plan.name ? 'Checking out...' : `Get Started`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
