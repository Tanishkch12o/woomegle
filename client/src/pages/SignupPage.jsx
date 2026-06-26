import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video, User, Mail, Lock, Globe, Languages, Heart, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('unspecified');
  const [country, setCountry] = useState('Global');
  const [language, setLanguage] = useState('English');
  
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [usernameError, setUsernameError] = useState(null);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleUsernameChange = (e) => {
    const rawValue = e.target.value;
    const cleanValue = rawValue.replace(/[^A-Za-z]/g, '');
    setUsername(cleanValue);

    if (rawValue !== cleanValue || cleanValue.length < 3 || cleanValue.length > 20) {
      setUsernameError('Username can contain only letters (A-Z). Numbers, spaces, and special characters are not allowed.');
    } else {
      setUsernameError(null);
    }
  };

  const isUsernameValid = /^[A-Za-z]{3,20}$/.test(username);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setLocalError('Please fill out all required fields');
      return;
    }
    if (!isUsernameValid) {
      setLocalError('Please enter a valid username');
      return;
    }

    try {
      setIsLoading(true);
      setLocalError(null);
      const res = await signup(username, email, password, gender, country, language);
      
      if (res.success) {
        navigate('/dashboard');
      } else {
        setLocalError(res.message);
      }
    } catch (err) {
      setLocalError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="animated-bg" />

      <div className="w-full max-w-lg space-y-8 glass-card p-8 rounded-3xl relative z-10">
        {/* Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/25">
            <Video className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 font-outfit text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {localError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 flex gap-2 items-start transition-colors duration-300">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{localError}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div className="sm:col-span-2">
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5 transition-colors duration-300">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-gray-500 transition-colors duration-300">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={handleUsernameChange}
                  className="glass-input pl-10 w-full"
                  placeholder="vibevideo"
                />
              </div>
              {usernameError && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1.5 font-semibold">
                  {usernameError}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5 transition-colors duration-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-gray-500 transition-colors duration-300">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10 w-full"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="sm:col-span-2">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5 transition-colors duration-300">
                Password
              </label>
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
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5 transition-colors duration-300">
                Gender
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-gray-500 transition-colors duration-300">
                  <Heart className="h-4 w-4" />
                </div>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="glass-input pl-10 w-full appearance-none bg-white dark:bg-darkPanel text-slate-800 dark:text-white transition-colors duration-300"
                >
                  <option value="unspecified">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5 transition-colors duration-300">
                Language
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-gray-500 transition-colors duration-300">
                  <Languages className="h-4 w-4" />
                </div>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="glass-input pl-10 w-full appearance-none bg-white dark:bg-darkPanel text-slate-800 dark:text-white transition-colors duration-300"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>
            </div>

            {/* Country */}
            <div className="sm:col-span-2">
              <label htmlFor="country" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5 transition-colors duration-300">
                Country Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-gray-500 transition-colors duration-300">
                  <Globe className="h-4 w-4" />
                </div>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="glass-input pl-10 w-full appearance-none bg-white dark:bg-darkPanel text-slate-800 dark:text-white transition-colors duration-300"
                >
                  <option value="Global">Global / Anywhere</option>
                  <option value="United States">United States</option>
                  <option value="India">India</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !isUsernameValid}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
