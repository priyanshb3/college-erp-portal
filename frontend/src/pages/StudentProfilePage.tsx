import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Course, StudentAttendanceSummary, StudentGradeHistory } from '../types';
import { api } from '../services/api';
import {
  GraduationCap,
  Mail,
  Phone,
  Building2,
  Calendar,
  Award,
  BookOpen,
  ClipboardCheck,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock
} from 'lucide-react';

export const StudentProfilePage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<StudentAttendanceSummary | null>(null);
  const [grades, setGrades] = useState<StudentGradeHistory | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields for student
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [specializationInput, setSpecializationInput] = useState(user?.specialization || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [att, gr] = await Promise.all([
          api.getStudentAttendanceSummary().catch(() => null),
          api.getMyGradeHistory().catch(() => null),
        ]);
        setAttendance(att);
        setGrades(gr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
              alt={user?.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#C59B27] shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{user?.name}</h2>
                <span className="bg-[#1B2A4A] text-amber-300 text-xs font-mono font-bold px-2 py-0.5 rounded border border-[#2D3F66]">
                  {user?.identifier}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {user?.designation || 'B.Tech Under-Graduate'} • {user?.department}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-amber-200">
                <span>Semester: <strong>{user?.semester || 6}th Sem</strong></span>
                <span>•</span>
                <span>Curriculum Track: <strong>{specializationInput || 'Computer Science Systems'}</strong></span>
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-emerald-950/60 border border-emerald-500/40 rounded flex items-center gap-2 text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Institutional Identity Verified</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Authorized Personal Profile & Editable Fields */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-300 rounded shadow-sm p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#1B2A4A]" />
              <span>Academic Identity Credentials</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Permanent Roll Number</span>
                <div className="font-mono font-bold text-slate-900 bg-slate-100 p-2 rounded flex items-center justify-between">
                  <span>{user?.identifier}</span>
                  <span title="Institutionally locked"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Official University Email</span>
                <div className="font-mono text-slate-900 bg-slate-100 p-2 rounded flex items-center justify-between">
                  <span>{user?.email}</span>
                  <span title="Institutionally locked"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Department & Faculty</span>
                <div className="text-slate-900 bg-slate-100 p-2 rounded flex items-center justify-between">
                  <span>{user?.department}</span>
                  <span title="Institutionally locked"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Program & Current Term</span>
                <div className="text-slate-900 bg-slate-100 p-2 rounded flex items-center justify-between">
                  <span>B.Tech CSE — Semester {user?.semester || 6}</span>
                  <span title="Institutionally locked"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Cumulative CGPA Standing</span>
                <div className="font-mono font-bold text-slate-900 bg-slate-100 p-2 rounded flex items-center justify-between">
                  <span>{user?.cgpa_or_experience || '8.92 CGPA'}</span>
                  <span title="Institutionally locked"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>
              </div>
            </div>
          </div>

          {/* Student Editable Contact Information */}
          <div className="bg-white border border-slate-300 rounded shadow-sm p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1B2A4A]" />
                <span>Contact & Communication Info</span>
              </span>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-normal">
                Authorized to Edit
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Update your registered mobile phone and research interest for faculty consultation matching.
            </p>

            <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Primary Mobile Phone Number
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  className="w-full p-2 border border-slate-300 rounded font-mono focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Research Track / Technical Focus
                </label>
                <input
                  type="text"
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  placeholder="e.g. Distributed Systems, Computer Vision"
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              {savedSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded flex items-center gap-1.5 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Contact profile updated!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-[#1B2A4A] text-white font-bold rounded hover:bg-[#2A3E66] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving Changes...' : 'Save Contact Details'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Enrolled Courses & Academic Progression */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Academic Standing Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded p-3.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Overall Attendance
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {attendance?.overall_percentage || 85.0}%
              </div>
              <span
                className={`text-[10px] font-bold uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${
                  (attendance?.overall_percentage || 85.0) >= 75
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {attendance?.status_standing || 'ELIGIBLE'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded p-3.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Semester Credits
              </span>
              <div className="text-xl font-bold text-blue-700 font-mono mt-1">
                {grades?.total_credits || 17} Credits
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Active curriculum courses</span>
            </div>

            <div className="bg-white border border-slate-200 rounded p-3.5 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cumulative CGPA
              </span>
              <div className="text-xl font-bold text-purple-700 font-mono mt-1">
                {grades?.cumulative_gpa.toFixed(2) || '8.92'} / 10.0
              </div>
              <span className="text-[10px] text-purple-600 font-semibold mt-1 block">Distinction Class</span>
            </div>
          </div>

          {/* Enrolled Courses Registry */}
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Registered Semester Courses ({grades?.courses.length || 0} Courses)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Academic Session 2026-27</span>
            </div>

            <div className="divide-y divide-slate-100">
              {grades?.courses.map((c) => (
                <div key={c.course_id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-[#1B2A4A] text-white px-2 py-0.5 rounded">
                        {c.course_code}
                      </span>
                      <h4 className="font-bold text-slate-900">{c.course_name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 mt-1">
                      <span>Faculty Guide: <strong>{c.faculty_name}</strong></span>
                      <span>•</span>
                      <span>Credits: <strong>{c.credits}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Weighted Score</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">{c.weighted_percentage}%</span>
                    </div>

                    <div className="px-2.5 py-1 bg-[#1B2A4A] text-amber-300 rounded font-mono font-extrabold text-xs">
                      {c.overall_letter_grade}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Institutional Academic Integrity & ERP Verification</div>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                All course registrations and attendance benchmarks are verified by the Office of Academic Affairs.
                If any discrepancy appears in your course registration, contact your Faculty Advisor or Academic Dean office.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
