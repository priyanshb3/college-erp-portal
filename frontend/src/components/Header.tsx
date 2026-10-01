import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Calendar, 
  Clock, 
  UserCheck, 
  LogOut, 
  Bell, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { QuickLoginModal } from './QuickLoginModal';
import { NotificationCenterModal } from './NotificationCenterModal';
import { api } from '../services/api';

export const Header: React.FC<{ onOpenNotices?: () => void; onNavigateTab?: (tab: string) => void }> = ({ onOpenNotices, onNavigateTab }) => {
  const { user, role, logout } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getUnreadNotificationCount();
      setUnreadNotifCount(res.unread_count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = () => {
    switch (role) {
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#6B1D2F] text-amber-300 border border-[#8C2B41]">
            <GraduationCap className="w-3.5 h-3.5" /> STUDENT
          </span>
        );
      case 'faculty':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#1B2A4A] text-sky-200 border border-[#2D3F66]">
            <BookOpen className="w-3.5 h-3.5" /> FACULTY
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-700 text-white border border-amber-500">
            <ShieldCheck className="w-3.5 h-3.5" /> DEAN / ADMIN
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <header className="bg-[#0E1726] text-white shadow-md border-b-2 border-[#C59B27] sticky top-0 z-40">
        {/* Top Institutional Header Bar */}
        <div className="bg-gradient-to-r from-[#4F1220] via-[#1B2A4A] to-[#0E1726] px-4 py-2 flex flex-wrap items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Seal / Emblem */}
            <div className="w-9 h-9 rounded bg-[#C59B27] flex items-center justify-center text-[#1B2A4A] shadow font-serif font-extrabold text-lg border border-amber-200">
              GIT
            </div>
            <div>
              <div className="text-[10px] tracking-widest uppercase font-semibold text-amber-300/90 font-serif-erp">
                GOVERNMENT INSTITUTE OF TECHNOLOGY & SCIENCE
              </div>
              <h1 className="text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-2">
                Academic ERP & Faculty Connect Portal
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-white/15 text-white/90 rounded font-normal font-sans">
                  v2.4
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-0 text-xs">
            {/* Session Pill */}
            <div className="hidden lg:flex items-center gap-1.5 bg-black/30 border border-white/15 px-2.5 py-1 rounded text-amber-200 text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Session: <strong>2026-27 (Odd Sem)</strong></span>
            </div>

            {/* Clock & Date */}
            <div className="hidden md:flex items-center gap-2 bg-black/30 border border-white/15 px-2.5 py-1 rounded text-slate-300 font-mono text-[11px]">
              <div className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>{dateStr}</span>
              </div>
              <span className="text-white/40">|</span>
              <div className="flex items-center gap-1 text-amber-300 font-medium">
                <Clock className="w-3 h-3" />
                <span>{timeStr}</span>
              </div>
            </div>

            {/* Quick Role Switcher Button */}
            <button
              onClick={() => setShowSwitchModal(true)}
              data-testid="header-switch-persona-btn"
              aria-label="Switch between Student, Faculty, and Admin personas"
              className="flex items-center gap-1.5 bg-[#C59B27] hover:bg-[#D4A936] text-[#0E1726] font-semibold text-xs px-2.5 py-1 rounded shadow transition"
              title="Test portal as another Student, Faculty, or Dean"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Switch Persona</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => setShowNotificationCenter(true)}
              data-testid="header-notifications-btn"
              aria-label={`Central Notifications & Academic Alerts (${unreadNotifCount} unread)`}
              className="relative p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition"
              title="Central Notifications & Academic Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-600 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center px-1 border border-slate-900 animate-pulse">
                  {unreadNotifCount}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
              )}
            </button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                data-testid="header-user-menu-btn"
                aria-label="Toggle User Profile Menu"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded text-left transition border border-white/15"
              >
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={user?.name}
                  className="w-6 h-6 rounded-full object-cover border border-amber-300/50"
                />
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-[10px] text-amber-300 font-mono">
                    {user?.identifier}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-1.5 w-60 bg-white text-slate-800 rounded-md shadow-xl border border-slate-300 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <div className="font-bold text-slate-900 text-sm truncate">{user?.name}</div>
                    <div className="text-slate-500 text-[11px] truncate">{user?.email}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      {getRoleBadge()}
                      <span className="text-[10px] font-mono text-slate-500">{user?.identifier}</span>
                    </div>
                  </div>

                  <div className="px-3 py-2 text-[11px] text-slate-600 space-y-1">
                    <div><strong>Department:</strong> {user?.department}</div>
                    {user?.designation && <div><strong>Designation:</strong> {user?.designation}</div>}
                    {user?.cabin_room && <div><strong>Cabin:</strong> {user?.cabin_room}</div>}
                    {user?.cgpa_or_experience && <div><strong>Record:</strong> {user?.cgpa_or_experience}</div>}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <a
                      href="/llms.txt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-indigo-700 font-mono text-[11px]"
                    >
                      <span>🤖 AI Agent Spec (/llms.txt)</span>
                    </a>
                    <button
                      onClick={() => setShowSwitchModal(true)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Switch Persona</span>
                    </button>
                    <button
                      onClick={logout}
                      data-testid="header-logout-btn"
                      aria-label="Sign out from portal"
                      className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout from Portal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Academic Notice Ticker */}
        <div className="bg-[#121C33] px-4 py-1 text-[11px] text-slate-300 flex items-center overflow-hidden border-t border-slate-800">
          <div className="flex items-center gap-1 font-bold text-amber-400 shrink-0 mr-3 pr-3 border-r border-slate-700 uppercase tracking-wider text-[10px]">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            ERP Notice
          </div>
          <div className="overflow-hidden whitespace-nowrap w-full">
            <span className="animate-marquee hover:pause cursor-pointer text-slate-200">
              📌 Faculty Office Hours & Appointment System is active for Odd Semester 2026-27 • Students are advised to book slots at least 24 hours in advance • Capstone & Major Project Guides available on Mondays & Wednesdays • Dean office circular: Mid-term review slots open for booking.
            </span>
          </div>
        </div>
      </header>

      {/* Quick Role Switch Modal */}
      <QuickLoginModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
      />

      {/* Central Notification Center Modal */}
      <NotificationCenterModal
        isOpen={showNotificationCenter}
        onClose={() => {
          setShowNotificationCenter(false);
          fetchUnreadCount();
        }}
        onNavigateTab={(tab) => {
          if (onNavigateTab) onNavigateTab(tab);
        }}
      />
    </>
  );
};
