import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentAttendanceSummary } from '../types';
import { api } from '../services/api';
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  HelpCircle,
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const StudentAttendancePage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const data = await api.getStudentAttendanceSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load attendance summary:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading student attendance register...</div>;
  }

  if (!summary) {
    return <div className="p-8 text-center text-xs text-slate-500">No attendance data available.</div>;
  }

  const isEligible = summary.status_standing === 'ELIGIBLE' || summary.overall_percentage >= 75;
  const shortageSubjects = summary.subjects.filter((s) => s.shortage_warning);

  return (
    <div className="space-y-6">
      {/* Top Banner & 75% Standing Card */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#C59B27]" />
              <h1 className="text-lg font-bold tracking-tight">Student Attendance & Institutional 75% Compliance Tracker</h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Official University Academic Attendance Ledger for {user?.name} ({user?.identifier}) — Academic Session 2026-27.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-300">University Standing</div>
              <div
                className={`text-xs font-extrabold px-2.5 py-1 rounded mt-0.5 border ${
                  isEligible
                    ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500'
                    : 'bg-red-900/80 text-red-200 border-red-500 animate-pulse'
                }`}
              >
                {isEligible ? 'ELIGIBLE FOR END-SEM EXAMS' : 'DETENTION SHORTAGE RISK'}
              </div>
            </div>
          </div>
        </div>

        {/* Global Attendance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 border-t border-slate-200 divide-x divide-slate-200 text-xs">
          <div className="p-4 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Aggregate Attendance</div>
            <div
              className={`text-3xl font-extrabold mt-1 font-mono ${
                isEligible ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {summary.overall_percentage}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Mandatory Minimum: 75.0%</div>
          </div>

          <div className="p-4 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total Classes Conducted</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{summary.total_conducted}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across all enrolled subjects</div>
          </div>

          <div className="p-4 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Classes Attended</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{summary.total_attended}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Present / Excused sessions</div>
          </div>

          <div className="p-4 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Subjects with Shortage</div>
            <div
              className={`text-2xl font-bold mt-1 ${
                shortageSubjects.length > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {shortageSubjects.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {shortageSubjects.length > 0 ? 'Action required!' : 'All subjects compliant'}
            </div>
          </div>
        </div>

        {/* Shortage Alert Banner if any subject < 75% */}
        {shortageSubjects.length > 0 && (
          <div className="bg-red-50 border-t border-red-200 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900">
              <strong className="font-bold">Academic Regulation Warning:</strong> You have an attendance shortage in{' '}
              {shortageSubjects.map((s) => `${s.course_code} (${s.percentage}%)`).join(', ')}. As per university
              ordinances, students with less than 75% attendance are debarred from appearing in end-semester examinations.
              Review the margin calculator below to regularize your standing.
            </div>
          </div>
        )}
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#C59B27]" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Enrolled Course Attendance Ledger & Shortage Margin Calculator
            </h3>
          </div>
          <span className="text-[11px] text-amber-300 font-mono">
            {summary.subjects.length} Subjects
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Subject Code & Name</th>
                <th className="py-2.5 px-3">Faculty In-Charge</th>
                <th className="py-2.5 px-3 text-center">Conducted</th>
                <th className="py-2.5 px-3 text-center">Attended</th>
                <th className="py-2.5 px-3">Attendance Progress</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Eligibility Margin / Advice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {summary.subjects.map((sub) => {
                const subEligible = sub.percentage >= 75;
                // Safe miss formula if >= 75%: floor((attended - 0.75*held) / 0.75)
                const safeMiss = subEligible
                  ? Math.max(0, Math.floor((sub.attended - 0.75 * sub.total_held) / 0.75))
                  : 0;

                return (
                  <tr
                    key={sub.course_id}
                    className={`transition-colors ${
                      sub.shortage_warning ? 'bg-red-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="font-mono text-[#6B1D2F] font-bold">{sub.course_code}</span>
                        <span>•</span>
                        <span>{sub.course_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {sub.faculty_name}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {sub.total_held}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700">
                      {sub.attended}
                    </td>
                    <td className="py-3 px-3 min-w-[160px]">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                        <span className={subEligible ? 'text-emerald-800' : 'text-red-700'}>
                          {sub.percentage}%
                        </span>
                        <span className="text-slate-400 text-[10px]">Goal: 75%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            subEligible ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(100, sub.percentage)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {subEligible ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Safe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded border border-red-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Shortage
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs">
                      {sub.shortage_warning ? (
                        <div className="text-red-800 font-medium">
                          Must attend next <strong className="font-extrabold text-red-900 underline">{sub.margin_classes_needed} consecutive classes</strong> without absence to restore 75%.
                        </div>
                      ) : (
                        <div className="text-emerald-800 font-medium">
                          You can safely miss up to <strong className="font-extrabold text-emerald-900">{safeMiss} classes</strong> while maintaining &ge;75% standing.
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Session Logs */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C59B27]" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Recent Class Attendance Verification Log
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Last 10 marked lectures</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Subject / Course</th>
                <th className="py-2.5 px-3">Session Topic</th>
                <th className="py-2.5 px-3">Period / Slot</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {summary.recent_records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-800 font-bold">{rec.date}</td>
                  <td className="py-2 px-3 font-bold text-[#1B2A4A]">{rec.course?.code} - {rec.course?.name}</td>
                  <td className="py-2 px-3 text-slate-700">{rec.session_title}</td>
                  <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{rec.time_slot}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        rec.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : rec.status === 'LATE'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-500 italic">
                    {rec.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
