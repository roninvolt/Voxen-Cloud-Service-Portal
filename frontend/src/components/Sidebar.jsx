import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderLock,
  UserCheck,
  ShieldAlert,
  HardDrive,
  UploadCloud,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onOpenUpload, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'Documents',
      path: '/documents',
      icon: <FolderLock className="w-5 h-5" />,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <UserCheck className="w-5 h-5" />,
    },
  ];

  if (isAdmin) {
    navItems.push({
      name: 'Admin Console',
      path: '/admin',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: 'Admin',
    });
  }

  const handleLinkClick = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-slate-900/90 border-r border-slate-800">
      <div className="space-y-6">
        {/* Quick Upload action */}
        {onOpenUpload && (
          <button
            onClick={() => {
              onOpenUpload();
              handleLinkClick();
            }}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/25 transition-all group"
          >
            <UploadCloud className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>Upload New File</span>
          </button>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Navigation
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Storage & Cloud info widget */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Cloud Storage</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          PostgreSQL metadata + Persistent storage with S3 support.
        </p>
        <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span>Tier: Free Cloud</span>
          <span className="text-emerald-400 font-bold">Online</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-72 h-full bg-slate-900 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
