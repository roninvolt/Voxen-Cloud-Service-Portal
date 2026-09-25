import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  ShieldAlert,
  Users,
  HardDrive,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  Calendar,
  Folders,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { formatBytes, formatDate } from '../utils/formatters';

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // User status / delete modals
  const [userToModify, setUserToModify] = useState(null);
  const [actionType, setActionType] = useState(''); // 'status' | 'delete'
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users', { params: { search, page, limit: 10 } }),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
        setPagination({
          total: usersRes.data.total || 0,
          totalPages: usersRes.data.totalPages || 1,
        });
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast('Error loading administrative data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, page, showToast]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser.id) {
      showToast('You cannot deactivate your own administrative account.', 'warning');
      return;
    }

    try {
      const newStatus = !user.is_active;
      const res = await api.patch(`/admin/users/${user.id}/status`, { isActive: newStatus });
      if (res.data.success) {
        showToast(`User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToModify) return;
    setIsProcessing(true);
    try {
      const res = await api.delete(`/admin/users/${userToModify.id}`);
      if (res.data.success) {
        showToast('User and associated documents deleted successfully', 'success');
        setUserToModify(null);
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-7 h-7 text-rose-500" />
                Admin Console
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                System-wide overview, user role management, and storage monitoring
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Status: Healthy</span>
            </div>
          </div>

          {isLoading && !stats ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
              <p className="text-sm">Loading admin dashboard telemetry...</p>
            </div>
          ) : (
            <>
              {/* System KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                <StatCard
                  title="Total Users"
                  value={stats?.totalUsers || 0}
                  subtext={`${stats?.activeUsers || 0} active users`}
                  color="purple"
                  icon={<Users className="w-6 h-6 text-purple-400" />}
                />
                <StatCard
                  title="System Documents"
                  value={stats?.totalDocuments || 0}
                  subtext="Across all organization workspaces"
                  color="brand"
                  icon={<FileText className="w-6 h-6 text-brand-400" />}
                />
                <StatCard
                  title="Total Storage"
                  value={formatBytes(stats?.totalStorageBytes || 0)}
                  subtext="Active volume allocation"
                  color="cyan"
                  icon={<HardDrive className="w-6 h-6 text-cyan-400" />}
                />
                <StatCard
                  title="Monthly Uploads"
                  value={stats?.documentsThisMonth || 0}
                  subtext="Ingested this calendar month"
                  color="emerald"
                  icon={<Calendar className="w-6 h-6 text-emerald-400" />}
                />
              </div>

              {/* User Management Section */}
              <div className="mt-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-400" />
                    User Directory & Roles
                  </h2>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search users by name or email..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Documents</th>
                          <th className="py-3 px-4">Storage Used</th>
                          <th className="py-3 px-4">Joined</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-semibold text-white">{u.name}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                  u.role === 'ADMIN'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1.5 w-max ${
                                  u.is_active
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    u.is_active ? 'bg-emerald-400' : 'bg-rose-400'
                                  }`}
                                />
                                {u.is_active ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono whitespace-nowrap">
                              {u.document_count || 0}
                            </td>
                            <td className="py-3 px-4 text-xs font-mono whitespace-nowrap">
                              {formatBytes(u.total_storage || 0)}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                              {formatDate(u.created_at)}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={u.id === currentUser.id}
                                  onClick={() => handleToggleStatus(u)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
                                    u.is_active
                                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                  title={
                                    u.id === currentUser.id
                                      ? 'Cannot change own status'
                                      : u.is_active
                                      ? 'Suspend user'
                                      : 'Activate user'
                                  }
                                >
                                  {u.is_active ? 'Suspend' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  disabled={u.id === currentUser.id}
                                  onClick={() => {
                                    setUserToModify(u);
                                    setActionType('delete');
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors disabled:opacity-40"
                                  title={
                                    u.id === currentUser.id
                                      ? 'Cannot delete own account'
                                      : 'Delete user and documents'
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Delete User Modal */}
      <ConfirmModal
        isOpen={!!userToModify && actionType === 'delete'}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user "${userToModify?.name}" (${userToModify?.email})? All documents owned by this user will also be permanently deleted.`}
        confirmText="Delete User"
        confirmVariant="danger"
        isLoading={isProcessing}
        onConfirm={confirmDeleteUser}
        onClose={() => {
          setUserToModify(null);
          setActionType('');
        }}
      />
    </div>
  );
};

export default AdminDashboard;
