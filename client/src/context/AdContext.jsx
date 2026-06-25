import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { InterstitialModal } from '../components/AdUnits';

const AdContext = createContext(null);

export const AdProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Frequency Capping Tracking
  const lastInterstitialTime = useRef(Date.now());
  const chatsSinceLastInterstitial = useRef(0);

  // Interstitial Modal State
  const [showInterstitialModal, setShowInterstitialModal] = useState(false);
  const [activeCallback, setActiveCallback] = useState(null);

  /**
   * Trigger interstitial before starting a chat if frequency cap thresholds are met.
   * Free users see an interstitial if 2 minutes or 2 completed chats have passed.
   */
  const triggerInterstitial = useCallback((onComplete) => {
    if (user?.isPremium) {
      if (onComplete) onComplete();
      return;
    }

    const now = Date.now();
    const timePassed = now - lastInterstitialTime.current > 120000; // 2 minutes
    const chatsPassed = chatsSinceLastInterstitial.current >= 2;

    if (timePassed || chatsPassed) {
      setActiveCallback(() => onComplete);
      setShowInterstitialModal(true);
    } else {
      if (onComplete) onComplete();
    }
  }, [user]);

  /**
   * Called when a chat ends to increment the completed chats counter.
   */
  const incrementCompletedChats = useCallback(() => {
    if (!user?.isPremium) {
      chatsSinceLastInterstitial.current += 1;
    }
  }, [user]);

  /**
   * Optional interstitial check before starting "Next Chat" (not every time).
   * Triggers if 3 or more chats have passed since the last interstitial.
   */
  const showPostChatAd = useCallback((onComplete) => {
    if (user?.isPremium) {
      if (onComplete) onComplete();
      return;
    }

    if (chatsSinceLastInterstitial.current >= 3) {
      setActiveCallback(() => onComplete);
      setShowInterstitialModal(true);
    } else {
      if (onComplete) onComplete();
    }
  }, [user]);

  const handleCloseInterstitial = useCallback(() => {
    setShowInterstitialModal(false);
    lastInterstitialTime.current = Date.now();
    chatsSinceLastInterstitial.current = 0;
    if (activeCallback) {
      activeCallback();
      setActiveCallback(null);
    }
  }, [activeCallback]);

  return (
    <AdContext.Provider value={{ triggerInterstitial, incrementCompletedChats, showPostChatAd }}>
      {children}
      <InterstitialModal isOpen={showInterstitialModal} onClose={handleCloseInterstitial} />
    </AdContext.Provider>
  );
};

export const useAdManager = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAdManager must be used within an AdProvider');
  }
  return context;
};
