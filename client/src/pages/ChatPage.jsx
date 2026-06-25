import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import { apiFetch } from '../config/api';
import { useAdManager } from '../context/AdContext';
import { SmallBannerAd, NativeAd } from '../components/AdUnits';
import {
  Video, Mic, MicOff, VideoOff, Monitor, PhoneOff, SkipForward,
  Send, AlertTriangle, UserCheck, ShieldAlert, Sparkles, Smile,
  Volume2, VolumeX, MessageSquare, Compass, Eye, EyeOff, X, ShieldCheck,
  ChevronDown, Users
} from 'lucide-react';

export default function ChatPage() {
  const { user, token, blockUser, sendFriendRequest } = useAuth();
  const { socket, joinQueue, skipMatch, leaveQueue, sendMessage, sendTyping } = useSocket();
  const { incrementCompletedChats, showPostChatAd } = useAdManager();

  const [peer, setPeer] = useState(null);
  const [chatDbId, setChatDbId] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'searching' | 'connected'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingState, setTypingState] = useState({ username: '', isTyping: false });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(window.innerWidth >= 768);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [chatTimeRemaining, setChatTimeRemaining] = useState(30);

  // Filters Selection state
  const [interestsFilter, setInterestsFilter] = useState(false);
  const [countryFilter, setCountryFilter] = useState('Global');
  const [languageFilter, setLanguageFilter] = useState('English');
  const [genderFilter, setGenderFilter] = useState('unspecified');

  // Premium modal + expand prompt state
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showExpandPrompt, setShowExpandPrompt] = useState(false);

  // Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate behavior');
  const [reportDetails, setReportDetails] = useState('');
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatBottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const peerRef = useRef(null);
  const initiateCallRef = useRef(null);
  const closePeerConnectionRef = useRef(null);
  const incrementCompletedChatsRef = useRef(null);

  // Connect WebRTC Hook using the matched peer socket ID
  const {
    localStream,
    remoteStream,
    connectionStatus,
    initiateCall,
    startLocalStream,
    closePeerConnection,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    toggleScreenShare
  } = useWebRTC(peer?.socketId || null);

  // Keep stable refs for functions used inside socket handlers
  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);
  useEffect(() => {
    initiateCallRef.current = initiateCall;
  }, [initiateCall]);
  useEffect(() => {
    closePeerConnectionRef.current = closePeerConnection;
  }, [closePeerConnection]);
  useEffect(() => {
    incrementCompletedChatsRef.current = incrementCompletedChats;
  }, [incrementCompletedChats]);

  // 1. Initial Local Camera Access
  useEffect(() => {
    startLocalStream();
  }, [startLocalStream]);

  // Bind local stream to HTML Video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote stream to HTML Video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Scroll to bottom of chat logs
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingState]);

  // Keep a stable ref to handleNextMatch to prevent stale state closures
  const handleNextMatch = useCallback(() => {
    if (status === 'connected') {
      incrementCompletedChats();
    }
    skipMatch();

    const filters = {
      interests: interestsFilter,
      country: countryFilter,
      language: languageFilter,
      gender: genderFilter
    };

    showPostChatAd(() => {
      joinQueue(filters);
    });
  }, [
    status,
    incrementCompletedChats,
    skipMatch,
    showPostChatAd,
    joinQueue,
    interestsFilter,
    countryFilter,
    languageFilter,
    genderFilter
  ]);

  const handleNextMatchRef = useRef(null);

  useEffect(() => {
    handleNextMatchRef.current = handleNextMatch;
  }, [handleNextMatch]);

  // Ad interval timer for Free Users (Trigger ad every 60 seconds)
  useEffect(() => {
    if (status !== 'connected' || user?.isPremium) {
      setShowAdPopup(false);
      return;
    }

    const adInterval = setInterval(() => {
      setShowAdPopup(true);
      setAdCountdown(5);
    }, 60000); // 60 seconds

    return () => clearInterval(adInterval);
  }, [status, user?.isPremium]);

  // Ad Popup Countdown Timer
  useEffect(() => {
    if (!showAdPopup) return;

    if (adCountdown > 0) {
      const timer = setTimeout(() => {
        setAdCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showAdPopup, adCountdown]);

  // Session Time Limit Timer for Free Users (30 seconds)
  useEffect(() => {
    if (status !== 'connected' || user?.isPremium) {
      setChatTimeRemaining(30);
      return;
    }

    const sessionTimer = setInterval(() => {
      setChatTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(sessionTimer);
          addSystemMessage("Standard chat time limit of 30 seconds reached. Upgrade to Premium for unlimited time!");
          setTimeout(() => {
            handleNextMatchRef.current();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(sessionTimer);
  }, [status, user?.isPremium]);

  // 2. Handle Socket Events for Matching & Chatting
  // IMPORTANT: Only depend on `socket` to prevent constant handler re-registration.
  // Use refs (peerRef, initiateCallRef, closePeerConnectionRef) for latest values.
  useEffect(() => {
    if (!socket) return;

    const handleMatched = (data) => {
      console.log('Socket matched event received:', data);
      setPeer(data.peer);
      setChatDbId(data.chatDbId);
      setStatus('connected');
      setMessages([]);
      setFriendRequestSent(false);
      setChatTimeRemaining(30);

      // WebRTC Call Initiation
      if (data.initiateCall && data.peer.socketId) {
        // Delay slightly to allow peer connection to bind track receivers
        setTimeout(() => {
          if (initiateCallRef.current) {
            initiateCallRef.current(data.peer.socketId);
          }
        }, 800);
      }
    };

    const handleWaiting = () => {
      setStatus('searching');
      setPeer(null);
      setChatDbId(null);
      if (closePeerConnectionRef.current) closePeerConnectionRef.current();
    };

    const handlePeerLeft = (data) => {
      console.log('Peer left call:', data);
      const currentPeer = peerRef.current;
      addSystemMessage(`${currentPeer?.username || data?.username || 'Peer'} has left the chat.`);
      if (closePeerConnectionRef.current) closePeerConnectionRef.current();
      setPeer(null);
      setStatus('idle');
      if (incrementCompletedChatsRef.current) incrementCompletedChatsRef.current();
    };

    const handleSkipped = () => {
      if (closePeerConnectionRef.current) closePeerConnectionRef.current();
      setPeer(null);
      setStatus('idle');
      setMessages([]);
    };

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      playChime();
    };

    const handleTyping = (data) => {
      setTypingState({ username: data.username, isTyping: data.isTyping });
    };

    const handleExpandPrompt = () => {
      setShowExpandPrompt(true);
    };

    socket.on('matched', handleMatched);
    socket.on('waiting', handleWaiting);
    socket.on('peer-left', handlePeerLeft);
    socket.on('skipped', handleSkipped);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('search-expand-prompt', handleExpandPrompt);

    return () => {
      socket.off('matched', handleMatched);
      socket.off('waiting', handleWaiting);
      socket.off('peer-left', handlePeerLeft);
      socket.off('skipped', handleSkipped);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('search-expand-prompt', handleExpandPrompt);
    };
  }, [socket]);

  // Helper to add system-level alerts to message list
  const addSystemMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { senderName: 'System', text, isSystem: true, timestamp: new Date() }
    ]);
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn("Chime play blocked or unsupported:", e);
    }
  };

  // 3. User Actions (Next, Send, Type, Report)
  const handleStartQueue = () => {
    const filters = {
      interests: interestsFilter,
      country: countryFilter,
      language: languageFilter,
      gender: genderFilter
    };
    joinQueue(filters);
  };

  const handleStopChat = () => {
    if (status === 'connected') {
      incrementCompletedChats();
    }
    skipMatch();
    leaveQueue();
    setStatus('idle');
  };

  const handleSend = (e) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || status !== 'connected') return;

    // Send via socket
    sendMessage(chatDbId, chatDbId, cleanText);

    // Save message locally
    setMessages((prev) => [
      ...prev,
      { sender: user?._id || 'local', senderName: 'You', text: cleanText, timestamp: new Date() }
    ]);

    setInputText('');

    // Stop typing immediately
    if (isTyping) {
      sendTyping(chatDbId, false);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (status !== 'connected' || !peer) return;

    if (!isTyping) {
      sendTyping(chatDbId, true);
      setIsTyping(true);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(chatDbId, false);
      setIsTyping(false);
    }, 2000);
  };

  const handleFriendRequest = async () => {
    if (!peer || peer.isGuest) return;
    const res = await sendFriendRequest(peer.userId);
    if (res.success) {
      setFriendRequestSent(true);
      addSystemMessage("Friend request sent to peer.");
    } else {
      alert(res.message);
    }
  };

  const handleReportUser = async (e) => {
    e.preventDefault();
    if (!peer) return;

    try {
      // Submit report to REST API using apiFetch
      const { res } = await apiFetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedUserId: peer.userId,
          reason: reportReason,
          details: reportDetails
        })
      });

      if (res.ok) {
        // Block user to prevent re-matching
        await blockUser(peer.userId);
        addSystemMessage("User reported and blocked successfully.");
        setShowReportModal(false);
        setReportDetails('');
        // Proceed directly to next match
        handleNextMatch();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit report');
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-[#050816] text-slate-800 dark:text-gray-200 overflow-hidden select-none">
      <div className="animated-bg" />

      {/* Main Workspace Layout (Videos + Chat) */}
      <div className="flex-grow flex flex-row overflow-hidden min-h-0 min-w-0 relative">

        {/* Left Side: Videos & Actions Area */}
        <div className="flex-grow flex flex-col justify-between p-[clamp(0.5rem,1.5vw,1rem)] min-h-0 min-w-0 relative">

          {/* Mobile Overlay Chat Toggle Button */}
          {status === 'connected' && (
            <div className="absolute top-4 right-4 z-20 md:hidden">
              <button
                onClick={() => setIsChatOpen(true)}
                className="relative p-3 rounded-2xl bg-white/80 dark:bg-black/60 border border-slate-300 dark:border-white/10 backdrop-blur-md text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-white/10 transition-colors shadow-lg"
                title="Open Chat"
              >
                <MessageSquare className="h-5 w-5" />
                {/* Notification dot */}
                {messages.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Videos Grid Container */}
          <div className="flex-grow w-full relative md:grid md:grid-cols-2 gap-[clamp(0.5rem,1.5vw,1rem)] items-center justify-items-center min-h-0 overflow-hidden">

            {/* Local Video Stream Panel */}
            {/* On Mobile: Picture-in-Picture bottom-right, floating above fullscreen Remote video */}
            <div className="absolute bottom-24 right-4 w-[120px] sm:w-[160px] aspect-video z-20 rounded-2xl border border-white/20 shadow-2xl overflow-hidden bg-white/80 dark:bg-black/60 md:relative md:bottom-auto md:right-auto md:w-full md:h-full md:rounded-3xl md:border-slate-200 dark:border-white/5 md:shadow-none md:bg-transparent flex items-center justify-center min-w-0 min-h-0">
              <div className="w-full h-full md:aspect-video md:max-h-full rounded-2xl md:rounded-3xl overflow-hidden glass-panel bg-white/80 dark:bg-black/60 shadow-2xl border border-slate-200 dark:border-white/5 relative flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]" // mirror effect
                />

                {/* Local Video controls overlay */}
                <div className="absolute bottom-3 right-3 flex gap-1.5 md:bottom-4 md:right-4 md:gap-2">
                  <button
                    onClick={toggleMute}
                    className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl border backdrop-blur-md transition-all ${
                      isAudioMuted
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-white/80 dark:bg-black/60 text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/10'
                    }`}
                    title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    {isAudioMuted ? <MicOff className="h-3.5 w-3.5 md:h-5 md:w-5" /> : <Mic className="h-3.5 w-3.5 md:h-5 md:w-5" />}
                  </button>

                  <button
                    onClick={toggleCamera}
                    className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl border backdrop-blur-md transition-all ${
                      isVideoMuted
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-white/80 dark:bg-black/60 text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/10'
                    }`}
                    title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isVideoMuted ? <VideoOff className="h-3.5 w-3.5 md:h-5 md:w-5" /> : <Video className="h-3.5 w-3.5 md:h-5 md:w-5" />}
                  </button>

                  <button
                    onClick={toggleScreenShare}
                    disabled={status !== 'connected'}
                    className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl border backdrop-blur-md transition-all disabled:opacity-30 ${
                      isScreenSharing
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        : 'bg-white/80 dark:bg-black/60 text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/10'
                    }`}
                    title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                  >
                    <Monitor className="h-3.5 w-3.5 md:h-5 md:w-5" />
                  </button>
                </div>

                {/* Camera Overlay when Video is disabled or missing */}
                {(isVideoMuted || !localStream) && (
                  <div className="absolute inset-0 bg-white/90 dark:bg-black/85 flex flex-col items-center justify-center gap-2">
                    <VideoOff className="h-6 w-6 md:h-10 md:w-10 text-gray-600" />
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">Camera Off</span>
                  </div>
                )}

                {/* Local label */}
                <div className="absolute top-3 left-3 md:top-4 md:left-4">
                  <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] md:text-[10px] font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-white/10">
                    You
                  </span>
                </div>
              </div>
            </div>

            {/* Remote Video Stream Panel */}
            {/* On Mobile: Fullscreen default display */}
            <div className="absolute inset-0 z-0 w-full h-full flex items-center justify-center min-w-0 min-h-0 md:relative md:z-10">
              <div className="w-full h-full md:aspect-video md:max-h-full rounded-none md:rounded-3xl overflow-hidden glass-panel bg-white/80 dark:bg-black/60 shadow-2xl border-0 md:border border-slate-200 dark:border-white/5 relative flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />

                {/* Remote User details overlay */}
                {status === 'connected' && peer && (
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                    <div className="rounded-2xl bg-white/80 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-3.5 md:py-2 border border-slate-300 dark:border-white/10 flex items-center gap-2">
                      <div className="text-left leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white font-outfit">{peer.username}</span>
                          {peer.isPremium && (
                            <>
                              <ShieldCheck className="h-4 w-4 text-sky-400 fill-sky-400/20 shrink-0" />
                              <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-extrabold uppercase tracking-wide">
                                PRO
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[9px] md:text-[10px] text-slate-600 dark:text-gray-300">{peer.language} | {peer.country}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!peer.isGuest && user && (
                        <button
                          onClick={handleFriendRequest}
                          disabled={friendRequestSent}
                          className={`p-2 rounded-xl border backdrop-blur-md transition-colors ${
                            friendRequestSent
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-white/80 dark:bg-black/60 text-indigo-400 hover:bg-indigo-600 hover:text-slate-900 dark:text-white border-slate-300 dark:border-white/10'
                          }`}
                          title="Add Friend"
                        >
                          <UserCheck className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                      )}
                      {user && (
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="p-2 rounded-xl bg-white/80 dark:bg-black/60 backdrop-blur-md text-red-400 hover:bg-red-600 hover:text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 transition-colors"
                          title="Report User"
                        >
                          <ShieldAlert className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Empty/Idle state overlay */}
                {status === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4 z-10 overflow-y-auto bg-white/5 dark:bg-black/40 backdrop-blur-sm">
                    <Compass className="h-12 w-12 text-indigo-400 mx-auto animate-bounce" />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white font-outfit">Not Connected</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Configure your filters and click match below to begin.</p>
                    </div>
                    {!user?.isPremium && (
                      <div className="w-full max-w-md mt-4">
                        <NativeAd />
                      </div>
                    )}
                  </div>
                )}

                {/* Searching/Matching Queue state overlay */}
                {status === 'searching' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4 z-10 bg-white/5 dark:bg-black/40 backdrop-blur-sm">
                    <span className="relative flex h-10 w-10 mx-auto">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-10 w-10 bg-indigo-500"></span>
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white font-outfit">Matching Queue...</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Searching for a partner based on your preferences.</p>
                    </div>
                    {!user?.isPremium && (
                      <div className="w-full max-w-md mt-4">
                        <SmallBannerAd />
                      </div>
                    )}
                  </div>
                )}

                {/* WebRTC Connection Status Indicators */}
                {status === 'connected' && (
                  <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide border bg-white/80 dark:bg-black/60 backdrop-blur-md ${
                      connectionStatus === 'connected'
                        ? 'text-emerald-400 border-emerald-500/20'
                        : connectionStatus === 'connecting'
                        ? 'text-amber-400 border-amber-500/20 animate-pulse'
                        : 'text-red-400 border-red-500/20'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span>WebRTC: {connectionStatus}</span>
                    </span>

                    {!user?.isPremium && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide border border-amber-500/20 bg-white/80 dark:bg-black/60 text-amber-400 backdrop-blur-md animate-pulse">
                        Time Left: {Math.floor(chatTimeRemaining / 60)}:{(chatTimeRemaining % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Connected Small Banner Ad */}
          {status === 'connected' && !user?.isPremium && (
            <div className="w-full mt-2 z-20 max-w-3xl mx-auto">
              <SmallBannerAd />
            </div>
          )}

          {/* Call Navigation & Actions buttons bar */}
          <div className="mt-4 flex gap-3 justify-center items-center shrink-0 z-20">
            {status === 'idle' ? (
              <button
                onClick={handleStartQueue}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 md:px-10 md:py-4 font-semibold text-slate-900 dark:text-white shadow-xl shadow-indigo-600/20 transition-all hover:translate-y-[-1px]"
              >
                <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Connect Random Vibe</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleStopChat}
                  className="flex items-center gap-2 rounded-2xl bg-white/80 dark:bg-black/60 md:bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-red-400 border border-red-500/20 px-4 py-3.5 md:px-6 md:py-4 font-semibold transition-colors backdrop-blur-md"
                >
                  <PhoneOff className="h-5 w-5" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>

                <button
                  onClick={handleNextMatch}
                  className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 md:px-10 md:py-4 font-semibold text-slate-900 dark:text-white shadow-xl shadow-indigo-600/20 transition-all hover:translate-y-[-1px]"
                >
                  <span>Skip / Next Partner</span>
                  <SkipForward className="h-5 w-5" />
                </button>

                {/* Tablet Collapsible Chat Toggle Button */}
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`hidden md:flex items-center gap-2 rounded-2xl border px-4 py-3.5 md:px-6 md:py-4 font-semibold transition-all backdrop-blur-md ${
                    isChatOpen
                      ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:bg-white/10'
                  }`}
                  title={isChatOpen ? 'Hide Chat' : 'Show Chat'}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="hidden lg:inline">{isChatOpen ? 'Hide Chat' : 'Show Chat'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile slide drawer overlay backdrop */}
        {isChatOpen && (
          <div
            onClick={() => setIsChatOpen(false)}
            className="fixed inset-0 bg-white/80 dark:bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}

        {/* Right Side Settings & Chat Container */}
        {/* On Mobile: Slide drawer. On Tablet: collapsible sidebar. On Desktop: collapsible sidebar (wider) */}
        <div className={`
          fixed inset-y-0 right-0 z-40 flex flex-col h-full bg-slate-50 dark:bg-[#050816]/95 border-l border-slate-200 dark:border-white/5 p-4 lg:p-6 transition-all duration-300 ease-in-out shadow-2xl
          md:relative md:inset-auto md:z-10 md:bg-black/10 md:shadow-none
          ${isChatOpen
            ? 'translate-x-0 w-[85%] sm:w-[360px] md:w-[300px] lg:w-[340px] xl:w-[380px] opacity-100'
            : 'translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:pointer-events-none md:overflow-hidden md:border-none md:p-0 lg:p-0'
          }
        `}>

          {/* Active Filters Sidebar */}
          <div className="mb-4 glass-card rounded-2xl p-4 border border-slate-200 dark:border-white/5 text-left shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-outfit">Match Filters</h3>
              <div className="flex items-center gap-2">
                {user?.isPremium && (
                  <span className="flex items-center gap-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase">
                    Pro
                  </span>
                )}
                {/* Mobile Drawer Close Button */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white md:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Interest Match Toggle */}
              <div className="col-span-2 flex justify-between items-center bg-slate-100 dark:bg-white/5 rounded-xl px-3 py-2 border border-slate-200 dark:border-white/5">
                <span className="text-xs font-semibold text-slate-600 dark:text-gray-300">Match Interests</span>
                <button
                  onClick={() => setInterestsFilter(!interestsFilter)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
                    interestsFilter ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/10'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    interestsFilter ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Language filter selector */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-gray-400 mb-1">Language</label>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full text-xs bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-2 py-1.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="Global">Global</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              {/* Country filter selector */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-gray-400 mb-1">Country</label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full text-xs bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-2 py-1.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="Global">Global</option>
                  <option value="United States">United States</option>
                  <option value="India">India</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Canada">Canada</option>
                </select>
              </div>

              {/* Gender Preference Filter (Premium Feature) */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-gray-400">
                    Gender Preference
                  </label>
                  {!user?.isPremium && (
                    <span className="flex items-center gap-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase">
                      <Sparkles className="h-2.5 w-2.5" /> Premium
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: 'unspecified', label: 'Any Gender' },
                    { value: 'male',        label: 'Male Only' },
                    { value: 'female',      label: 'Female Only' },
                    { value: 'other',       label: 'Other Only' },
                  ].map(({ value, label }) => {
                    const isPremiumOption = value !== 'unspecified';
                    const isActive = genderFilter === value;
                    const isLocked = isPremiumOption && !user?.isPremium;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          if (isLocked) {
                            setShowPremiumModal(true);
                          } else {
                            setGenderFilter(value);
                          }
                        }}
                        className={`relative text-[10px] font-semibold rounded-lg px-2 py-1.5 border transition-all text-left ${
                          isActive
                            ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                            : isLocked
                            ? 'bg-white/3 border-slate-200 dark:border-white/5 text-gray-600 cursor-pointer hover:border-amber-500/30 hover:bg-amber-500/5'
                            : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {label}
                        {isLocked && (
                          <Sparkles className="absolute top-1 right-1 h-2 w-2 text-amber-500/60" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Text Messages Stream Card */}
          <div className="flex-grow glass-card rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between overflow-hidden min-h-0">
            {/* Stream Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 shrink-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-indigo-400" /> Message Chat
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition-colors"
                  title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-red-400" />}
                </button>
                <button
                  onClick={handleClearChat}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Messages Body wrapper */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 custom-scrollbar text-left bg-black/10 min-h-0">
              {messages.map((msg, idx) => {
                if (msg.isSystem) {
                  return (
                    <div key={idx} className="text-center py-1">
                      <span className="inline-block bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg px-2.5 py-1 text-[10px] text-indigo-300 font-medium font-outfit">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.senderName === 'You';
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-gray-500 mb-0.5 px-1">{msg.senderName}</span>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-1.5 text-xs ${
                      isMe
                        ? 'bg-indigo-600 text-slate-900 dark:text-white rounded-tr-none'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-gray-200 rounded-tl-none border border-slate-200 dark:border-white/5'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {/* Remote typing indicator */}
              {typingState.isTyping && (
                <div className="flex flex-col items-start">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-gray-500 mb-0.5 px-1">{typingState.username}</span>
                  <div className="bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 rounded-2xl rounded-tl-none px-3.5 py-1.5 text-xs border border-slate-200 dark:border-white/5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Messages Form Inputs Footer */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 flex gap-2 shrink-0">
              <input
                type="text"
                disabled={status !== 'connected'}
                value={inputText}
                onChange={handleInputChange}
                className="flex-grow bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs outline-none text-slate-900 dark:text-white disabled:opacity-40"
                placeholder={status === 'connected' ? 'Type a vibe message...' : 'Connect to a partner first'}
              />
              <button
                type="submit"
                disabled={status !== 'connected' || !inputText.trim()}
                className="p-2 rounded-xl bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Slim Desktop-only Footer */}
      <footer className="hidden lg:flex h-12 bg-black/40 backdrop-blur-md border-t border-slate-200 dark:border-white/5 items-center justify-between px-6 text-[11px] text-slate-400 dark:text-gray-500 z-10 shrink-0">
        <div className="flex items-center gap-1.5 font-outfit font-extrabold text-slate-900 dark:text-white">
          <img src="/logo.png" alt="Woomegle Logo" className="h-5 w-5 rounded object-cover" />
          <span>Woome<span className="text-indigo-500">gle</span></span>
        </div>
        <p>&copy; {new Date().getFullYear()} Woomegle Inc. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link>
          <Link to="/safety" className="hover:text-indigo-400 transition-colors">Safety Center</Link>
        </div>
      </footer>

      {/* Sponsor Advertisement Popup for Free Users */}
      {showAdPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 text-center border border-slate-300 dark:border-white/10 relative shadow-2xl">
            <span className="absolute top-3 right-4 text-[9px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 tracking-wider uppercase">
              Sponsor Ad
            </span>
            <h3 className="font-outfit font-extrabold text-xl text-slate-900 dark:text-white mt-4 mb-2">
              Woomegle Sponsor Block
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6">
              Upgrade to Premium for an ad-free experience, unlimited call times, and priority matching!
            </p>

            {/* Mock Sponsor Advertisement Card */}
            <div className="w-full h-40 rounded-2xl bg-indigo-950/40 border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center p-4 mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse-slow" />
              <Sparkles className="h-10 w-10 text-indigo-400 animate-bounce mb-2 relative z-10" />
              <span className="text-sm text-slate-900 dark:text-white font-bold relative z-10">Upgrade to Woomegle PRO</span>
              <span className="text-[10px] text-slate-600 dark:text-gray-300 mt-1 max-w-[200px] text-center relative z-10">
                Unlock gender & country filters for just ₹199/week.
              </span>
            </div>

            <div className="flex justify-center">
              {adCountdown > 0 ? (
                <button
                  disabled
                  className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-400 dark:text-gray-500 px-6 py-2.5 text-xs rounded-xl font-bold font-outfit"
                >
                  Skipping in {adCountdown}s
                </button>
              ) : (
                <button
                  onClick={() => setShowAdPopup(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white px-8 py-2.5 text-xs rounded-xl font-bold font-outfit transition-all shadow-lg shadow-indigo-600/20 active:translate-y-[1px]"
                >
                  Close Ad & Resume
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {showReportModal && peer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-card rounded-3xl p-6 text-left border border-slate-300 dark:border-white/10 relative">
            <h3 className="font-outfit font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span>Report Partner</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6">
              Reporting will submit their details to our moderators for verification, block this socket, and instantly skip the match.
            </p>

            <form onSubmit={handleReportUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Reason for report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-xs bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="Inappropriate behavior">Inappropriate behavior</option>
                  <option value="Nudity or Harassment">Nudity or Harassment</option>
                  <option value="Spam or scams">Spam or scams</option>
                  <option value="Underage user">Underage user</option>
                  <option value="Other guidelines violation">Other guidelines violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Details (Optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full text-xs bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none text-slate-900 dark:text-white h-20 resize-none"
                  placeholder="Describe the context of violations..."
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white px-4 py-2 text-xs rounded-xl font-bold border border-slate-300 dark:border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white px-5 py-2 text-xs rounded-xl font-bold transition-colors"
                >
                  Submit & Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 30-Second Expand Search Prompt Banner */}
      {showExpandPrompt && status === 'searching' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="glass-card rounded-2xl border border-indigo-500/30 p-4 shadow-2xl shadow-indigo-900/30 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/30">
                <Users className="h-4 w-4 text-indigo-400" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">No match found yet</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Expand search to &quot;Any Gender&quot; for faster matching?</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowExpandPrompt(false);
                  setGenderFilter('unspecified');
                  // Re-join queue with expanded gender filter
                  const filters = {
                    interests: interestsFilter,
                    country: countryFilter,
                    language: languageFilter,
                    gender: 'unspecified'
                  };
                  joinQueue(filters);
                }}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-bold text-slate-900 dark:text-white transition-colors"
              >
                Expand Search
              </button>
              <button
                onClick={() => setShowExpandPrompt(false)}
                className="flex-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10 py-2 text-xs font-medium text-slate-600 dark:text-gray-300 transition-colors"
              >
                Keep Searching
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <PremiumUpgradeModal onClose={() => setShowPremiumModal(false)} />
      )}
    </div>
  );
}
