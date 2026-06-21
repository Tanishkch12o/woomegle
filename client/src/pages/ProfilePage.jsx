import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Check, X, Tag, ShieldAlert, Globe, Languages, Heart, Sparkles } from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150'
];

export default function ProfilePage() {
  const { user, updateProfile, unblockUser } = useAuth();
  
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [gender, setGender] = useState('unspecified');
  const [country, setCountry] = useState('Global');
  const [language, setLanguage] = useState('English');
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('success');

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setProfilePic(user.profilePic || AVATAR_OPTIONS[0]);
      setGender(user.gender || 'unspecified');
      setCountry(user.country || 'Global');
      setLanguage(user.language || 'English');
      setInterests(user.interests || []);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const payload = {
      username,
      profilePic,
      gender,
      country,
      language,
      interests
    };

    const res = await updateProfile(payload);
    setIsLoading(false);
    
    if (res.success) {
      setStatusType('success');
      setStatusMessage('Profile updated successfully!');
    } else {
      setStatusType('error');
      setStatusMessage(res.message || 'Profile update failed.');
    }
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    const cleanTag = interestInput.trim();
    if (!cleanTag) return;

    if (interests.some(t => t.toLowerCase() === cleanTag.toLowerCase())) {
      setInterestInput('');
      return;
    }

    setInterests([...interests, cleanTag]);
    setInterestInput('');
  };

  const handleRemoveInterest = (tagToRemove) => {
    setInterests(interests.filter(tag => tag !== tagToRemove));
  };

  const handleUnblock = async (blockedId) => {
    const success = await unblockUser(blockedId);
    if (success) {
      setStatusType('success');
      setStatusMessage('User unblocked successfully.');
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

      <div className="mx-auto max-w-4xl space-y-6 relative z-10">
        <h1 className="font-outfit text-3xl font-extrabold text-white">Your Profile</h1>

        {statusMessage && (
          <div className={`rounded-xl p-4 text-sm border flex gap-2 items-center ${
            statusType === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {statusType === 'success' ? <Check className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar selector card */}
          <div className="glass-card rounded-3xl p-6 flex flex-col items-center gap-6">
            <h2 className="text-md font-bold text-white font-outfit self-start">Profile Avatar</h2>
            <img
              src={profilePic}
              alt="Preview"
              className="h-32 w-32 rounded-3xl object-cover ring-4 ring-indigo-500/30"
            />
            
            <div className="grid grid-cols-3 gap-2">
              {AVATAR_OPTIONS.map((picUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setProfilePic(picUrl)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                    profilePic === picUrl ? 'border-indigo-500 scale-105 ring-2 ring-indigo-500/20' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={picUrl} alt={`Avatar option ${idx + 1}`} className="object-cover h-full w-full" />
                </button>
              ))}
            </div>

            {user.isPremium && (
              <div className="w-full flex justify-center items-center gap-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 py-2.5 text-xs text-amber-400 font-semibold font-outfit">
                <Sparkles className="h-4 w-4" />
                <span>Premium Member Active</span>
              </div>
            )}
          </div>

          {/* Form edit details card */}
          <div className="md:col-span-2 glass-card rounded-3xl p-6">
            <h2 className="text-md font-bold text-white font-outfit mb-6">Profile Settings</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div className="sm:col-span-2">
                  <label htmlFor="edit-username" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="edit-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="glass-input pl-10 w-full"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="edit-gender" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Gender
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Heart className="h-4 w-4" />
                    </div>
                    <select
                      id="edit-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="glass-input pl-10 w-full appearance-none bg-darkPanel text-white"
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
                  <label htmlFor="edit-language" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Language
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Languages className="h-4 w-4" />
                    </div>
                    <select
                      id="edit-language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="glass-input pl-10 w-full appearance-none bg-darkPanel text-white"
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
                  <label htmlFor="edit-country" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Country
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Globe className="h-4 w-4" />
                    </div>
                    <select
                      id="edit-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="glass-input pl-10 w-full appearance-none bg-darkPanel text-white"
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

              {/* Interests tag editor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Interests Hobbies (Matching Tags)
                </label>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Tag className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      className="glass-input pl-10 w-full"
                      placeholder="e.g. music, coding, gaming"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="px-6 rounded-2xl bg-indigo-600 font-semibold hover:bg-indigo-500 transition-colors"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {interests.length === 0 ? (
                    <span className="text-sm text-gray-500 italic">No interests added yet. Add tags to find similar matches.</span>
                  ) : (
                    interests.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 text-sm font-medium bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full px-3 py-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(tag)}
                          className="hover:text-white transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-4 bg-indigo-600 rounded-2xl text-white font-semibold hover:bg-indigo-500 transition-all shadow-lg disabled:opacity-50"
                >
                  {isLoading ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Blocked Users Section */}
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-md font-bold text-white font-outfit mb-4">Blocked Users List</h2>
          {user.blockedUsers && user.blockedUsers.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No blocked users. Play nice!</p>
          ) : (
            <div className="divide-y divide-white/5">
              {user.blockedUsers?.map((blockedUser) => {
                // If it is populated, read details, else display ID
                const name = typeof blockedUser === 'object' ? blockedUser.username : blockedUser;
                const id = typeof blockedUser === 'object' ? blockedUser._id : blockedUser;
                return (
                  <div key={id} className="flex justify-between items-center py-3">
                    <span className="text-sm font-medium text-white">{name}</span>
                    <button
                      onClick={() => handleUnblock(id)}
                      className="text-xs bg-white/5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-xl border border-white/5 transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
