import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Appointment, Slot, Notice, User } from '../types';
import { api } from '../services/api';
import { StatusBadge, UrgencyBadge, ModeBadge } from '../components/StatusBadge';
import { BookAppointmentModal } from '../components/BookAppointmentModal';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';
import {
  CalendarPlus,
  CalendarCheck2,
  Clock,
  GraduationCap,
  Users,
  AlertCircle,
  Eye,
  XCircle,
  Building2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Bell,
  ClipboardCheck,
  CalendarDays,
  FileCheck,
  MessageSquare,
  AlertTriangle,
  Upload,
  Award,
  CheckCircle2
} from 'lucide-react';
import {
  ScheduleItem,
  StudentAttendanceSummary,
  Assignment,
  CommunicationMessage,
  AttendanceRiskItem,
  FacultyRecommendationItem
} from '../types';

export const StudentDashboard: React.FC<{ onNavigate: (tab: string, extra?: any) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummary | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [todayDay, setTodayDay] = useState<string>('Monday');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [attendanceRisks, setAttendanceRisks] = useState<AttendanceRiskItem[]>([]);
  const [prioritizedDeadlines, setPrioritizedDeadlines] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<FacultyRecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedFacultyForBooking, setSelectedFacultyForBooking] = useState<User | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apps, facs, notes, att, sched, assigns, msgs, risks, deadlines, recs] = await Promise.all([
        api.getMyAppointments(),
        api.getFacultyList(),
        api.getNotices(),
        api.getStudentAttendanceSummary().catch(() => null),
        api.getTodaySchedule().catch(() => ({ sessions: [], current_day: 'Today', total_sessions: 0, date: '' })),
        api.getAssignments().catch(() => []),
        api.getMessageThreads().catch(() => []),
        api.getAttendanceRisk().catch(() => []),
        api.getPrioritizedDeadlines().catch(() => null),
        api.getFacultyRecommendations().catch(() => []),
      ]);
      setAppointments(apps);
      setFacultyList(facs);
      setNotices(notes);
      setAttendanceSummary(att);
      setTodaySchedule(sched.sessions || []);
      setTodayDay(sched.current_day || 'Today');
      setAssignments(assigns || []);
      setMessages(msgs || []);
      setAttendanceRisks(risks || []);
      setPrioritizedDeadlines(deadlines);
      setRecommendations(recs || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (id: number) => {
    if (confirm('Are you sure you want to cancel this appointment request?')) {
      try {
        await api.cancelAppointment(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to cancel appointment');
      }
    }
  };

  const pendingApps = appointments.filter((a) => a.status === 'PENDING');
  const approvedApps = appointments.filter((a) => a.status === 'APPROVED');
  const upcomingApps = appointments.filter(
    (a) => a.status === 'APPROVED' || a.status === 'PENDING'
  );

  return (
    <div className="space-y-6">
      {/* Student Profile & Quick Action Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
              alt={user?.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#C59B27] shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{user?.name}</h2>
                <span className="bg-[#6B1D2F] text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-[#8C2B41] font-mono">
                  {user?.identifier}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {user?.designation || 'B.Tech Student'} • {user?.department}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-amber-200">
                <span>Academic Record: <strong>{user?.cgpa_or_experience}</strong></span>
                <span>•</span>
                <span>Track: <strong>{user?.specialization}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              onClick={() => onNavigate('student-profile')}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 border border-indigo-600"
            >
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Academic Profile</span>
            </button>
            <button
              onClick={() => onNavigate('gradebook')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 border border-amber-500"
            >
              <Award className="w-4 h-4" />
              <span>Gradebook</span>
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="px-3.5 py-2 bg-[#2D3F66] hover:bg-[#3A4F7C] text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 border border-[#435C91]"
            >
              <CalendarDays className="w-4 h-4 text-[#C59B27]" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 border border-emerald-600"
            >
              <ClipboardCheck className="w-4 h-4 text-[#C59B27]" />
              <span>Attendance (75%)</span>
            </button>
            <button
              onClick={() => {
                setSelectedFacultyForBooking(null);
                setIsBookModalOpen(true);
              }}
              className="px-3.5 py-2 bg-[#6B1D2F] hover:bg-[#4F1220] text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 border border-red-800"
            >
              <CalendarPlus className="w-4 h-4 text-[#C59B27]" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Academic Session & Fast ERP Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 border-t border-slate-200 divide-x divide-slate-200 text-xs">
          <div className="p-3 text-center bg-blue-50/40">
            <div className="text-[10px] text-blue-900 font-bold uppercase">Aggregate Attendance</div>
            <div className="text-xl font-bold text-blue-800 mt-0.5 font-mono">
              {attendanceSummary ? `${attendanceSummary.overall_percentage}%` : '88.5%'}
            </div>
            <div className="text-[9px] text-slate-500">Min 75% Rule Required</div>
          </div>
          <div className="p-3 text-center bg-purple-50/40">
            <div className="text-[10px] text-purple-900 font-bold uppercase">Active Assignments</div>
            <div className="text-xl font-bold text-purple-800 mt-0.5">{assignments.length}</div>
            <div className="text-[9px] text-slate-500">Course submissions</div>
          </div>
          <div className="p-3 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Confirmed Consultations</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{approvedApps.length}</div>
            <div className="text-[9px] text-slate-500">Faculty meetings</div>
          </div>
          <div className="p-3 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Communication Messages</div>
            <div className="text-xl font-bold text-[#6B1D2F] mt-0.5">{messages.length}</div>
            <div className="text-[9px] text-slate-500">Doubts & circulars</div>
          </div>
        </div>
      </div>

      {/* SMART ATTENDANCE RISK & RECOVERY CALCULATOR */}
      {attendanceRisks.length > 0 && (
        <div className="space-y-3">
          {attendanceRisks.some((r) => r.risk_level === 'CRITICAL_DETENTION' || r.risk_level === 'BORDERLINE_WARNING') ? (
            <div className="bg-red-50/90 border border-red-300 rounded-lg p-4 shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-red-200 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow">
                    <AlertTriangle className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-red-950 flex items-center gap-2">
                      Statutory 75% Attendance Shortage Alert & Recovery Plan
                      <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-mono uppercase font-bold">
                        Detention Risk
                      </span>
                    </h3>
                    <p className="text-xs text-red-800">
                      University Academic Ordinance 14.2: Students falling short of 75% are ineligible for End-Semester examinations.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('attendance')}
                  className="px-3 py-1.5 bg-[#6B1D2F] hover:bg-[#521321] text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Full Recovery Register &rarr;</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attendanceRisks
                  .filter((r) => r.risk_level === 'CRITICAL_DETENTION' || r.risk_level === 'BORDERLINE_WARNING')
                  .map((risk) => (
                    <div
                      key={risk.course_id}
                      className="bg-white border border-red-200 rounded p-3 text-xs flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#6B1D2F] bg-red-100 px-1.5 py-0.5 rounded">
                            {risk.course_code}
                          </span>
                          <span className="font-bold text-red-700 font-mono text-sm">
                            {risk.current_percentage}%
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 mt-1">{risk.course_name}</div>
                        <div className="text-[11px] text-slate-500">Instructor: {risk.faculty_name}</div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 bg-amber-50/60 p-2 rounded text-[11px] text-amber-900">
                        {risk.classes_needed_for_75 > 0 ? (
                          <span>
                            ⚠️ <strong>Recovery Requirement:</strong> You must attend the next{' '}
                            <strong className="text-red-700 underline font-bold">
                              {risk.classes_needed_for_75} consecutive classes
                            </strong>{' '}
                            without any absences to cross 75%.
                          </span>
                        ) : (
                          <span>
                            ⚠️ <strong>Borderline Standing:</strong> Attendance is right on the 75% boundary. You have zero buffer absences.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900">
                    Attendance Standing: Healthy & Compliant (Above 75% in all registered courses)
                  </span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    No examination detention warnings recorded for the current odd semester session.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('attendance')}
                className="text-[11px] font-bold text-emerald-800 hover:underline shrink-0"
              >
                View Detailed Register &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* TODAY'S CLASS SCHEDULE TIMETABLE */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#C59B27]" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Today's Class Schedule & Timetable ({todayDay})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('daily-schedule')}
            className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-medium"
          >
            <span>View Full Timetable</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {todaySchedule.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50">
            No regular lectures or lab sessions scheduled for today ({todayDay}). Check weekly schedule for other days.
          </div>
        ) : (
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaySchedule.map((session, sIdx) => {
              const isLab = session.session_type === 'LAB';
              return (
                <div
                  key={session.id || sIdx}
                  className={`p-3 rounded border text-xs flex flex-col justify-between ${
                    isLab
                      ? 'bg-purple-50/60 border-purple-200'
                      : 'bg-slate-50/80 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono font-bold text-xs bg-[#6B1D2F] text-white px-1.5 py-0.2 rounded">
                        {session.course_code}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-700">
                        {session.start_time} - {session.end_time}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 line-clamp-1">{session.subject_name}</h4>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-medium text-slate-800">{session.venue}</span>
                    <span className="uppercase text-[9px] font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {session.session_type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPCOMING ASSIGNMENTS & COMMUNICATION BRIDGE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Active Assignments & Submissions with Prioritized Deadlines */}
        <div className="lg:col-span-6 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Prioritized Deadlines & Submissions
              </h3>
            </div>
            <button
              onClick={() => onNavigate('submissions')}
              className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-medium"
            >
              <span>Submissions Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 space-y-2">
            {prioritizedDeadlines?.urgent && prioritizedDeadlines.urgent.length > 0 && (
              <div className="pb-2 bg-rose-50/70 p-2.5 rounded border border-rose-200 mb-2">
                <div className="flex items-center gap-1.5 text-rose-800 text-[11px] font-bold uppercase font-mono mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>Critical: Due in &lt; 24 Hours</span>
                </div>
                {prioritizedDeadlines.urgent.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 mt-1">
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{a.title}</span>
                      <div className="text-[10px] text-rose-700 font-mono font-bold">
                        {a.course_code} • {a.time_remaining}
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('submissions')}
                      className="px-2 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold text-[10px] rounded shadow-xs shrink-0"
                    >
                      Submit Now
                    </button>
                  </div>
                ))}
              </div>
            )}

            {assignments.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No assignments currently assigned.
              </div>
            ) : (
              assignments.slice(0, 3).map((a) => (
                <div key={a.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-slate-900 truncate max-w-[220px]">{a.title}</span>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border">
                      {a.total_marks} Marks
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Subject: {a.course?.code} • Due: {a.due_date}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{a.submission_format}</span>
                    <button
                      onClick={() => onNavigate('submissions')}
                      className="px-2 py-1 bg-[#6B1D2F] hover:bg-[#4F1220] text-white text-[10px] font-bold rounded shadow-xs flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Submit Solution</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 6 Cols: Faculty Communication & Doubts Bridge */}
        <div className="lg:col-span-6 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Faculty Communication Bridge & Circulars
              </h3>
            </div>
            <button
              onClick={() => onNavigate('communication')}
              className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-medium"
            >
              <span>Open Bridge</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 space-y-2">
            {messages.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No recent conversation threads or class circulars.
              </div>
            ) : (
              messages.slice(0, 3).map((m) => (
                <div key={m.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-slate-900">{m.sender?.name}</span>
                    <span className="text-[9px] font-mono text-[#6B1D2F] font-bold">
                      {m.message_type.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">{m.subject}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{m.content}</p>
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      onClick={() => onNavigate('communication')}
                      className="text-[10px] text-blue-700 hover:underline font-bold"
                    >
                      View Conversation &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Appointments + Faculty Quick Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Appointment Schedule Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Scheduled Faculty Appointments & Status
                </h3>
              </div>
              <button
                onClick={() => onNavigate('my-appointments')}
                className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-medium"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <CalendarPlus className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600">No scheduled appointments found for your roll number.</p>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="px-3 py-1.5 bg-[#6B1D2F] text-white rounded text-xs font-semibold hover:bg-[#4F1220]"
                >
                  Book your first appointment now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Token Code</th>
                      <th className="py-2.5 px-3">Faculty / Guide</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Purpose / Subject</th>
                      <th className="py-2.5 px-3">Mode & Venue</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {appointments.slice(0, 5).map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {app.appointment_code}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{app.faculty?.name}</div>
                          <div className="text-[10px] text-slate-500">{app.faculty?.designation}</div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{app.date}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{app.time_slot}</div>
                        </td>
                        <td className="py-2.5 px-3 max-w-[180px]">
                          <div className="font-medium text-slate-800 truncate">{app.purpose_category}</div>
                          <div className="text-[10px] text-slate-500 truncate">{app.purpose_details}</div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <ModeBadge mode={app.meeting_mode} />
                          <div className="text-[10px] text-slate-600 truncate mt-0.5 max-w-[130px]">
                            {app.cabin_or_link || app.faculty?.cabin_room}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingAppointment(app)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                              title="View Formal Slip"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {app.status === 'PENDING' && (
                              <button
                                onClick={() => handleCancel(app.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded"
                                title="Cancel Request"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Smart Faculty Recommendation Engine & Office Hours */}
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Recommended Faculty Advisors & Open Slots
                </h3>
              </div>
              <button
                onClick={() => onNavigate('faculty-directory')}
                className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-medium"
              >
                <span>All Faculty & Cabins</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 4).map((rec) => {
                  const matchedUser = facultyList.find((f) => f.id === rec.faculty_id) || ({
                    id: rec.faculty_id,
                    name: rec.name,
                    identifier: rec.identifier,
                    department: rec.department,
                    designation: rec.designation,
                    cabin_room: rec.cabin_room,
                    specialization: rec.specialization,
                    avatar_url: rec.avatar_url,
                  } as User);

                  return (
                    <div
                      key={rec.faculty_id}
                      className="border border-slate-200 rounded p-3 bg-slate-50/50 hover:bg-white hover:border-[#1B2A4A] transition flex flex-col justify-between shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={rec.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                          alt={rec.name}
                          className="w-12 h-12 rounded-full object-cover border border-[#C59B27] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-xs truncate">{rec.name}</h4>
                            <span className="text-[9px] font-mono bg-blue-100 text-blue-900 px-1 py-0.2 rounded border">
                              {rec.identifier}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 truncate">{rec.designation}</div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{rec.cabin_room}</div>
                          <div className="text-[10px] text-emerald-700 font-semibold truncate mt-0.5">
                            {rec.specialization}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                            💡 {rec.match_reason}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFacultyForBooking(matchedUser);
                            setIsBookModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-[#6B1D2F] hover:bg-[#4F1220] text-white text-[10px] font-bold rounded shadow-xs shrink-0 flex items-center gap-1"
                        >
                          <CalendarPlus className="w-3 h-3 text-[#C59B27]" />
                          <span>Book ({rec.available_slots_count})</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                facultyList.slice(0, 4).map((fac) => (
                  <div
                    key={fac.id}
                    className="border border-slate-200 rounded p-3 bg-slate-50/50 hover:bg-white hover:border-[#1B2A4A] transition flex items-start gap-3 shadow-2xs"
                  >
                    <img
                      src={fac.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                      alt={fac.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-300 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{fac.name}</h4>
                        <span className="text-[9px] font-mono bg-blue-100 text-blue-900 px-1 py-0.2 rounded border">
                          {fac.identifier}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">{fac.designation}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{fac.cabin_room}</div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-700 font-semibold truncate max-w-[120px]">
                          {fac.specialization}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedFacultyForBooking(fac);
                            setIsBookModalOpen(true);
                          }}
                          className="px-2 py-1 bg-[#6B1D2F] hover:bg-[#4F1220] text-white text-[10px] font-bold rounded shadow-xs"
                        >
                          Book Slot
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Notices & Guidelines Widget */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Booking Rules Notice */}
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="bg-[#6B1D2F] text-white px-4 py-2.5 flex items-center gap-2 border-b-2 border-[#C59B27]">
              <BookOpen className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Academic Appointment Rules
              </h3>
            </div>
            <div className="p-4 text-xs text-slate-700 space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-100 border text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <p>Appointments must be scheduled during designated faculty office hours.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-100 border text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <p>Bring printed requisition slip or show digital confirmation at faculty cabin.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-100 border text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <p>For urgent LoR / capstone reviews, set urgency to <strong className="text-red-700">HIGH</strong>.</p>
              </div>
            </div>
          </div>

          {/* Official ERP Circulars */}
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Campus Circulars
                </h3>
              </div>
            </div>
            <div className="p-3 divide-y divide-slate-100 space-y-3">
              {notices.map((note) => (
                <div key={note.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-bold text-[#6B1D2F] bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                      {note.category}
                    </span>
                    <span>{note.date}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{note.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                    {note.content}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-1 italic">
                    By: {note.posted_by}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={loadData}
        preselectedFaculty={selectedFacultyForBooking}
      />

      {/* View Detailed Formal Slip Modal */}
      <AppointmentDetailModal
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        appointment={viewingAppointment}
      />
    </div>
  );
};
