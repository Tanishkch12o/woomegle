import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AdProvider } from './context/AdContext';

// Core Components & Pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import PremiumPage from './pages/PremiumPage';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SafetyCenter from './pages/SafetyCenter';
import DashboardPage from './pages/DashboardPage';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import CookiePolicy from './pages/CookiePolicy';
import CommunityGuidelines from './pages/CommunityGuidelines';

// Helper Component for Private/Protected routes
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050816]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

// Helper Component for Admin-only routes
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050816]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return user && user.isAdmin ? children : <Navigate to="/" replace />;
};

// Dynamic Title & Meta Description Manager for SEO
const RouteTitleManager = () => {
  const location = useLocation();
  React.useEffect(() => {
    const titles = {
      '/': 'Woomegle | Random Video Chat Platform',
      '/login': 'Log In to Woomegle | Premium Video Chat',
      '/signup': 'Sign Up for Woomegle | Join Global Matches',
      '/about': 'About Us | Woomegle Video Chat',
      '/contact': 'Contact Support | Woomegle',
      '/privacy': 'Privacy Policy | Woomegle Security',
      '/terms': 'Terms of Service | Woomegle',
      '/safety': 'Safety Center & Guidelines | Woomegle',
      '/cookies': 'Cookie Policy | Woomegle',
      '/guidelines': 'Community Guidelines | Woomegle',
      '/chat': 'Live Video Chat | Woomegle',
      '/dashboard': 'Member Dashboard | Woomegle',
      '/profile': 'My Profile | Woomegle',
      '/friends': 'My Friends & Matches | Woomegle',
      '/premium': 'Explore PRO Perks | Woomegle Premium',
      '/admin': 'Admin Dashboard | Woomegle Management'
    };

    const descriptions = {
      '/': 'Connect, meet, and match with thousands of people worldwide in high-quality video conversations instantly. The Next Generation of Random Video Chat.',
      '/login': 'Access your Woomegle account to connect with global friends and enjoy high-quality WebRTC video streaming.',
      '/signup': 'Create your Woomegle account for free today. Set your interests, choose your preferences, and start matching instantly.',
      '/premium': 'Unlock Woomegle PRO Perks including advanced gender filters, priority matching, ad-free experience, and 4K video resolution.'
    };

    const title = titles[location.pathname] || 'Woomegle | Random Video Chat Platform';
    document.title = title;

    const desc = descriptions[location.pathname] || descriptions['/'];
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }
  }, [location]);

  return null;
};

function AppContent() {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#050816] text-slate-800 dark:text-gray-200 transition-colors duration-300">
      <RouteTitleManager />
      <div className="flex-grow flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/safety" element={<SafetyCenter />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/guidelines" element={<CommunityGuidelines />} />
            
            {/* Chat is public but dynamically enhanced if logged in */}
            <Route path="/chat" element={<ChatPage />} />

            {/* Private Member routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <PrivateRoute>
                  <FriendsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/premium"
              element={
                <PrivateRoute>
                  <PremiumPage />
                </PrivateRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {!isChatPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CurrencyProvider>
            <AdProvider>
              <Router>
                <AppContent />
              </Router>
            </AdProvider>
          </CurrencyProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
