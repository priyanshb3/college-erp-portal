import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FacultyAttendanceRecord, FacultyHRSummary } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building,
  Laptop,
  Briefcase,
  ChevronRight,
  Sparkles,
  Calendar,
  ShieldCheck,
  Coffee,
  Check,
  Award
} from 'lucide-react';

interface Props {
  onNavigateToHR?: () => void;
  onAttendanceUpdated?: (record: FacultyAttendanceRecord) => void;
}

export const FacultyAttendanceMarkerWidget: React.FC<Props> = ({
  onNavigateToHR,
  onAttendanceUpdated,
}) => {
  const [summary, setSummary] = useState<FacultyHRSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [workMode, setWorkMode] = useState<string>('IN_CAMPUS');
  const [dutyNotes, setDutyNotes] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showNotesInput, setShowNotesInput] = useState(false);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadHRSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getFacultyHRSummary();
      setSummary(data);
      if (data.today_record?.work_mode) {
        setWorkMode(data.today_record.work_mode);
      }
      if (data.today_record?.work_summary) {
        setDutyNotes(data.today_record.work_summary);
      }
    } catch (err) {
      console.error('Failed to load faculty HR summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHRSummary();
  }, []);

  const handlePunch = async (action: 'CHECK_IN' | 'CHECK_OUT' | 'MARK_TODAY', status: string = 'PRESENT') => {
    try {
      setPunching(true);
      const res = await api.punchFacultyAttendance({
        action,
        status,
        work_mode: workMode,
        work_summary: dutyNotes.trim() || undefined,
      });

      setSuccessToast(
        action === 'CHECK_IN'
          ? `Check-in recorded at ${res.check_in_time}!`
          : action === 'CHECK_OUT'
          ? `Check-out recorded at ${res.check_out_time}! (${res.working_hours} hrs logged)`
          : `Attendance status marked as ${status}!`
      );

      setTimeout(() => setSuccessToast(null), 4000);
      await loadHRSummary();
      if (onAttendanceUpdated) {
        onAttendanceUpdated(res);
      }
    } catch (err: any) {
      alert(`Attendance Punch Error: ${err.message || 'Unknown error'}`);
    } finally {
      setPunching(false);
    }
  };

  const todayRecord = summary?.today_record;
  const isCheckedIn = !!todayRecord?.check_in_time;
  const isCheckedOut = !!todayRecord?.check_out_time;

  return (
    <div className="bg-white border-2 border-slate-300 rounded shadow-md overflow-hidden transition-all">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-[#1B2A4A] via-[#24375F] to-[#1B2A4A] text-white px-4 py-3 border-b-2 border-[#C59B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#C59B27]/20 border border-[#C59B27]/50 rounded text-amber-300">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                Faculty Biometric & Attendance Terminal
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.2 rounded border border-emerald-500/40">
                Live Gateway
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono flex items-center gap-2 mt-0.5">
              <span>{currentDateStr}</span>
              <span>•</span>
              <span className="text-amber-200 font-bold">{currentTime}</span>
            </div>
          </div>
        </div>

        {onNavigateToHR && (
          <button
            onClick={onNavigateToHR}
            className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-semibold hover:underline self-start sm:self-auto"
          >
            <span>Full Attendance & Leave Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-4 py-2 flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Terminal Body */}
      <div className="p-4 bg-slate-50/70">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Status Column */}
          <div className="lg:col-span-5 bg-white p-3.5 rounded border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Today's Punch Status
            </div>

            {!todayRecord ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
                <div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="text-amber-600 font-extrabold">Not Marked Yet</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Please mark your duty attendance or clock-in for the day.
                  </p>
                </div>
              </div>
            ) : isCheckedIn && !isCheckedOut ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                      Active on Duty
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    Checked In: {todayRecord.check_in_time}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Mode:</span>
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono text-[10px]">
                    {todayRecord.work_mode.replace(/_/g, ' ')}
                  </span>
                  <span>•</span>
                  <span className="truncate text-slate-500 font-mono text-[10px]">
                    {todayRecord.location_or_cabin || 'Academic Cabin'}
                  </span>
                </div>
              </div>
            ) : isCheckedOut ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">
                      Shift Completed
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {todayRecord.working_hours} Hours Logged
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>In: <strong>{todayRecord.check_in_time}</strong></span>
                  <span>Out: <strong>{todayRecord.check_out_time}</strong></span>
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                    PRESENT
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-violet-100 text-violet-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-violet-900">{todayRecord.status}</div>
                  <div className="text-[11px] text-slate-500">{todayRecord.remarks || 'Special duty / leave status'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Marker Controls */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            {/* Mode selection dropdown */}
            <div className="flex flex-col gap-1 min-w-[150px]">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Working Location</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                disabled={punching}
                className="bg-white border border-slate-300 text-slate-800 text-xs py-1.5 px-2 rounded focus:ring-1 focus:ring-[#1B2A4A] focus:outline-hidden font-medium"
              >
                <option value="IN_CAMPUS">🏫 In-Campus / Office</option>
                <option value="WORK_FROM_HOME">💻 Work From Home</option>
                <option value="FIELD_DUTY">🚗 Field / Exam Duty</option>
                <option value="CONFERENCE">🎓 Conference / Deputation</option>
              </select>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-end gap-2 flex-wrap">
              {!isCheckedIn ? (
                <button
                  onClick={() => handlePunch('CHECK_IN', 'PRESENT')}
                  disabled={punching}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow transition flex items-center gap-2 border border-emerald-600 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{punching ? 'Marking...' : 'Punch In / Check In'}</span>
                </button>
              ) : !isCheckedOut ? (
                <button
                  onClick={() => handlePunch('CHECK_OUT', 'PRESENT')}
                  disabled={punching}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded shadow transition flex items-center gap-2 border border-blue-600 disabled:opacity-50"
                >
                  <Clock className="w-4 h-4" />
                  <span>{punching ? 'Recording...' : 'Punch Out / Check Out'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handlePunch('CHECK_OUT', 'PRESENT')}
                  disabled={punching}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded shadow transition flex items-center gap-1.5 border border-slate-600 disabled:opacity-50"
                  title="Update your checkout timestamp"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Update Punch Out</span>
                </button>
              )}

              {/* Quick duty / OD marker button */}
              <button
                onClick={() => handlePunch('MARK_TODAY', 'ON_DUTY')}
                disabled={punching}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded border border-indigo-200 transition flex items-center gap-1.5"
                title="Mark full day as On-Duty (OD)"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Mark OD</span>
              </button>

              <button
                onClick={() => setShowNotesInput(!showNotesInput)}
                className={`px-2.5 py-2 text-xs rounded border font-medium transition ${
                  showNotesInput
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
                title="Add duty log summary"
              >
                Duty Note {dutyNotes ? '✓' : ''}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Duty Notes */}
        {showNotesInput && (
          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input
              type="text"
              value={dutyNotes}
              onChange={(e) => setDutyNotes(e.target.value)}
              placeholder="e.g. Conducted CS501 Operating Systems lecture, reviewed 12 lab submissions in Cabin 304..."
              className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#1B2A4A]"
            />
            <button
              onClick={() => handlePunch('MARK_TODAY', todayRecord?.status || 'PRESENT')}
              disabled={punching}
              className="px-3 py-1.5 bg-[#1B2A4A] hover:bg-[#2D3F66] text-white text-xs font-semibold rounded shrink-0"
            >
              Save Note
            </button>
          </div>
        )}

        {/* Mini HR Metrics Footer */}
        {summary && (
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">This Month's Attendance</span>
              <span className="font-extrabold text-[#1B2A4A] text-sm">
                {summary.attendance_percentage}%
              </span>
              <span className="text-[10px] text-slate-400 block">
                {summary.present_days} / {summary.total_working_days} Days
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Avg Working Hours</span>
              <span className="font-extrabold text-[#6B1D2F] text-sm">
                {summary.avg_daily_hours} hrs/day
              </span>
              <span className="text-[10px] text-slate-400 block">
                Total: {summary.total_hours_worked} hrs
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Casual Leave (CL)</span>
              <span className="font-extrabold text-amber-700 text-sm">
                {summary.leave_balances?.casual?.remaining || 0} Days Left
              </span>
              <span className="text-[10px] text-slate-400 block">
                Used: {summary.leave_balances?.casual?.used || 0} / 12
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Duty Leave (OD)</span>
              <span className="font-extrabold text-indigo-700 text-sm">
                {summary.leave_balances?.duty?.remaining || 0} Days Left
              </span>
              <span className="text-[10px] text-slate-400 block">
                Used: {summary.leave_balances?.duty?.used || 0} / 15
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
