import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Appointment, Slot } from '../types';
import { api } from '../services/api';
import { StatusBadge, UrgencyBadge, ModeBadge } from '../components/StatusBadge';
import { AppointmentActionModal } from '../components/AppointmentActionModal';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  ClipboardCheck,
  CalendarDays,
  FileCheck,
  MessageSquare,
  HelpCircle,
  Award,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { ScheduleItem, Assignment, CommunicationMessage, FacultyActionCenter } from '../types';
import { FacultyAttendanceMarkerWidget } from '../components/FacultyAttendanceMarkerWidget';

export const FacultyDashboard: React.FC<{ onNavigate: (tab: string, extra?: any) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [todayDay, setTodayDay] = useState<string>('Monday');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [recentDoubts, setRecentDoubts] = useState<CommunicationMessage[]>([]);
  const [actionCenter, setActionCenter] = useState<FacultyActionCenter | null>(null);
  const [showBelowThresholdList, setShowBelowThresholdList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAppForAction, setSelectedAppForAction] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'COMPLETE'>('APPROVE');
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apps, facultySlots, scheduleData, assignData, doubtsData, actionData] = await Promise.all([
        api.getMyAppointments(),
        api.getMySlots(),
        api.getTodaySchedule(),
        api.getAssignments(),
        api.getMessageThreads('DOUBT_CLEARANCE'),
        api.getFacultyActionCenter().catch(() => null),
      ]);
      setAppointments(apps);
      setSlots(facultySlots);
      setTodaySchedule(scheduleData.sessions || []);
      setTodayDay(scheduleData.current_day || 'Today');
      setAssignments(assignData || []);
      setRecentDoubts(doubtsData || []);
      if (actionData) setActionCenter(actionData);
    } catch (err) {
      console.error('Error fetching faculty data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRequests = appointments.filter((a) => a.status === 'PENDING');
  const approvedMeetings = appointments.filter((a) => a.status === 'APPROVED');
  const completedMeetings = appointments.filter((a) => a.status === 'COMPLETED');

  const handleOpenAction = (app: Appointment, type: 'APPROVE' | 'REJECT' | 'COMPLETE') => {
    setSelectedAppForAction(app);
    setActionType(type);
  };

  return (
    <div className="space-y-6">
      {/* Faculty Profile & Room Info Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={user?.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#C59B27] shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{user?.name}</h2>
                <span className="bg-[#1B2A4A] text-sky-200 text-[10px] font-bold px-2 py-0.5 rounded border border-[#2D3F66] font-mono">
                  {user?.identifier}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {user?.designation} • {user?.department}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-amber-200">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <strong>{user?.cabin_room}</strong>
                </span>
                <span>•</span>
                <span>Specialization: <strong>{user?.specialization}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
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
              onClick={() => onNavigate('faculty-hr')}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 border border-indigo-600"
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span>My HR</span>
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 border border-emerald-600"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Student Register</span>
            </button>
            <button
              onClick={() => onNavigate('manage-slots')}
              className="px-3.5 py-2 bg-[#C59B27] hover:bg-[#D4A936] text-[#0E1726] font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 border border-amber-400"
            >
              <Clock className="w-4 h-4" />
              <span>Office Hours</span>
            </button>
          </div>
        </div>

        {/* Action Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 border-t border-slate-200 divide-x divide-slate-200 text-xs">
          <div className="p-3 text-center bg-blue-50/40">
            <div className="text-[10px] text-blue-900 font-bold uppercase">Today's Lectures / Labs</div>
            <div className="text-xl font-bold text-blue-800 mt-0.5">{todaySchedule.length}</div>
          </div>
          <div className="p-3 text-center bg-purple-50/40">
            <div className="text-[10px] text-purple-900 font-bold uppercase">Student Doubts (Bridge)</div>
            <div className="text-xl font-bold text-purple-800 mt-0.5">{recentDoubts.length}</div>
          </div>
          <div className="p-3 text-center bg-amber-50/50">
            <div className="text-[10px] text-amber-900 font-bold uppercase">Pending Requisitions</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{pendingRequests.length}</div>
          </div>
          <div className="p-3 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Confirmed Upcoming Meetings</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{approvedMeetings.length}</div>
          </div>
        </div>
      </div>

      {/* ACTIONABLE WORKLOAD & ACTION CENTER BANNER */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#6B1D2F] to-[#1B2A4A] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Faculty Action Center — Pending Tasks Requiring Attention
              </h3>
              <p className="text-[11px] text-amber-200/90 font-sans">
                Prioritized academic tasks: pending evaluations, attendance requirements, and student alerts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-black/40 border border-white/20 px-2.5 py-1 rounded text-amber-300 font-mono font-bold">
              Real-Time Academic Sync
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
          {/* 1. Pending Assignment Reviews */}
          <div
            onClick={() => onNavigate('submissions')}
            className="p-4 bg-amber-50/40 hover:bg-amber-50 cursor-pointer transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 font-mono">
                  Pending Grading
                </span>
                <FileCheck className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-2xl font-black text-amber-800 mt-2">
                {actionCenter?.pending_grading_count ?? 0}
              </div>
              <div className="text-[11px] text-amber-900 mt-1">
                Student submissions awaiting review & feedback
              </div>
            </div>
            <div className="mt-3 text-[10px] text-[#6B1D2F] font-bold flex items-center gap-1">
              Open Gradebook & Submissions &rarr;
            </div>
          </div>

          {/* 2. Students Below 75% Attendance */}
          <div
            onClick={() => setShowBelowThresholdList(!showBelowThresholdList)}
            className="p-4 bg-rose-50/40 hover:bg-rose-50 cursor-pointer transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 font-mono">
                  Attendance Risk Alert
                </span>
                <Users className="w-4 h-4 text-rose-700" />
              </div>
              <div className="text-2xl font-black text-rose-700 mt-2">
                {actionCenter?.students_below_threshold_count ?? 0}
              </div>
              <div className="text-[11px] text-rose-900 mt-1">
                Students below 75% statutory minimum
              </div>
            </div>
            <div className="mt-3 text-[10px] text-rose-800 font-bold flex items-center gap-1">
              {showBelowThresholdList ? 'Hide Warning List ▲' : 'View At-Risk Students ▼'}
            </div>
          </div>

          {/* 3. Pending Appointment Requests */}
          <div
            onClick={() => onNavigate('my-appointments')}
            className="p-4 bg-blue-50/40 hover:bg-blue-50 cursor-pointer transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 font-mono">
                  Consultation Requests
                </span>
                <CalendarCheck2 className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-2xl font-black text-blue-800 mt-2">
                {actionCenter?.pending_appointments_count ?? pendingRequests.length}
              </div>
              <div className="text-[11px] text-blue-900 mt-1">
                Student requisitions awaiting approval
              </div>
            </div>
            <div className="mt-3 text-[10px] text-blue-800 font-bold flex items-center gap-1">
              Process Requisitions &rarr;
            </div>
          </div>

          {/* 4. Unread Messages & Doubts */}
          <div
            onClick={() => onNavigate('communication')}
            className="p-4 bg-purple-50/40 hover:bg-purple-50 cursor-pointer transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 font-mono">
                  Academic Doubts
                </span>
                <MessageSquare className="w-4 h-4 text-purple-700" />
              </div>
              <div className="text-2xl font-black text-purple-800 mt-2">
                {actionCenter?.unread_doubts_count ?? recentDoubts.length}
              </div>
              <div className="text-[11px] text-purple-900 mt-1">
                Unread course doubts from students
              </div>
            </div>
            <div className="mt-3 text-[10px] text-purple-800 font-bold flex items-center gap-1">
              Open Communication Bridge &rarr;
            </div>
          </div>
        </div>

        {/* Expandable At-Risk Students Table */}
        {showBelowThresholdList && actionCenter && actionCenter.students_below_threshold.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Students In Your Courses Below 75% Attendance Threshold
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Statutory Ordinance: Minimum 75% required for exam hall ticket
              </span>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121C33] text-white text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3">Roll No</th>
                    <th className="py-2 px-3">Course</th>
                    <th className="py-2 px-3 text-center">Classes Attended</th>
                    <th className="py-2 px-3 text-center">Current %</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actionCenter.students_below_threshold.map((st) => (
                    <tr key={`${st.student_id}-${st.course_code}`} className="hover:bg-rose-50/30">
                      <td className="py-2 px-3 font-semibold text-slate-900">{st.student_name}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{st.roll_no}</td>
                      <td className="py-2 px-3">
                        <span className="font-mono text-[10px] bg-red-50 text-red-800 border border-red-200 px-1 py-0.2 rounded font-bold">
                          {st.course_code}
                        </span>{' '}
                        <span className="text-[11px] text-slate-600">{st.course_name}</span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono">
                        {st.attended} / {st.held}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          {st.percentage}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => onNavigate('communication')}
                          className="px-2 py-1 bg-[#1B2A4A] text-white hover:bg-[#2D3F66] text-[10px] font-bold rounded"
                        >
                          Notify Student
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* TEACHING WORKLOAD & PRODUCTIVITY BENCHMARK */}
      {actionCenter?.workload && (
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Faculty Academic Workload & Teaching Hours
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-300">Workload Index:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
                actionCenter.workload.workload_status === 'HEAVY'
                  ? 'bg-rose-500 text-white'
                  : actionCenter.workload.workload_status === 'OPTIMAL'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}>
                {actionCenter.workload.workload_status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-50/50 text-xs">
            <div className="p-3.5 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Weekly Sessions</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{actionCenter.workload.weekly_classes} Classes</div>
              <div className="text-[10px] text-slate-500">Lectures & Practical Labs</div>
            </div>
            <div className="p-3.5 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Weekly Teaching Load</div>
              <div className="text-xl font-bold text-[#1B2A4A] mt-1">{actionCenter.workload.weekly_hours} Hours</div>
              <div className="text-[10px] text-slate-500">Institutional Contact Hours</div>
            </div>
            <div className="p-3.5 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Active Courses</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{actionCenter.workload.active_courses} Subjects</div>
              <div className="text-[10px] text-slate-500">Theory & Lab Sections</div>
            </div>
            <div className="p-3.5 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Enrolled Students</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">{actionCenter.workload.enrolled_students} Students</div>
              <div className="text-[10px] text-slate-500">Across All Batches</div>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY ATTENDANCE MARKER & DUTY CONSOLE */}
      <FacultyAttendanceMarkerWidget
        onNavigateToHR={() => onNavigate('faculty-hr')}
      />

      {/* TODAY'S ACADEMIC SCHEDULE & ATTENDANCE TAKING WIDGET */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#C59B27]" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Today's Lecture Schedule & Attendance Taking ({todayDay})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('daily-schedule')}
            className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-medium"
          >
            <span>Full Weekly Timetable</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {todaySchedule.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50">
            No lectures or consultation periods scheduled for today ({todayDay}). Click "Full Weekly Timetable" to inspect other days.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todaySchedule.map((session, sIdx) => {
              const isConsult = session.course_code === 'CONSULT';
              const isLab = session.session_type === 'LAB';

              return (
                <div
                  key={session.id || sIdx}
                  className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-[#121C33] text-white px-2.5 py-1.5 rounded text-center shrink-0 border border-slate-700 min-w-[90px]">
                      <div className="font-mono text-xs font-bold text-amber-300">{session.start_time}</div>
                      <div className="text-[9px] text-slate-400 font-mono">to {session.end_time}</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#6B1D2F] bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                          {session.course_code}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{session.subject_name}</span>
                        {session.batch && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            {session.batch}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>Venue: <strong>{session.venue}</strong></span>
                        </span>
                        <span>•</span>
                        <span className="uppercase text-[9px] font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {session.session_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto flex items-center justify-end gap-2">
                    {!isConsult ? (
                      (() => {
                        const schedItem = actionCenter?.today_attendance_schedule?.find(
                          (c) => c.course_code.toUpperCase() === session.course_code.toUpperCase()
                        );
                        const isMarked = schedItem ? schedItem.is_attendance_marked : false;

                        return (
                          <div className="flex items-center gap-2">
                            {isMarked ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold text-[11px] rounded flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Recorded</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded">
                                Attendance Pending
                              </span>
                            )}
                            <button
                              onClick={() => onNavigate('attendance', { courseCode: session.course_code })}
                              className={`px-3 py-1.5 font-bold text-xs rounded shadow-xs flex items-center gap-1.5 transition ${
                                isMarked
                                  ? 'bg-[#1B2A4A] hover:bg-[#2D3F66] text-white'
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow'
                              }`}
                            >
                              <ClipboardCheck className="w-3.5 h-3.5 text-[#C59B27]" />
                              <span>{isMarked ? 'Review / Edit' : 'Take Attendance'}</span>
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-medium">
                        Consultation Slot
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ACADEMIC BRIDGE & SUBMISSIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Student Academic Doubts / Communication Bridge */}
        <div className="lg:col-span-6 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Student Academic Doubts & Queries
              </h3>
            </div>
            <button
              onClick={() => onNavigate('communication')}
              className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-medium"
            >
              <span>Communication Hub</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 space-y-2">
            {recentDoubts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No active academic doubts pending response.
              </div>
            ) : (
              recentDoubts.slice(0, 3).map((doubt) => (
                <div key={doubt.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-900">{doubt.sender?.name}</span>
                    <span className="font-mono text-[9px] text-slate-500">{doubt.sender?.identifier}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">{doubt.subject}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{doubt.content}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[9px] font-mono bg-red-50 text-red-900 border border-red-200 px-1 py-0.2 rounded">
                      {doubt.course?.code || 'Academic'}
                    </span>
                    <button
                      onClick={() => onNavigate('communication')}
                      className="text-[10px] text-blue-700 hover:underline font-bold"
                    >
                      View & Reply &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 6 Cols: Assignments & Submissions to Evaluate */}
        <div className="lg:col-span-6 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Assignment Submissions to Evaluate
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
            {assignments.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No assignments created yet. Click "+ Create Assignment" to post one.
              </div>
            ) : (
              assignments.slice(0, 3).map((a) => (
                <div key={a.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">{a.title}</span>
                    <span className="font-mono text-[10px] text-emerald-700 font-bold">
                      {a.submissions_count} Submissions
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Course: {a.course?.code} • Due: {a.due_date} • Max Marks: {a.total_marks}
                  </div>
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      onClick={() => onNavigate('submissions')}
                      className="px-2.5 py-1 bg-[#1B2A4A] text-white text-[10px] font-bold rounded shadow-xs hover:bg-[#2D3F66]"
                    >
                      Review & Grade &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending Requisitions Approval Queue */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#6B1D2F] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Pending Student Appointment Requisitions (Action Required)
            </h3>
          </div>
          <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded font-mono font-bold">
            {pendingRequests.length} Waiting
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading queue...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-600 bg-slate-50">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            All student appointment requests have been reviewed and addressed!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Token Code</th>
                  <th className="py-2.5 px-3">Student Name & Roll No</th>
                  <th className="py-2.5 px-3">Requested Date & Time</th>
                  <th className="py-2.5 px-3">Purpose & Details</th>
                  <th className="py-2.5 px-3">Urgency</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Review / Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingRequests.map((app) => (
                  <tr key={app.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#6B1D2F]">
                      {app.appointment_code}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{app.student?.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{app.student?.identifier} • {app.student?.designation || 'Student'}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">{app.student?.cgpa_or_experience}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{app.date}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{app.time_slot}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="font-bold text-slate-900">{app.purpose_category}</div>
                      <div className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-2">
                        "{app.purpose_details}"
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <UrgencyBadge urgency={app.urgency} />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <ModeBadge mode={app.meeting_mode} />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAction(app, 'APPROVE')}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleOpenAction(app, 'REJECT')}
                          className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] rounded shadow-xs flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                        <button
                          onClick={() => setViewingAppointment(app)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                          title="View Full Slip"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmed Meetings & Slot Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Confirmed Upcoming Agenda */}
        <div className="lg:col-span-8 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Confirmed Student Consultations
              </h3>
            </div>
            <button
              onClick={() => onNavigate('my-appointments')}
              className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-medium"
            >
              <span>All Consultations</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {approvedMeetings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No confirmed upcoming appointments. Review pending requests above to schedule meetings.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Date & Slot</th>
                    <th className="py-2.5 px-3">Purpose</th>
                    <th className="py-2.5 px-3">Venue / Cabin</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {approvedMeetings.slice(0, 5).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {app.appointment_code}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{app.student?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{app.student?.identifier}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{app.date}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{app.time_slot}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px]">
                        <div className="font-medium text-slate-800 truncate">{app.purpose_category}</div>
                        <div className="text-[10px] text-slate-500 truncate">{app.purpose_details}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="font-medium truncate max-w-[130px]">{app.cabin_or_link || user?.cabin_room}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAction(app, 'COMPLETE')}
                            className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-[10px] rounded"
                            title="Mark as Attended"
                          >
                            Mark Attended
                          </button>
                          <button
                            onClick={() => setViewingAppointment(app)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                            title="View Slip"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Active Office Hours Quick List */}
        <div className="lg:col-span-4 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                My Office Hour Slots
              </h3>
            </div>
            <button
              onClick={() => onNavigate('manage-slots')}
              className="text-[10px] bg-[#C59B27] text-slate-900 font-bold px-2 py-0.5 rounded hover:bg-amber-300"
            >
              + Add
            </button>
          </div>

          <div className="p-3 space-y-2">
            {slots.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No recurring office hours configured. Click "+ Add" to create slots.
              </div>
            ) : (
              slots.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {s.day_of_week}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                      {s.start_time} - {s.end_time}
                    </div>
                    <div className="text-[10px] text-slate-500">{s.venue}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      Max {s.max_students}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Approval/Rejection Modal */}
      <AppointmentActionModal
        isOpen={!!selectedAppForAction}
        onClose={() => setSelectedAppForAction(null)}
        onSuccess={loadData}
        appointment={selectedAppForAction}
        initialAction={actionType}
      />

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        appointment={viewingAppointment}
      />
    </div>
  );
};
