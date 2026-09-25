import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  File as FileGeneric,
  Presentation,
  FileCheck,
} from 'lucide-react';

export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0 || bytes === '0') return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatShortDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const getFileMeta = (mimeType = '', filename = '') => {
  const name = filename.toLowerCase();
  const mime = mimeType.toLowerCase();

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return {
      type: 'PDF',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      icon: <FileText className="w-5 h-5 text-rose-400" />,
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    };
  }

  if (
    mime.includes('image') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg')
  ) {
    return {
      type: 'Image',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      icon: <ImageIcon className="w-5 h-5 text-emerald-400" />,
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
  }

  if (
    mime.includes('word') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return {
      type: 'Word',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      icon: <FileText className="w-5 h-5 text-blue-400" />,
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
  }

  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx')
  ) {
    return {
      type: 'Excel',
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      icon: <FileSpreadsheet className="w-5 h-5 text-teal-400" />,
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    };
  }

  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx')
  ) {
    return {
      type: 'PowerPoint',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      icon: <Presentation className="w-5 h-5 text-amber-400" />,
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
  }

  if (mime.includes('zip') || name.endsWith('.zip')) {
    return {
      type: 'Archive',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      icon: <FileArchive className="w-5 h-5 text-purple-400" />,
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
  }

  if (mime === 'text/plain' || name.endsWith('.txt')) {
    return {
      type: 'Text',
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      icon: <FileCheck className="w-5 h-5 text-sky-400" />,
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    };
  }

  return {
    type: 'Document',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    icon: <FileGeneric className="w-5 h-5 text-slate-400" />,
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
};

export const getCategoryBadge = (category = 'Other') => {
  const map = {
    Academic: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    Work: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    Personal: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Finance: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    Legal: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    Projects: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    Other: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  };
  return map[category] || map.Other;
};
