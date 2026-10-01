import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FacultyAttendanceRecord,
  FacultyLeaveRecord,
  FacultyHRSummary
} from '../types';
import { FacultyAttendanceMarkerWidget } from '../components/FacultyAttendanceMarkerWidget';
import {
  CalendarCheck2,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Briefcase,
  FileText,
  PlusCircle,
  Filter,
  Search,
  ShieldCheck,
  UserCheck,
  Building2,
  Award,
  ChevronDown,
  Layers,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface Props {
  onNavigate?: (tab: string) => void;
}

export const FacultyHRPortalPage: React.FC<Props> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [summary, setSummary] = useState<FacultyHRSummary | null>(null);
  const [logs, setLogs] = useState<FacultyAttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<FacultyLeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'LEAVES' | 'REGULARIZATION'>('REGISTER');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchDate, setSearchDate] = useState('');

  // Apply Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL_LEAVE');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveSuccess, setLeaveSuccess] = useState<string | null>(null);

  // Regularization Modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regInTime, setRegInTime] = useState('09:00 AM');
  const [regOutTime, setRegOutTime] = useState('05:00 PM');
  const [regStatus, setRegStatus] = useState('PRESENT');
  const [regReason, setRegReason] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, userLogs, userLeaves] = await Promise.all([
        api.getFacultyHRSummary(),
        api.getFacultyAttendanceLogs(),
        api.getFacultyLeaves(),
      ]);
      setSummary(sum);
      setLogs(userLogs);
      setLeaves(userLeaves);
    } catch (err) {
      console.error('Failed to load faculty HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      setLeaveError('Please provide a reason for the leave application.');
      return;
    }
    try {
      setSubmittingLeave(true);
      setLeaveError(null);
      await api.applyFacultyLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: leaveReason.trim(),
      });
      setLeaveSuccess('Leave application submitted successfully for Admin review!');
      setLeaveReason('');
      setShowLeaveModal(false);
      setTimeout(() => setLeaveSuccess(null), 4000);
      await loadData();
    } catch (err: any) {
      setLeaveError(err.message || 'Failed to submit leave application');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleCancelLeave = async (leaveId: number) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      await api.cancelFacultyLeave(leaveId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel leave');
    }
  };

  const handleApplyRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingReg(true);
      await api.punchFacultyAttendance({
        action: 'MARK_TODAY',
        status: regStatus,
        work_summary: `Regularization: ${regReason} (Punch In: ${regInTime}, Punch Out: ${regOutTime})`,
        date: regDate,
      });
      alert('Regularization record logged successfully!');
      setShowRegModal(false);
      setRegReason('');
      await loadData();
    } catch (err: any) {
      alert(`Error submitting regularization: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmittingReg(false);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    const matchesDate = !searchDate || log.date.includes(searchDate);
    return matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Institutional Faculty Header */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
              alt={user?.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#C59B27] shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{user?.name}</h2>
                <span className="bg-[#2D3F66] text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-600 font-mono">
                  {user?.identifier}
                </span>
                <span className="bg-emerald-900/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-700">
                  Full-Time Faculty
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {user?.designation} • {user?.department}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-amber-200">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <strong>{user?.cabin_room || 'Cabin 304'}</strong>
                </span>
                <span>•</span>
                <span>Bio-metric Terminal: <strong>Gate 2 & Block-A</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-3.5 py-2 bg-[#C59B27] hover:bg-amber-400 text-slate-900 font-bold text-xs rounded shadow transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply for Leave / OD</span>
            </button>
            <button
              onClick={() => setShowRegModal(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded border border-white/20 transition flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Regularize Punch</span>
            </button>
          </div>
        </div>

        {/* HR KPI Banner Row */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 bg-slate-50 border-t border-slate-200 divide-x divide-slate-200 text-xs">
            <div className="p-3 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Monthly Compliance</div>
              <div className="text-xl font-extrabold text-[#1B2A4A] mt-0.5">
                {summary.attendance_percentage}%
              </div>
            </div>
            <div className="p-3 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Days Present</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {summary.present_days} <span className="text-xs text-slate-400">/ {summary.total_working_days}</span>
              </div>
            </div>
            <div className="p-3 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">On-Duty (OD) Days</div>
              <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
                {summary.od_days}
              </div>
            </div>
            <div className="p-3 text-center bg-amber-50/50">
              <div className="text-[10px] text-amber-900 font-bold uppercase">Leaves Taken</div>
              <div className="text-xl font-extrabold text-amber-700 mt-0.5">
                {summary.leaves_taken}
              </div>
            </div>
            <div className="p-3 text-center bg-blue-50/50">
              <div className="text-[10px] text-blue-900 font-bold uppercase">Total Hours Logged</div>
              <div className="text-xl font-extrabold text-blue-700 mt-0.5">
                {summary.total_hours_worked} <span className="text-[10px]">hrs</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Punch Marker Widget */}
      <FacultyAttendanceMarkerWidget
        onAttendanceUpdated={() => loadData()}
      />

      {/* Success Notification */}
      {leaveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{leaveSuccess}</span>
          </div>
          <button onClick={() => setLeaveSuccess(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-300 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'REGISTER'
                ? 'border-[#1B2A4A] text-[#1B2A4A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Monthly Attendance Register ({filteredLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LEAVES')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'LEAVES'
                ? 'border-[#1B2A4A] text-[#1B2A4A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Leaves & On-Duty (OD) Management ({leaves.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Attendance Register */}
      {activeTab === 'REGISTER' && (
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="bg-[#121C33] text-white px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Official Faculty Attendance Register (Month to Date)
              </h3>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-[#1B2A4A] border border-slate-600 text-white text-xs px-2.5 py-1 rounded focus:outline-hidden"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1B2A4A] border border-slate-600 text-white text-xs px-2.5 py-1 rounded focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ON_DUTY">On Duty (OD)</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>

              {searchDate && (
                <button
                  onClick={() => setSearchDate('')}
                  className="text-xs text-amber-300 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading attendance register...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No attendance records found matching filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Punch In</th>
                    <th className="py-2.5 px-3">Punch Out</th>
                    <th className="py-2.5 px-3">Hours Logged</th>
                    <th className="py-2.5 px-3">Work Mode</th>
                    <th className="py-2.5 px-3">Duty Location / Cabin</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Audit / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLogs.map((log) => {
                    const isPresent = log.status === 'PRESENT';
                    const isOD = log.status === 'ON_DUTY';
                    const isHalf = log.status === 'HALF_DAY';
                    const isLeave = log.status === 'ON_LEAVE';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.check_in_time ? (
                            <span className="font-mono font-semibold text-emerald-800">
                              {log.check_in_time}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">--:--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.check_out_time ? (
                            <span className="font-mono font-semibold text-blue-800">
                              {log.check_out_time}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">--:--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.working_hours > 0 ? (
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {log.working_hours} hrs
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">0.0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {log.work_mode.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-[150px] truncate text-slate-600">
                          {log.location_or_cabin || user?.cabin_room || 'Academic Cabin'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isPresent && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded border border-emerald-300">
                              PRESENT
                            </span>
                          )}
                          {isOD && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold text-[10px] rounded border border-indigo-300">
                              ON DUTY (OD)
                            </span>
                          )}
                          {isHalf && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded border border-amber-300">
                              HALF DAY
                            </span>
                          )}
                          {isLeave && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 font-extrabold text-[10px] rounded border border-red-300">
                              ON LEAVE
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <div className="text-[11px] text-slate-700 truncate">
                            {log.work_summary || log.remarks || 'Standard daily lecture schedule.'}
                          </div>
                          {log.marked_by_admin && (
                            <span className="text-[9px] text-amber-700 font-semibold block">
                              • Verified / Regularized by Admin
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Leaves & OD */}
      {activeTab === 'LEAVES' && (
        <div className="space-y-6">
          {/* Leave Balances Grid */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-amber-200 rounded p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 uppercase">Casual Leave (CL)</span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                    Quota: 12
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-amber-800">
                    {summary.leave_balances?.casual?.remaining}
                  </span>
                  <span className="text-xs text-slate-500">Days Remaining</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-amber-600 h-1.5 rounded-full"
                    style={{
                      width: `${(summary.leave_balances?.casual?.remaining / 12) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Used: {summary.leave_balances?.casual?.used} / 12 days
                </div>
              </div>

              <div className="bg-white border-2 border-rose-200 rounded p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-900 uppercase">Medical / Sick Leave</span>
                  <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                    Quota: 10
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-rose-800">
                    {summary.leave_balances?.medical?.remaining}
                  </span>
                  <span className="text-xs text-slate-500">Days Remaining</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-rose-600 h-1.5 rounded-full"
                    style={{
                      width: `${(summary.leave_balances?.medical?.remaining / 10) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Used: {summary.leave_balances?.medical?.used} / 10 days
                </div>
              </div>

              <div className="bg-white border-2 border-indigo-200 rounded p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-900 uppercase">On-Duty (OD) / Deputation</span>
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">
                    Quota: 15
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-indigo-800">
                    {summary.leave_balances?.duty?.remaining}
                  </span>
                  <span className="text-xs text-slate-500">Days Remaining</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{
                      width: `${(summary.leave_balances?.duty?.remaining / 15) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Used: {summary.leave_balances?.duty?.used} / 15 days
                </div>
              </div>

              <div className="bg-white border-2 border-emerald-200 rounded p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase">Earned Leave (EL)</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    Quota: 15
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-emerald-800">
                    {summary.leave_balances?.earned?.remaining}
                  </span>
                  <span className="text-xs text-slate-500">Days Remaining</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full"
                    style={{
                      width: `${(summary.leave_balances?.earned?.remaining / 15) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Used: {summary.leave_balances?.earned?.used} / 15 days
                </div>
              </div>
            </div>
          )}

          {/* Leave Applications History */}
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="bg-[#121C33] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Submitted Leave & On-Duty Requisitions
                </h3>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="px-3 py-1 bg-[#C59B27] hover:bg-amber-400 text-slate-900 font-bold text-xs rounded transition flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Application</span>
              </button>
            </div>

            {leaves.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No leave applications submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3">Leave Type</th>
                      <th className="py-2.5 px-3">Date Range</th>
                      <th className="py-2.5 px-3">Days</th>
                      <th className="py-2.5 px-3">Reason / Justification</th>
                      <th className="py-2.5 px-3">Applied On</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Admin Review</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {l.leave_type.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                          {l.start_date} <span className="text-slate-400">to</span> {l.end_date}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {l.total_days} {l.total_days === 1 ? 'day' : 'days'}
                        </td>
                        <td className="py-2.5 px-3 max-w-[220px] truncate text-slate-600">
                          {l.reason}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-[10px] text-slate-500 font-mono">
                          {l.applied_at ? new Date(l.applied_at).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {l.status === 'APPROVED' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded border border-emerald-300">
                              APPROVED
                            </span>
                          )}
                          {l.status === 'PENDING' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded border border-amber-300">
                              PENDING DEAN REVIEW
                            </span>
                          )}
                          {l.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 font-extrabold text-[10px] rounded border border-red-300">
                              REJECTED
                            </span>
                          )}
                          {l.status === 'CANCELLED' && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-extrabold text-[10px] rounded border border-slate-300">
                              CANCELLED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 max-w-[180px] text-slate-600 text-[11px]">
                          {l.admin_remarks || (l.status === 'PENDING' ? 'Under Dean review' : 'No comments')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {l.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelLeave(l.id)}
                              className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-slate-300">
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Faculty Leave & On-Duty Application Form
                </h3>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-4 space-y-4">
              {leaveError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                  {leaveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Leave Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium"
                >
                  <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                  <option value="MEDICAL_LEAVE">Medical / Sick Leave (ML)</option>
                  <option value="DUTY_LEAVE_OD">On-Duty (OD) / Academic Tour / Conference</option>
                  <option value="EARNED_LEAVE">Earned Leave (EL)</option>
                  <option value="ACADEMIC_LEAVE">Academic / Research Deputation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason & Purpose of Leave / Deputation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Provide detailed justification (e.g. Attending IEEE conference as keynote speaker; doctor recommendation; urgent domestic requirement)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-[11px] text-amber-900">
                <strong>Protocol Notice:</strong> Approved leaves and OD deputations will automatically synchronize with the institutional attendance register.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-4 py-1.5 bg-[#1B2A4A] hover:bg-[#2D3F66] text-white text-xs font-bold rounded shadow transition disabled:opacity-50"
                >
                  {submittingLeave ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regularization Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-slate-300">
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Attendance Regularization Entry
                </h3>
              </div>
              <button
                onClick={() => setShowRegModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyRegularization} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={regInTime}
                    onChange={(e) => setRegInTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check-out Time</label>
                  <input
                    type="text"
                    value={regOutTime}
                    onChange={(e) => setRegOutTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={regStatus}
                  onChange={(e) => setRegStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="ON_DUTY">ON_DUTY</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Justification Reason</label>
                <textarea
                  rows={2}
                  value={regReason}
                  onChange={(e) => setRegReason(e.target.value)}
                  placeholder="e.g. Biometric terminal power reset, official student project review session outside cabin..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow transition disabled:opacity-50"
                >
                  {submittingReg ? 'Saving...' : 'Save Regularization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
