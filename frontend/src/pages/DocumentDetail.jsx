import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowLeft,
  Download,
  Trash2,
  Calendar,
  HardDrive,
  User,
  FileType,
  Cloud,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  formatBytes,
  formatDate,
  getFileMeta,
  getCategoryBadge,
} from '../utils/formatters';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAdmin } = useAuth();

  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchDocument = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/documents/${id}`);
      if (res.data.success) {
        setDocument(res.data.document);
      }
    } catch (err) {
      console.error('Failed to load document:', err);
      showToast('Document not found or access denied.', 'error');
      navigate('/documents');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleDownload = () => {
    if (!document) return;
    const token = localStorage.getItem('token');
    const downloadUrl = `/api/documents/${document.id}/download?token=${token}`;
    const link = window.document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', document.original_name);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    showToast(`Downloading ${document.original_name}...`, 'info');
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await api.delete(`/documents/${document.id}`);
      if (res.data.success) {
        showToast('Document deleted successfully', 'success');
        navigate('/documents');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete document', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const token = localStorage.getItem('token');
  const previewUrl = document ? `/api/documents/${document.id}/preview?token=${token}` : '';
  const meta = document ? getFileMeta(document.mime_type, document.original_name) : null;
  const isImage = document?.mime_type?.startsWith('image/');
  const isPdf = document?.mime_type === 'application/pdf';
  const isText = document?.mime_type === 'text/plain';

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
          {/* Back button */}
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Documents</span>
          </Link>

          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
              <p className="text-sm">Loading document details...</p>
            </div>
          ) : document ? (
            <div className="space-y-6">
              {/* Top Banner Card */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-2xl border ${meta.color} shrink-0`}>
                      {meta.icon}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-all">
                          {document.original_name}
                        </h1>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full border ${getCategoryBadge(
                            document.category
                          )}`}
                        >
                          {document.category}
                        </span>
                      </div>
                      {document.description ? (
                        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                          {document.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 italic mt-1">
                          No description provided for this document.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-2.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 rounded-xl transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">File Size</span>
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-brand-400" />
                      {formatBytes(document.file_size)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">MIME Type</span>
                    <span className="font-semibold text-white truncate block" title={document.mime_type}>
                      {document.mime_type}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Uploaded On</span>
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      {formatDate(document.created_at)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Owner</span>
                    <span className="font-semibold text-white flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      {document.owner_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Window Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    Document Preview
                  </h3>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {isImage ? (
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                    <img
                      src={previewUrl}
                      alt={document.original_name}
                      className="max-h-[600px] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                    />
                  </div>
                ) : isPdf ? (
                  <div className="w-full h-[650px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                    <iframe
                      src={previewUrl}
                      title={document.original_name}
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : isText ? (
                  <div className="w-full h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                    <iframe
                      src={previewUrl}
                      title={document.original_name}
                      className="w-full h-full border-0 p-4 font-mono text-sm text-slate-200"
                    />
                  </div>
                ) : (
                  <div className="py-16 px-6 bg-slate-950/60 rounded-2xl border border-slate-800 text-center max-w-md mx-auto">
                    <div className={`w-16 h-16 rounded-2xl border ${meta.color} mx-auto flex items-center justify-center mb-4`}>
                      {meta.icon}
                    </div>
                    <h4 className="text-base font-bold text-white">
                      Preview not available in-browser
                    </h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      This file format ({meta.type}) requires external desktop software to render. Download the file to view its full contents.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download {document.original_name}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Document"
        message={`Are you sure you want to delete "${document?.original_name}"? This action cannot be undone.`}
        confirmText="Delete File"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default DocumentDetail;
