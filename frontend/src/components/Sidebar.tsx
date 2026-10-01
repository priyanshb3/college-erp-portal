import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarPlus,
  Users,
  Clock,
  Bell,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  LogOut,
  FolderLock,
  ClipboardCheck,
  CalendarDays,
  FileCheck,
  MessageSquare,
  UserCheck,
  Award
} from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<Props> = ({ currentTab, onSelectTab, pendingCount = 0 }) => {
  const { user, role, logout } = useAuth();

  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          {
            section: 'STUDENT ACADEMIC OS',
            items: [
              { id: 'dashboard', label: 'Academic Dashboard', icon: LayoutDashboard },
              { id: 'student-profile', label: 'My Academic Profile', icon: GraduationCap },
              { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
              { id: 'gradebook', label: 'Gradebook & Transcript', icon: Award, badge: 'CGPA' },
              { id: 'daily-schedule', label: 'Class Timetable', icon: Clock },
              { id: 'attendance', label: 'My Attendance & 75%', icon: ClipboardCheck, badge: '75%' },
              { id: 'submissions', label: 'Assignments & Deadlines', icon: FileCheck },
              { id: 'communication', label: 'Faculty Communication', icon: MessageSquare },
              { id: 'book', label: 'Book Faculty Slot', icon: CalendarPlus },
              { id: 'my-appointments', label: 'My Consultations', icon: CalendarCheck2, badgeCount: pendingCount },
              { id: 'faculty-directory', label: 'Faculty Directory', icon: Users },
              { id: 'notices', label: 'Campus Circulars', icon: Bell },
            ],
          },
        ];
      case 'faculty':
        return [
          {
            section: 'FACULTY ACADEMIC & CONSULTATION',
            items: [
              { id: 'dashboard', label: 'Faculty Workload Hub', icon: LayoutDashboard },
              { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
              { id: 'gradebook', label: 'Course Gradebook & Tests', icon: Award, badge: 'Grade' },
              { id: 'daily-schedule', label: 'Timetable & Schedule', icon: Clock, badge: 'Today' },
              { id: 'attendance', label: 'Student Attendance Register', icon: ClipboardCheck },
              { id: 'submissions', label: 'Assignment Grading', icon: FileCheck },
              { id: 'communication', label: 'Student Doubt Clearance', icon: MessageSquare },
              { id: 'my-appointments', label: 'Appointment Requests', icon: CalendarCheck2, badgeCount: pendingCount },
              { id: 'manage-slots', label: 'Office Hours & Availability', icon: CalendarPlus },
              { id: 'faculty-hr', label: 'My Attendance & HR Hub', icon: UserCheck, badge: 'HR' },
              { id: 'faculty-directory', label: 'Department Roster', icon: Users },
              { id: 'notices', label: 'Official Circulars', icon: Bell },
            ],
          },
        ];
      case 'admin':
        return [
          {
            section: 'ADMINISTRATIVE ERP CONTROL',
            items: [
              { id: 'dashboard', label: 'Ecosystem & Analytics', icon: LayoutDashboard },
              { id: 'calendar', label: 'University Calendar', icon: CalendarDays },
              { id: 'gradebook', label: 'Campus Gradebook Audit', icon: Award },
              { id: 'attendance', label: 'Student Attendance Audit', icon: ClipboardCheck },
              { id: 'submissions', label: 'Campus Assignments Audit', icon: FileCheck },
              { id: 'communication', label: 'Communication Hub Logs', icon: MessageSquare },
              { id: 'faculty-hr', label: 'Faculty Attendance & HR', icon: UserCheck, badge: 'HR' },
              { id: 'my-appointments', label: 'All Campus Appointments', icon: CalendarCheck2 },
              { id: 'student-roster', label: 'Student Enrollment Records', icon: GraduationCap },
              { id: 'faculty-directory', label: 'Faculty Directory & Roster', icon: Users },
              { id: 'notices', label: 'Circular Management', icon: Bell },
            ],
          },
        ];
      default:
        return [];
    }
  };

  const navSections = getNavItems();

  return (
    <aside className="w-64 bg-[#1B2A4A] text-slate-200 shrink-0 min-h-[calc(100vh-80px)] flex flex-col justify-between border-r border-slate-700 shadow-md">
      {/* Upper Navigation */}
      <div className="py-4">
        {/* User mini badge summary */}
        <div className="px-4 pb-4 mb-3 border-b border-slate-700/80">
          <div className="bg-[#121C33] p-3 rounded border border-slate-700 flex items-center gap-3">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border border-[#C59B27]"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-amber-300 font-mono">{user?.identifier}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{user?.department}</div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6 px-3">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 text-[10px] font-bold text-amber-400/90 tracking-wider uppercase mb-1.5 font-mono">
                {section.section}
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onSelectTab(item.id)}
                        data-testid={`nav-${item.id}`}
                        aria-label={`Navigate to ${item.label}`}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-all ${
                          isActive
                            ? 'bg-[#6B1D2F] text-white font-semibold shadow border-l-4 border-[#C59B27]'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#C59B27]' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                            {item.badge}
                          </span>
                        )}

                        {item.badgeCount !== undefined && item.badgeCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {item.badgeCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Quick Help & ERP Reference */}
          <div className="pt-2 border-t border-slate-700/60">
            <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5 font-mono">
              CAMPUS UTILITIES
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => onSelectTab('faculty-directory')}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white rounded"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cabin & Room Guide</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('notices')}
                  data-testid="nav-rules"
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white rounded"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Academic Rules & Guidelines</span>
                </button>
              </li>
              <li>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="nav-llms-txt"
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-amber-300 hover:bg-white/5 hover:text-amber-200 rounded font-mono"
                >
                  <Award className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>AI Agent Spec (/llms.txt)</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Bottom Footer Details */}
      <div className="p-3 border-t border-slate-700/80 bg-[#121C33]">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <FolderLock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[10px]">ERP SECURE SSL</span>
          </div>
          <span className="text-emerald-400 font-medium text-[10px]">Connected</span>
        </div>
        <button
          onClick={logout}
          data-testid="sidebar-logout-btn"
          aria-label="Sign out of ERP portal"
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/60 rounded font-medium transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
