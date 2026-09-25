import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DocumentCard from '../components/DocumentCard';
import FileUploadModal from '../components/FileUploadModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  Upload,
  Download,
  Trash2,
  Eye,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import {
  formatBytes,
  formatDate,
  getFileMeta,
  getCategoryBadge,
} from '../utils/formatters';

const CATEGORIES = ['All', 'Work', 'Academic', 'Personal', 'Finance', 'Legal', 'Projects', 'Other'];
const FILE_TYPES = [
  { label: 'All Types', value: 'All' },
  { label: 'PDF Documents', value: 'pdf' },
  { label: 'Word Documents', value: 'word' },
  { label: 'Spreadsheets (Excel)', value: 'spreadsheet' },
  { label: 'Presentations', value: 'presentation' },
  { label: 'Images', value: 'image' },
  { label: 'Archives (ZIP)', value: 'archive' },
  { label: 'Plain Text', value: 'text' },
];

const Documents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  // Filter and pagination state from query params or defaults
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [type, setType] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [page, setPage] = useState(1);
  const [limit] = useState(9);

  // Data & loading state
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/documents', {
        params: {
          search,
          category: category !== 'All' ? category : undefined,
          type: type !== 'All' ? type : undefined,
          sortBy,
          sortOrder,
          page,
          limit,
        },
      });

      if (res.data.success) {
        setDocuments(res.data.documents || []);
        setPagination({
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 1,
        });
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
      showToast('Error loading documents. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, type, sortBy, sortOrder, page, limit, showToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Keep searchParams in sync
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'All') params.category = category;
    setSearchParams(params, { replace: true });
  }, [search, category, setSearchParams]);

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
        fetchDocuments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete document', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                <FolderOpen className="w-7 h-7 text-brand-400" />
                Document Library
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Browse, search, sort, and manage all your documents
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            {/* Top row: Search input + View mode toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by file name or description..."
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-sm transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-brand-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-sm transition-colors ${
                    viewMode === 'list'
                      ? 'bg-brand-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom row: Category, File Type, Sort By filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Type Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  File Type
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {FILE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                    className="px-2.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center justify-center shrink-0"
                    title={`Sort ${sortOrder === 'ASC' ? 'Ascending' : 'Descending'}`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="text-[10px] ml-1 font-bold">{sortOrder}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <span className="font-semibold text-slate-200">{documents.length}</span> of{' '}
              <span className="font-semibold text-slate-200">{pagination.total}</span> documents
            </span>
          </div>

          {/* Documents Content */}
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
              <p className="text-sm">Fetching documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No documents found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No files matched your search filters. Try clearing your query or upload a new document.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSearch('');
                    setCategory('All');
                    setType('All');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
                >
                  Upload File
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDownload={handleDownload}
                  onDelete={(d) => setDocToDelete(d)}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Date Uploaded</th>
                      {isAdmin && <th className="py-3 px-4">Owner</th>}
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {documents.map((doc) => {
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
                                className="font-semibold text-white group-hover:text-brand-300 transition-colors truncate max-w-xs block"
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
                          {isAdmin && (
                            <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                              {doc.owner_name}
                            </td>
                          )}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                to={`/documents/${doc.id}`}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                                title="Inspect Details"
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
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-slate-400">
                Page <span className="text-white font-bold">{page}</span> of{' '}
                <span className="text-white font-bold">{pagination.totalPages}</span>
              </span>

              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchDocuments();
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

export default Documents;
