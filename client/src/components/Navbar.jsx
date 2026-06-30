import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import {
  Sun, Moon, LogOut, Shield, Sparkles, Users, Bell,
  MessageCircle, Crown, ChevronDown, Menu, X, Video, LayoutDashboard, Gift
} from 'lucide-react';

// ─── Floating particles for navbar background ──────────────────────────────────
function NavParticles() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 1.2 + 0.3,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.15,
        opacity: theme === 'dark' ? (Math.random() * 0.4 + 0.1) : (Math.random() * 0.3 + 0.1),
        hue: Math.random() > 0.5 ? 240 : 270, // blue or purple
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, ${theme === 'dark' ? '70%' : '50%'}, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.offsetWidth) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

// ─── Nav link component with animated underline ─────────────────────────────────
function NavLink({ to, children, icon: Icon, isGold, isActive }) {
  return (
    <Link
      to={to}
      className={`nav-link-premium group relative flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold tracking-wide transition-all duration-300 rounded-lg
        ${isGold
          ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300'
          : isActive
            ? 'text-slate-900 dark:text-white'
            : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
        }
      `}
    >
      {Icon && (
        <Icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${
          isGold ? 'text-amber-500 dark:text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] dark:drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]' : ''
        }`} />
      )}
      <span className="relative z-10">{children}</span>

      {/* Animated underline */}
      <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300
        ${isActive ? 'w-3/4' : 'w-0 group-hover:w-3/4'}
        ${isGold
          ? 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(255,215,0,0.4)]'
          : 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
        }
      `} />

      {/* Hover background glow */}
      <span className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${isGold
          ? 'bg-amber-50 dark:bg-amber-500/5'
          : 'bg-slate-100 dark:bg-white/5'
        }
      `} />

      {/* Premium golden glow aura */}
      {isGold && (
        <span className="absolute -inset-1 rounded-xl bg-amber-100 dark:bg-amber-500/5 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      )}
    </Link>
  );
}

// ─── Main Navbar ────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  // Track scroll for intensified blur
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    ...(user ? [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { to: '/chat', label: 'Chat Rooms', icon: MessageCircle },
    ...(user ? [
      { to: '/friends', label: 'Friends', icon: Users },
      { to: '/referrals', label: 'Refer & Earn', icon: Gift },
      { to: '/premium', label: 'Premium', icon: Crown, isGold: true },
    ] : []),
    ...(user?.isAdmin ? [
      { to: '/admin', label: 'Admin', icon: Shield, isAdmin: true },
    ] : []),
  ];

  return (
    <nav
      className={`navbar-premium sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'navbar-scrolled'
          : ''
      }`}
    >
      {/* Particle background */}
      <NavParticles />

      {/* Top edge glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 dark:via-indigo-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-indigo-500/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">

          {/* ─── Left: Logo ──────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0" onClick={() => setMobileMenuOpen(false)}>
            {/* Logo icon */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl shadow-lg shadow-indigo-600/10 dark:shadow-indigo-600/30 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/20 dark:group-hover:shadow-indigo-500/40 overflow-hidden border border-slate-200/50 dark:border-white/10">
              <img src="/logo.png" alt="Woomegle Logo" className="h-full w-full object-cover relative z-10" />
              {/* Glow ring */}
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-30 blur-sm transition-opacity duration-500" />
            </div>
            {/* Brand text */}
            <span className="font-outfit text-xl font-extrabold tracking-tight hidden sm:block">
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Woome
              </span>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                gle
              </span>
            </span>
          </Link>

          {/* ─── Center: Nav links (desktop) ─────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                icon={link.icon}
                isGold={link.isGold}
                isActive={isActive(link.to)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* ─── Right: Actions ──────────────────────────────────────────── */}
          <div className="flex items-center gap-2 sm:gap-3">


            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="navbar-icon-btn relative p-2.5 rounded-xl transition-all duration-300"
              aria-label="Toggle Theme"
            >
              <div className="relative h-4 w-4">
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-500 transition-transform duration-300 hover:-rotate-12" />
                )}
              </div>
            </button>

            {/* Notification bell */}
            {user && (
              <button
                className="navbar-icon-btn relative p-2.5 rounded-xl transition-all duration-300"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-slate-500 dark:text-gray-400 transition-colors duration-300 hover:text-slate-900 dark:hover:text-white" />
                {/* Badge dot */}
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              </button>
            )}

            {/* ─── User Profile Card / Auth Buttons ──────────────────────── */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="profile-card-btn flex items-center gap-2 rounded-xl p-1.5 pr-2.5 transition-all duration-300"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={user.profilePic}
                      alt={user.username}
                      className="h-8 w-8 rounded-lg object-cover ring-2 ring-white/10 transition-all duration-300"
                    />
                    {/* Online dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0a0d1a]" />
                  </div>

                  {/* Username + badge */}
                  <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-[12px] font-bold text-slate-900 dark:text-white max-w-[80px] truncate">
                      {user.username}
                    </span>
                    {user.isPremium ? (
                      <span className="flex items-center gap-0.5 mt-0.5">
                        <Crown className="h-2.5 w-2.5 text-amber-500 dark:text-amber-400" />
                        <span className="text-[9px] font-extrabold text-amber-500 dark:text-amber-400 uppercase tracking-widest">
                          PRO
                        </span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 dark:text-gray-500 uppercase tracking-wider mt-0.5 font-medium">
                        Basic
                      </span>
                    )}
                  </div>

                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 dark:text-gray-500 transition-transform duration-300 hidden sm:block ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown */}
                {profileDropdownOpen && (
                  <div className="profile-dropdown absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden">
                    <div className="p-3 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.profilePic}
                          alt={user.username}
                          className="h-10 w-10 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-white/10"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{user.username}</p>
                          <p className="text-[10px] text-slate-500 dark:text-gray-400 truncate max-w-[120px]">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        My Profile
                      </Link>

                      {user.isPremium ? (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-amber-600 dark:text-amber-400">
                          <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            <Crown className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                          </div>
                          Premium Active
                        </div>
                      ) : (
                        <Link
                          to="/premium"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-all duration-200"
                        >
                          <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            <Crown className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                          </div>
                          Upgrade to PRO
                        </Link>
                      )}
                    </div>

                    <div className="p-1.5 border-t border-slate-100 dark:border-white/5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                      >
                        <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                          <LogOut className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:flex rounded-xl px-4 py-2 text-[13px] font-semibold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all duration-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="signup-btn rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="navbar-icon-btn p-2.5 rounded-xl lg:hidden transition-all duration-300"
              aria-label="Menu"
            >
              {mobileMenuOpen
                ? <X className="h-5 w-5 text-slate-900 dark:text-white" />
                : <Menu className="h-5 w-5 text-slate-500 dark:text-gray-400" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* ─── Mobile Menu ───────────────────────────────────────────────────── */}
      <div className={`lg:hidden mobile-menu overflow-hidden transition-all duration-400 ${
        mobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="relative z-10 px-4 pb-5 pt-3">
          <div className="flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive(link.to)
                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5'
                    : link.isGold
                      ? 'text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/5'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <link.icon className={`h-4 w-4 ${
                  link.isGold ? 'text-amber-500 dark:text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] dark:drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]' : ''
                }`} />
                {link.label}
                {isActive(link.to) && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                )}
              </Link>
            ))}
          </div>

          {!user && (
            <div className="mt-4 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center rounded-xl py-3 text-sm font-semibold text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center signup-btn rounded-xl py-3 text-sm font-bold text-white transition-all duration-300"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
