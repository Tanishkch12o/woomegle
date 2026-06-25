import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video, Mail, Lock, AlertCircle, Info } from 'lucide-react';
import { apiFetch } from '../config/api';

export default function LoginPage() {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !password) {
      setLocalError('Please fill out all fields');
      return;
    }

    try {
      setIsLoading(true);
      setLocalError(null);
      setInfoMessage(null);
      const res = await login(loginIdentifier, password);
      
      if (res.success) {
        navigate('/chat');
      } else {
        setLocalError(res.message);
      }
    } catch (err) {
      setLocalError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginIdentifier) {
      setLocalError('Please enter your username or email in the field first to reset password');
      return;
    }

    try {
      setIsLoading(true);
      setLocalError(null);
      setInfoMessage(null);
      
      // If user inputs username, we can attempt check, but endpoint needs email.
      // Let's check if it has @, else throw error.
      let emailInput = loginIdentifier;
      if (!loginIdentifier.includes('@')) {
        setLocalError('Please enter your full email address in the field to request reset link');
        setIsLoading(false);
        return;
      }

      // Replace fetch('/api/auth/forgot-password') with apiFetch
      const { res, data } = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput })
      });
      
      if (res.ok) {
        setInfoMessage(`${data.message}. Test Link: ${data.resetLink}`);
      } else {
        setLocalError(data.message);
      }
    } catch (err) {
      setLocalError(err.message || 'Error triggering password reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="animated-bg" />

      <div className="w-full max-w-md space-y-8 glass-card p-8 rounded-3xl relative z-10">
        {/* Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/25">
            <Video className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 font-outfit text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">
            Or{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              create a new account
            </Link>
          </p>
        </div>

        {/* Form Alerts */}
        {localError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 flex gap-2 items-start transition-colors duration-300">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{localError}</span>
          </div>
        )}

        {infoMessage && (
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-4 text-sm text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 flex gap-2 items-start break-all transition-colors duration-300">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Input fields */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="login-id" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5 transition-colors duration-300">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-gray-500 transition-colors duration-300">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-id"
                  name="loginIdentifier"
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="glass-input pl-10 w-full"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 transition-colors duration-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-gray-500 transition-colors duration-300">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10 w-full"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
