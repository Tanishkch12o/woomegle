import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

// Configuration for public STUN servers
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const useWebRTC = (peerSocketId) => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'failed' | 'disconnected'
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerSocketIdRef = useRef(peerSocketId);

  // Keep peerSocketId ref updated
  useEffect(() => {
    peerSocketIdRef.current = peerSocketId;
  }, [peerSocketId]);

  // 1. Initialize user camera & microphone streams
  const startLocalStream = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing user media devices:', error);
      // Fallback for audio-only or video-only if one is missing
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (err) {
        console.error('Fallback media devices failed too:', err);
      }
    }
  }, []);

  // Close active WebRTC peer connections
  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    setConnectionStatus('idle');
  }, []);

  // 2. Initialize Peer Connection
  const initializePeerConnection = useCallback((stream, destSocketId) => {
    if (!destSocketId) return null;
    
    closePeerConnection();

    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;
    setConnectionStatus('connecting');

    // Add local tracks to RTCPeerConnection
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && peerSocketIdRef.current) {
        socket.emit('signal', {
          to: peerSocketIdRef.current,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    // Handle Remote Stream Tracks
    pc.ontrack = (event) => {
      console.log('Received remote track', event.streams[0]);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      if (!pcRef.current) return;
      const state = pcRef.current.iceConnectionState;
      console.log(`ICE Connection State: ${state}`);
      
      if (state === 'connected' || state === 'completed') {
        setConnectionStatus('connected');
      } else if (state === 'disconnected') {
        setConnectionStatus('disconnected');
      } else if (state === 'failed') {
        setConnectionStatus('failed');
      }
    };

    return pc;
  }, [socket, closePeerConnection]);

  // 3. Initiate outgoing call
  const initiateCall = useCallback(async (destSocketId) => {
    try {
      const stream = await startLocalStream();
      const pc = initializePeerConnection(stream, destSocketId);
      if (!pc) return;

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit('signal', {
          to: destSocketId,
          signal: { type: 'offer', sdp: offer.sdp }
        });
      }
    } catch (err) {
      console.error('Failed to initiate call:', err);
      setConnectionStatus('failed');
    }
  }, [startLocalStream, initializePeerConnection, socket]);

  // 4. Handle incoming signals
  const handleSignalingData = useCallback(async (fromSocketId, signal) => {
    try {
      let pc = pcRef.current;

      if (signal.type === 'offer') {
        const stream = await startLocalStream();
        pc = initializePeerConnection(stream, fromSocketId);
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription({
          type: 'offer',
          sdp: signal.sdp
        }));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socket) {
          socket.emit('signal', {
            to: fromSocketId,
            signal: { type: 'answer', sdp: answer.sdp }
          });
        }
      } else if (signal.type === 'answer') {
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription({
            type: 'answer',
            sdp: signal.sdp
          }));
        }
      } else if (signal.type === 'candidate') {
        if (pc && signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error handling signaling data:', err);
    }
  }, [startLocalStream, initializePeerConnection, socket]);

  // 5. Toggles (Mute Mic, Camera Off, Screen Share)
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsAudioMuted(!audioTracks[0].enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsVideoMuted(!videoTracks[0].enabled);
      }
    }
  };

  // Screen share handler
  const toggleScreenShare = async () => {
    if (!pcRef.current || !localStreamRef.current) return;

    if (isScreenSharing) {
      // Revert screen share back to camera track
      try {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
        
        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
        }

        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(t => t.stop());
          screenStreamRef.current = null;
        }

        setIsScreenSharing(false);
      } catch (err) {
        console.error('Error reverting screen share:', err);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        // Detect if user stops screen sharing via browser native UI bar
        screenTrack.onended = () => {
          toggleScreenShare(); // revert track
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error establishing screen share:', err);
      }
    }
  };

  // Listen for socket signaling events
  useEffect(() => {
    if (!socket) return;

    const handleSignal = (data) => {
      if (data.from === peerSocketIdRef.current) {
        handleSignalingData(data.from, data.signal);
      }
    };

    socket.on('signal', handleSignal);

    return () => {
      socket.off('signal', handleSignal);
    };
  }, [socket, handleSignalingData]);

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      closePeerConnection();
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
    };
  }, [closePeerConnection]);

  return {
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
  };
};
