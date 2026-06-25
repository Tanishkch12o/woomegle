import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, UserX, MessageSquare, History, X, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../config/api';

export default function FriendsPage() {
  const { user, token, acceptFriendRequest, rejectFriendRequest } = useAuth();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);

  // Fetch chat history from server
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        setLoadingHistory(true);
        // Use apiFetch to get chat history
        const { res, data } = await apiFetch('/api/users/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setHistory(Array.isArray(data) ? data : data.history || []);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [token]);

  const handleAccept = async (id) => {
    try {
      await acceptFriendRequest(id);
    } catch (error) {
      console.error('Accept request failed:', error);
    }
  };
  const handleDecline = async (id) => {
    try {
      await rejectFriendRequest(id);
    } catch (error) {
      console.error('Reject request failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="animated-bg" />

      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Friends & Friend Requests list (Left/Side) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Requests list */}
          <div className="glass-card rounded-3xl p-6">
            <h2 className="text-md font-bold text-white font-outfit mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-400" />
              <span>Friend Requests ({user.friendRequests?.length || 0})</span>
            </h2>
            {user.friendRequests?.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No pending friend requests.</p>
            ) : (
              <div className="space-y-4">
                {user.friendRequests?.map((reqUser) => (
                  <div key={reqUser._id} className="flex items-center justify-between gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={reqUser.profilePic} alt={reqUser.username} className="h-8 w-8 rounded-lg object-cover" />
                      <span className="text-xs font-semibold text-white truncate">{reqUser.username}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAccept(reqUser._id)}
                        className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                        title="Accept"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDecline(reqUser._id)}
                        className="p-1.5 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/10 border border-white/10 transition-colors"
                        title="Decline"
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friends list */}
          <div className="glass-card rounded-3xl p-6">
            <h2 className="text-md font-bold text-white font-outfit mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <span>Friends list ({user.friends?.length || 0})</span>
            </h2>
            {user.friends?.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No friends added yet. Match in chat rooms and send requests!</p>
            ) : (
              <div className="space-y-3">
                {user.friends?.map((friend) => (
                  <div key={friend._id} className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative">
                      <img
  src={
    friend.profilePic ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(friend.username)
  }
  alt={friend.username}
/>
                        <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-darkBg ${
                          friend.isOnline ? 'bg-emerald-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div className="text-left min-w-0">
                        <span className="block text-xs font-semibold text-white truncate">{friend.username}</span>
                        <span className="block text-[9px] text-gray-400 leading-none">
                          {friend.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat History & Transcripts (Right/Main) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6">
          <h2 className="text-md font-bold text-white font-outfit mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <span>Chat Room History</span>
          </h2>

          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
            </div>
          ) : !history?.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-12">No past chat sessions logged.</p>
          ) : (
            <div className="space-y-3">
              {history.map((chat) => {
                // Find matched peer details
                const peer = chat.participants?.find(p => p._id !== user._id);
                const peerName = peer?.username || 'Unknown Vibe';
                const peerPic = peer?.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&h=50';
                const formattedDate = chat.createdAt
  ? new Date(chat.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  : 'Unknown Date';

                return (
                  <div
                    key={chat._id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={peerPic} alt={peerName} className="h-10 w-10 rounded-xl object-cover" />
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-white">{peerName}</span>
                          {peer?.isPremium && (
                            <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded uppercase font-extrabold tracking-wide">
                              PRO
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] text-gray-400">{formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs text-gray-500 font-medium">
                        {chat.messages?.length || 0} messages
                      </span>
                      <button
                        onClick={() => setSelectedChat(chat)}
                        className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl transition-colors font-medium shadow-md shadow-indigo-600/15"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Transcript</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal Overlay */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass-card rounded-3xl flex flex-col max-h-[80vh] overflow-hidden relative border border-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="font-bold text-white font-outfit">Chat Transcript</h3>
                <p className="text-xs text-gray-400">
                  Room ID: <span className="font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded">{selectedChat.roomId}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedChat(null)}
                className="p-1 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Messages Body */}
            <div className="flex-grow overflow-y-auto p-5 space-y-4 custom-scrollbar bg-black/20">
              {!selectedChat?.messages?.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm italic">No text messages exchanged during this call.</div>
              ) : (
                selectedChat.messages?.map((msg, idx) => {
                  const isMe = String(msg.sender) === String(user._id);
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold text-gray-400">{msg.senderName}</span>
                        <span className="text-[9px] text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#050816]/60 text-right border-t border-white/5 text-xs text-gray-500 flex justify-between items-center">
              <span className="flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" /> Logs encrypted for user safety.
              </span>
              <button
                onClick={() => setSelectedChat(null)}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/5 font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
