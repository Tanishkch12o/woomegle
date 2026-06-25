import React from 'react';
import { Video } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#050816] py-12 text-slate-500 dark:text-gray-400 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 font-outfit text-xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">
              <img src="/logo.png" alt="Woomegle Logo" className="h-8 w-8 rounded-lg object-cover" />
              <span>Woome<span className="text-indigo-500">gle</span></span>
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500 leading-relaxed transition-colors duration-300">
              The next generation of global WebRTC video communications. Safe, instant, and high-definition connections across 150+ countries.
            </p>
          </div>

          {/* Links Col 1: Explore */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-outfit text-slate-900 dark:text-white uppercase tracking-wider">Explore</h4>
            <div className="flex flex-col space-y-2 text-xs">
              <Link to="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact Us</Link>
              <Link to="/signup" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Sign Up</Link>
              <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Login</Link>
            </div>
          </div>

          {/* Links Col 2: Legal & Privacy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-outfit text-slate-900 dark:text-white uppercase tracking-wider">Legal & Privacy</h4>
            <div className="flex flex-col space-y-2 text-xs">
              <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cookie Policy</Link>
            </div>
          </div>

          {/* Links Col 3: Community & Safety */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-outfit text-slate-900 dark:text-white uppercase tracking-wider">Community & Safety</h4>
            <div className="flex flex-col space-y-2 text-xs">
              <Link to="/safety" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Safety Center</Link>
              <Link to="/guidelines" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Community Guidelines</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-gray-500">
          <p>&copy; {new Date().getFullYear()} Woomegle Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-indigo-500 font-semibold">Publisher ID: ca-pub-9986161407168773</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
