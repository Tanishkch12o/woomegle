import React from 'react';
import { Video } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#050816] py-8 text-slate-500 dark:text-gray-400 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 font-outfit text-xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">
            <img src="/logo.png" alt="Woomegle Logo" className="h-8 w-8 rounded-lg object-cover" />
            <span>Woome<span className="text-indigo-500">gle</span></span>
          </div>
          <p className="text-sm text-slate-400 dark:text-gray-500 transition-colors duration-300">
            &copy; {new Date().getFullYear()} Woomegle Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
            <Link to="/safety" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Safety Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
