import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user details if token exists
  const fetchProfile = async (currentToken = token) => {
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setUser(data);
        setError(null);
      } else {
        // Token is invalid/expired
        console.warn("Invalid session, logging out");
        logout();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  // Login handler
  const login = async (loginIdentifier, password) => {
    try {
      setError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Sign up handler
  const signup = async (username, email, password, gender, country, language) => {
    try {
      setError(null);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, gender, country, language })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      setUser(prev => ({ ...prev, ...data }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Block User
  const blockUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/block/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProfile(); // reload profile details
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Unblock User
  const unblockUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/unblock/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProfile();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Send friend request
  const sendFriendRequest = async (userId) => {
    try {
      const res = await fetch(`/api/users/friends/request/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      return { success: res.ok, message: data.message };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server error' };
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (userId) => {
    try {
      const res = await fetch(`/api/users/friends/accept/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProfile();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Decline friend request
  const rejectFriendRequest = async (userId) => {
    try {
      const res = await fetch(`/api/users/friends/reject/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProfile();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        signup,
        logout,
        updateProfile,
        fetchProfile,
        blockUser,
        unblockUser,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
