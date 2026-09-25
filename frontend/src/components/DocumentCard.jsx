import React from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Trash2,
  Eye,
  Calendar,
  HardDrive,
  User,
} from 'lucide-react';
import { formatBytes, formatShortDate, getFileMeta, getCategoryBadge } from '../utils/formatters';

const DocumentCard = ({ document, onDelete, onDownload }) => {
  const meta = getFileMeta(document.mime_type, document.original_name);
  const categoryBadgeClass = getCategoryBadge(document.category);

  return (
    <div className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/40 rounded-2xl p-5 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-brand-500/5 flex flex-col justify-between">
      <div>
        {/* Top Header: File Icon + Category Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`p-3 rounded-xl border ${meta.color} flex items-center justify-center shrink-0`}>
            {meta.icon}
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${categoryBadgeClass}`}>
            {document.category}
          </span>
        </div>

        {/* File Name */}
        <Link
          to={`/documents/${document.id}`}
          className="text-base font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1 break-all"
          title={document.original_name}
        >
          {document.original_name}
        </Link>

        {/* Description if present */}
        {document.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {document.description}
          </p>
        )}

        {/* Metadata info */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              Size
            </span>
            <span className="font-medium text-slate-300">
              {formatBytes(document.file_size)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Uploaded
            </span>
            <span className="font-medium text-slate-300">
              {formatShortDate(document.created_at)}
            </span>
          </div>

          {document.owner_name && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Owner
              </span>
              <span className="font-medium text-slate-300 truncate max-w-[120px]">
                {document.owner_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <Link
          to={`/documents/${document.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          title="Inspect & Preview"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </Link>

        <button
          onClick={() => onDownload(document)}
          className="p-1.5 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 hover:text-brand-300 border border-brand-500/20 transition-colors"
          title="Download Document"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(document)}
          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors"
          title="Delete Document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
