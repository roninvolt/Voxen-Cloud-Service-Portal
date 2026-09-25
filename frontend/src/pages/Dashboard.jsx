import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import FileUploadModal from '../components/FileUploadModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  FileText,
  HardDrive,
  Calendar,
  Folders,
  Search,
  Upload,
  Download,
  Trash2,
  Eye,
  Activity,
  ArrowRight,
  Loader2,
  Clock,
} from 'lucide-react';
import {
  formatBytes,
  formatDate,
  getFileMeta,
  getCategoryBadge,
} from '../utils/formatters';

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Deletion modal state
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      showToast('Could not load dashboard statistics', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/documents');
    }
  };

  const handleDownload = (doc) => {
    const token = localStorage.getItem('token');
    const downloadUrl = `/api/documents/${doc.id}/download?token=${token}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', doc.original_name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading ${doc.original_name}...`, 'info');
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/documents/${docToDelete.id}`);
      if (res.data.success) {
        showToast('Document deleted successfully', 'success');
        setDocToDelete(null);
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete document', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalStorageBytes = stats?.totalStorageBytes ? Number(stats.totalStorageBytes) : 0;
  const storageLimit = 100 * 1024 * 1024; // 100MB standard quota
  const storagePercent = Math.min(Math.round((totalStorageBytes / storageLimit) * 100), 100);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          onOpenUpload={() => setIsUploadOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome back, {user?.name || 'Explorer'} 👋
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Manage, search, and securely access all your organization's documents.
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Quick Upload</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
              <p className="text-sm">Loading your documents and metrics...</p>
            </div>
          ) : (
            <>
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                <StatCard
                  title="Total Documents"
                  value={stats?.totalDocuments || 0}
                  subtext="Stored in personal workspace"
                  color="brand"
                  icon={<FileText className="w-6 h-6 text-brand-400" />}
                />
                <StatCard
                  title="Storage Used"
                  value={formatBytes(totalStorageBytes)}
                  subtext={`${storagePercent}% of 100MB standard quota`}
                  color="cyan"
                  icon={<HardDrive className="w-6 h-6 text-cyan-400" />}
                />
                <StatCard
                  title="This Month"
                  value={stats?.documentsThisMonth || 0}
                  subtext="Documents uploaded"
                  color="emerald"
                  icon={<Calendar className="w-6 h-6 text-emerald-400" />}
                />
                <StatCard
                  title="Categories"
                  value={stats?.categories?.length || 0}
                  subtext="Active classifications"
                  color="amber"
                  icon={<Folders className="w-6 h-6 text-amber-400" />}
                />
              </div>

              {/* Live Search Bar */}
              <div className="mt-8 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search documents by name, category, or description..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 hover:text-white transition-colors border border-slate-700 flex items-center gap-2"
                  >
                    <span>Search</span>
                  </button>
                </form>
              </div>

              {/* Two Column Grid: Recent Documents & Categories/Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Left: Recent Documents Table (2 columns) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand-400" />
                      Recent Documents
                    </h2>
                    <Link
                      to="/documents"
                      className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 group"
                    >
                      <span>View All Documents</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="py-3 px-4">File Name</th>
                              <th className="py-3 px-4">Category</th>
                              <th className="py-3 px-4">Size</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {stats.recentDocuments.map((doc) => {
                              const meta = getFileMeta(doc.mime_type, doc.original_name);
                              return (
                                <tr
                                  key={doc.id}
                                  className="hover:bg-slate-800/50 transition-colors group"
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg border ${meta.color}`}>
                                        {meta.icon}
                                      </div>
                                      <Link
                                        to={`/documents/${doc.id}`}
                                        className="font-medium text-white group-hover:text-brand-300 transition-colors truncate max-w-xs block"
                                        title={doc.original_name}
                                      >
                                        {doc.original_name}
                                      </Link>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span
                                      className={`text-xs px-2.5 py-0.5 rounded-full border ${getCategoryBadge(
                                        doc.category
                                      )}`}
                                    >
                                      {doc.category}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                                    {formatBytes(doc.file_size)}
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                                    {formatDate(doc.created_at)}
                                  </td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Link
                                        to={`/documents/${doc.id}`}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                                        title="View Details"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Link>
                                      <button
                                        onClick={() => handleDownload(doc)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                                        title="Download File"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setDocToDelete(doc)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        title="Delete File"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
                      <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-300">
                        No documents uploaded yet
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Upload your first file to take advantage of secure cloud storage and fast indexing.
                      </p>
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
                      >
                        Upload Document
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Categories & Recent Activity (1 column) */}
                <div className="space-y-6">
                  {/* Documents by Category */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                      <Folders className="w-4 h-4 text-amber-400" />
                      Documents by Category
                    </h3>

                    {stats?.categories && stats.categories.length > 0 ? (
                      <div className="space-y-3">
                        {stats.categories.map((cat) => {
                          const count = Number(cat.count);
                          const total = Number(stats.totalDocuments) || 1;
                          const pct = Math.round((count / total) * 100);
                          return (
                            <Link
                              key={cat.category}
                              to={`/documents?category=${encodeURIComponent(cat.category)}`}
                              className="group block"
                            >
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-semibold text-slate-300 group-hover:text-brand-300 transition-colors">
                                  {cat.category}
                                </span>
                                <span className="text-slate-400 font-mono">
                                  {count} files ({formatBytes(cat.total_size)})
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-brand-500 h-1.5 rounded-full transition-all duration-300 group-hover:bg-brand-400"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No classified documents yet.
                      </p>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Recent Activity
                    </h3>

                    {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                      <div className="space-y-3.5">
                        {stats.recentActivities.map((act) => (
                          <div key={act.id} className="flex items-start gap-3 text-xs">
                            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 shrink-0 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-slate-200">
                                <span className="font-bold text-brand-300">
                                  {act.action}
                                </span>{' '}
                                {act.document_name ? `"${act.document_name}"` : ''}
                              </p>
                              <span className="text-[10px] text-slate-500">
                                {formatDate(act.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No recent activity recorded.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchDashboardData();
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!docToDelete}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${docToDelete?.original_name}"? This file will be completely erased from cloud storage.`}
        confirmText="Delete File"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDocToDelete(null)}
      />
    </div>
  );
};

export default Dashboard;
