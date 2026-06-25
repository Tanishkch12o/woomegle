import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Users, AlertTriangle, IndianRupee, Eye, Ban,
  CheckCircle, RefreshCw, EyeOff, UserMinus, ShieldAlert
} from 'lucide-react';
import { apiFetch } from '../config/api';

export default function AdminDashboard() {
  const { token, user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('stats'); // 'stats' | 'users' | 'reports'

  // Ban Dialog state
  const [selectedUserToBan, setSelectedUserToBan] = useState(null);
  const [banReason, setBanReason] = useState('Violating platform guidelines');

  const fetchData = async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      
      // Fetch Dashboard statistics using apiFetch
      const { res: statsRes, data: statsData } = await apiFetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(statsData);

      // Fetch Reports using apiFetch
      const { res: reportsRes, data: reportsData } = await apiFetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportsRes.ok) setReports(reportsData);

      // Fetch Users list using apiFetch
      const { res: usersRes, data: usersData } = await apiFetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) setUsersList(usersData);

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleBanUser = async (e) => {
    e.preventDefault();
    if (!selectedUserToBan) return;

    try {
      const { res, data } = await apiFetch(`/api/admin/users/${selectedUserToBan}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ banReason })
      });

      if (res.ok) {
        setSelectedUserToBan(null);
        setBanReason('Violating platform guidelines');
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const { res } = await apiFetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReport = async (reportId, actionType) => {
    // actionType: 'resolved' or 'dismissed'
    try {
      const { res } = await apiFetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: actionType })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-sm text-center border border-red-500/20">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white font-outfit">Access Denied</h2>
          <p className="text-xs text-gray-400 mt-2">You must possess administrator credentials to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="animated-bg" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        
        {/* Header Title */}
        <div className="flex justify-between items-center">
          <div className="text-left">
            <h1 className="font-outfit text-3xl font-extrabold text-white flex items-center gap-2">
              <Shield className="h-8 w-8 text-indigo-500" />
              <span>Admin DashBoard</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">Platform moderation logs and metric telemetry.</p>
          </div>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl px-4 py-2.5 transition-colors font-semibold"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Reload telemetry</span>
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-white/5 gap-4">
          {['stats', 'users', 'reports'].map((tabName) => (
            <button
              key={tabName}
              onClick={() => setTab(tabName)}
              className={`pb-4 text-sm font-semibold capitalize relative transition-all ${
                tab === tabName ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tabName} overview
              {tab === tabName && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <>
            {/* STATS VIEW */}
            {tab === 'stats' && stats && (
              <div className="space-y-8">
                {/* Metrics Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-left">
                  <div className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
                      <Users className="h-5 w-5 text-indigo-400" />
                    </div>
                    <span className="block text-2xl font-bold font-outfit text-white">{stats.summary.totalUsers}</span>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Active Sockets</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="block text-2xl font-bold font-outfit text-white">{stats.summary.activeUsers}</span>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Banned Users</span>
                      <Ban className="h-5 w-5 text-red-400" />
                    </div>
                    <span className="block text-2xl font-bold font-outfit text-white">{stats.summary.bannedUsers}</span>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Tickets Pending</span>
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                    <span className="block text-2xl font-bold font-outfit text-white">{stats.summary.pendingReports}</span>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
                      <IndianRupee className="h-5 w-5 text-amber-500" />
                    </div>
                    <span className="block text-2xl font-bold font-outfit text-amber-400">₹{stats.summary.totalRevenue}</span>
                  </div>
                </div>

                {/* SVG Telemetry Analytics Graph Card */}
                <div className="glass-card rounded-3xl p-6 text-left">
                  <h3 className="font-bold text-white font-outfit mb-6">Matchmaking & Revenue Trend (Daily Metrics)</h3>
                  {stats.dailyRecords?.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-10 text-center">Telemetry data compiling...</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Simple custom SVG graphic representation of trend */}
                      <div className="h-60 w-full bg-white/5 rounded-2xl p-4 flex flex-col justify-end relative border border-white/5">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          {/* Grid background */}
                          <div className="grid grid-cols-6 grid-rows-4 w-full h-full divide-x divide-y divide-white" />
                        </div>

                        {/* Rendering daily records as a custom interactive bar list or simple coordinate nodes */}
                        <div className="flex items-end justify-between h-full gap-4 pt-10 z-10">
                          {stats.dailyRecords.slice(-7).map((record, index) => {
                            // Find percentage representing matches
                            const heightMatches = Math.min(100, Math.max(10, (record.totalMatches || 0) * 10));
                            const heightRevenue = Math.min(100, Math.max(10, (record.totalRevenue || 0) / 10));
                            return (
                              <div key={index} className="flex-grow flex flex-col items-center group">
                                <div className="flex gap-1 items-end w-full max-w-[60px] h-36">
                                  {/* Match bar */}
                                  <div
                                    className="flex-grow bg-indigo-500 rounded-t-md hover:bg-indigo-400 transition-all cursor-pointer relative"
                                    style={{ height: `${heightMatches}%` }}
                                    title={`Matches: ${record.totalMatches}`}
                                  >
                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-[9px] px-1 py-0.5 rounded text-white mb-1 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                      Match {record.totalMatches}
                                    </div>
                                  </div>
                                  {/* Revenue bar */}
                                  <div
                                    className="flex-grow bg-amber-500 rounded-t-md hover:bg-amber-400 transition-all cursor-pointer relative"
                                    style={{ height: `${heightRevenue}%` }}
                                    title={`Revenue: ₹${record.totalRevenue}`}
                                  >
                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-[9px] px-1 py-0.5 rounded text-white mb-1 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                      ₹{record.totalRevenue}
                                    </div>
                                  </div>
                                </div>
                                <span className="block text-[10px] text-gray-400 mt-2 font-mono">{record.date.substring(5)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs font-semibold justify-end">
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-indigo-500 block" /> Total Matches</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500 block" /> Revenue Generated</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* USERS OVERVIEW TAB */}
            {tab === 'users' && (
              <div className="glass-card rounded-3xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-white/5 border-b border-white/5 text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Profile</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Location / Language</th>
                        <th className="p-4">Access Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usersList.map((usr) => (
                        <tr key={usr._id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 flex items-center gap-2">
                            <img src={usr.profilePic} alt={usr.username} className="h-8 w-8 rounded-lg object-cover" />
                            <div className="text-left">
                              <span className="block font-semibold text-white">{usr.username}</span>
                              {usr.isAdmin && <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1 py-0.5 rounded">Sysop Admin</span>}
                            </div>
                          </td>
                          <td className="p-4 text-gray-300">{usr.email}</td>
                          <td className="p-4 text-xs text-gray-400 leading-normal">
                            {usr.country} / {usr.language}
                          </td>
                          <td className="p-4">
                            {usr.isBanned ? (
                              <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                                <Ban className="h-3 w-3" />
                                <span>Banned</span>
                              </span>
                            ) : usr.isOnline ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Online</span>
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">Offline</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {usr.isBanned ? (
                              <button
                                onClick={() => handleUnbanUser(usr._id)}
                                className="text-xs bg-emerald-500/10 border border-emerald-500/15 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl font-bold transition-all"
                              >
                                Revoke Ban
                              </button>
                            ) : (
                              <button
                                disabled={usr.isAdmin}
                                onClick={() => setSelectedUserToBan(usr._id)}
                                className="text-xs bg-red-500/10 border border-red-500/15 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-xl font-bold transition-all disabled:opacity-30"
                              >
                                Apply Ban
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORTS OVERVIEW TAB */}
            {tab === 'reports' && (
              <div className="glass-card rounded-3xl overflow-hidden border border-white/5 text-left">
                {reports.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-12 text-center">No moderation reports submitted.</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {reports.map((report) => (
                      <div key={report._id} className="p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center hover:bg-white/5 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase tracking-wide">
                              {report.reason}
                            </span>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                              report.status === 'pending'
                                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 animate-pulse'
                                : report.status === 'resolved'
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                : 'bg-gray-500/10 border-white/10 text-gray-400'
                            }`}>
                              {report.status}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(report.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="text-sm text-white">
                            <span className="font-semibold text-gray-300">Offender:</span>{' '}
                            <span className="font-bold">{report.reportedUser?.username || 'Unknown'}</span>{' '}
                            <span className="text-xs text-gray-500">({report.reportedUser?.email})</span>
                          </div>

                          <div className="text-xs text-gray-300">
                            <span className="font-semibold text-gray-400">Reporter:</span>{' '}
                            <span>{report.reporter?.username || 'System User'}</span>
                          </div>

                          {report.details && (
                            <p className="text-xs text-gray-400 bg-white/5 border border-white/5 rounded-xl p-2.5 max-w-2xl">
                              {report.details}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 self-end md:self-center">
                          {report.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleResolveReport(report._id, 'dismissed')}
                                className="text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 px-3.5 py-2 rounded-xl transition-all"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleResolveReport(report._id, 'resolved')}
                                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl transition-all flex items-center gap-1"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Resolve</span>
                              </button>
                              {report.reportedUser && !report.reportedUser.isBanned && (
                                <button
                                  onClick={() => setSelectedUserToBan(report.reportedUser._id)}
                                  className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl transition-all flex items-center gap-1"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  <span>Ban</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Ban Reason Modal Dialog overlay */}
      {selectedUserToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 border border-white/10 text-left">
            <h3 className="font-outfit font-extrabold text-lg text-white flex items-center gap-2 mb-4">
              <Ban className="h-5 w-5 text-red-500" />
              <span>Confirm Account Ban</span>
            </h3>
            
            <form onSubmit={handleBanUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Reason for Ban</label>
                <textarea
                  required
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full text-xs bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none text-white h-24 resize-none"
                  placeholder="Provide infraction reasons for logs..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserToBan(null)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 text-xs rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 text-xs rounded-xl font-bold transition-colors"
                >
                  Apply Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
