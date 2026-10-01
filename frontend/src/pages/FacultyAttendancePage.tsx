import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Course, AttendanceStudentRosterItem } from '../types';
import { api } from '../services/api';
import {
  ClipboardCheck,
  Calendar,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  History,
  Save,
  Check,
  Search,
  Filter,
  Users
} from 'lucide-react';

interface Props {
  initialCourseId?: number;
  onNavigate?: (tab: string) => void;
}

export const FacultyAttendancePage: React.FC<Props> = ({ initialCourseId, onNavigate }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(initialCourseId || null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionTitle, setSessionTitle] = useState<string>('Lecture: Memory Management & Virtual Paging');
  const [timeSlot, setTimeSlot] = useState<string>('09:00 AM - 10:00 AM');
  const [roster, setRoster] = useState<AttendanceStudentRosterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'TAKE' | 'HISTORY'>('TAKE');
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch faculty courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await api.getAttendanceCourses();
        setCourses(data);
        if (data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    };
    fetchCourses();
  }, []);

  // Fetch roster when course or date changes
  useEffect(() => {
    if (!selectedCourseId) return;

    const loadRoster = async () => {
      setLoading(true);
      setSaveSuccess(false);
      try {
        const data = await api.getCourseRosterForAttendance(selectedCourseId, selectedDate);
        setRoster(data);
        if (viewMode === 'HISTORY') {
          const hist = await api.getCourseAttendanceHistory(selectedCourseId);
          setHistoryRecords(hist);
        }
      } catch (err) {
        console.error('Failed to load attendance roster:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, [selectedCourseId, selectedDate, viewMode]);

  const handleStatusChange = (studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setRoster((prev) =>
      prev.map((item) =>
        item.student_id === studentId ? { ...item, current_status: status } : item
      )
    );
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.student_id === studentId ? { ...item, remarks } : item
      )
    );
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) => prev.map((item) => ({ ...item, current_status: status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourseId) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.takeAttendance({
        course_id: selectedCourseId,
        date: selectedDate,
        session_title: sessionTitle,
        time_slot: timeSlot,
        records: roster.map((r) => ({
          student_id: r.student_id,
          status: r.current_status,
          remarks: r.remarks,
        })),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const presentCount = roster.filter((r) => r.current_status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.current_status === 'ABSENT').length;
  const lateCount = roster.filter((r) => r.current_status === 'LATE').length;
  const totalCount = roster.length;
  const sessionPct = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  const filteredRoster = roster.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.identifier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#C59B27]" />
              <h1 className="text-lg font-bold tracking-tight">Faculty Attendance Register & Marking Portal</h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Record daily lecture attendance, verify student roster, and update university 75% eligibility registers.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-[#121C33] p-1 rounded border border-slate-700">
            <button
              onClick={() => setViewMode('TAKE')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'TAKE'
                  ? 'bg-[#6B1D2F] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mark Attendance</span>
            </button>
            <button
              onClick={() => setViewMode('HISTORY')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'HISTORY'
                  ? 'bg-[#6B1D2F] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Past Records</span>
            </button>
          </div>
        </div>

        {/* Course & Session Selector Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Select Course
            </label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-[#1B2A4A]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name} ({c.semester}th Sem)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Lecture Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Lecture / Session Topic
            </label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g. Memory Management & Paging"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Time Slot
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-[#1B2A4A]"
            >
              <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM (Period 1)</option>
              <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM (Period 2)</option>
              <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM (Period 3)</option>
              <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Lab Session)</option>
            </select>
          </div>
        </div>

        {/* Live Attendance Counter Meter */}
        {viewMode === 'TAKE' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 bg-white border-t border-slate-200 divide-x divide-slate-200 text-xs">
            <div className="p-3 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Enrolled Students</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{totalCount}</div>
            </div>
            <div className="p-3 text-center bg-emerald-50/50">
              <div className="text-[10px] text-emerald-800 font-bold uppercase">Present</div>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">{presentCount}</div>
            </div>
            <div className="p-3 text-center bg-red-50/50">
              <div className="text-[10px] text-red-800 font-bold uppercase">Absent</div>
              <div className="text-xl font-bold text-red-700 mt-0.5">{absentCount}</div>
            </div>
            <div className="p-3 text-center bg-amber-50/50">
              <div className="text-[10px] text-amber-800 font-bold uppercase">Late / Excused</div>
              <div className="text-xl font-bold text-amber-700 mt-0.5">{lateCount}</div>
            </div>
            <div className="p-3 text-center bg-blue-50/50 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-blue-800 font-bold uppercase">Session Attendance</div>
              <div className="text-xl font-bold text-blue-700 mt-0.5">{sessionPct}%</div>
            </div>
          </div>
        )}
      </div>

      {viewMode === 'TAKE' ? (
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter student name or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <button
                onClick={() => handleMarkAll('PRESENT')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold whitespace-nowrap shadow-xs"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleMarkAll('ABSENT')}
                className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold whitespace-nowrap shadow-xs"
              >
                Mark All Absent
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {saveSuccess && (
                <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-300 animate-pulse">
                  <Check className="w-3.5 h-3.5" /> Attendance Saved to ERP!
                </span>
              )}
              <button
                onClick={handleSaveAttendance}
                disabled={saving || totalCount === 0}
                className="px-4 py-2 bg-[#6B1D2F] hover:bg-[#4F1220] text-white font-bold text-xs rounded shadow flex items-center gap-1.5 disabled:opacity-50 transition border border-red-900"
              >
                <Save className="w-4 h-4 text-[#C59B27]" />
                <span>{saving ? 'Submitting...' : 'Submit Official Attendance'}</span>
              </button>
            </div>
          </div>

          {/* Roster Table */}
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading student roster...</div>
          ) : filteredRoster.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No students found matching your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-center">Semester Record</th>
                    <th className="py-2.5 px-3 text-center">Mark Attendance Status</th>
                    <th className="py-2.5 px-3">Remarks / Medical Leave Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRoster.map((student) => {
                    const isPresent = student.current_status === 'PRESENT';
                    const isAbsent = student.current_status === 'ABSENT';
                    const isLate = student.current_status === 'LATE';

                    return (
                      <tr
                        key={student.student_id}
                        className={`transition-colors ${
                          isAbsent
                            ? 'bg-rose-50/40'
                            : isLate
                            ? 'bg-amber-50/30'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1B2A4A]">
                          {student.identifier}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Attended: {student.attended_classes} / {student.total_classes} classes
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                              student.percentage >= 75
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-red-50 text-red-800 border-red-300'
                            }`}
                          >
                            {student.percentage}%
                          </span>
                          {student.percentage < 75 && (
                            <span className="block text-[9px] text-red-600 font-bold mt-0.5">
                              Shortage Risk
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center rounded bg-slate-200 p-0.5 gap-1">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.student_id, 'PRESENT')}
                              className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                                isPresent
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.student_id, 'ABSENT')}
                              className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                                isAbsent
                                  ? 'bg-rose-700 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.student_id, 'LATE')}
                              className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                                isLate
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={student.remarks || ''}
                            onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                            placeholder="Optional remark..."
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#1B2A4A]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Past Attendance History Table */
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Past Attendance Sessions Log for {selectedCourse?.name}
            </h3>
            <span className="text-[11px] text-amber-300 font-mono font-bold">
              {historyRecords.length} Sessions Logged
            </span>
          </div>

          {historyRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No historical records found for this course yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Session Title</th>
                    <th className="py-2.5 px-3">Slot</th>
                    <th className="py-2.5 px-3 text-center">Total Students</th>
                    <th className="py-2.5 px-3 text-center">Present</th>
                    <th className="py-2.5 px-3 text-center">Absent</th>
                    <th className="py-2.5 px-3 text-center">Turnout %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historyRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{r.date}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{r.session_title}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{r.time_slot}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{r.total_students}</td>
                      <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">{r.present_count}</td>
                      <td className="py-2.5 px-3 text-center text-rose-700 font-bold">{r.absent_count}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                          {r.attendance_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
