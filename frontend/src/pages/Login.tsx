import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  ShieldAlert, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'faculty' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('22CS104');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: 'student' | 'faculty' | 'admin') => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'student') {
      setIdentifier('22CS104');
    } else if (tab === 'faculty') {
      setIdentifier('FAC-CS-042');
    } else if (tab === 'admin') {
      setIdentifier('ADMIN-01');
    }
    setPassword('password123');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    }
  };

  const handleQuickSelect = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    login(id, pass).catch((err) => setError(err.message));
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col justify-between">
      {/* Top University Branding Header */}
      <div className="bg-[#121C33] text-white border-b-4 border-[#C59B27] py-3 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#C59B27] flex items-center justify-center text-[#1B2A4A] font-serif font-black text-xl border border-amber-200 shadow">
              GIT
            </div>
            <div>
              <div className="text-[10px] tracking-widest uppercase font-semibold text-amber-300 font-serif-erp">
                GOVERNMENT INSTITUTE OF TECHNOLOGY & SCIENCE
              </div>
              <div className="text-sm md:text-base font-bold text-white tracking-tight">
                Enterprise Resource Planning (ERP) & Faculty Appointment Gateway
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs bg-black/40 px-3 py-1.5 rounded border border-white/10 text-amber-200">
            <Building2 className="w-4 h-4 text-[#C59B27]" />
            <span>Academic Session: <strong>2026-27 (Odd Semester)</strong></span>
          </div>
        </div>
      </div>

      {/* Main Login Area */}
      <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          
          {/* Left Column: ERP Portal Instructions & Notice Board */}
          <div className="lg:col-span-5 space-y-5 hidden lg:block">
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
              <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Info className="w-4 h-4 text-[#C59B27]" />
                  <span>CAMPUS APPOINTMENT PROTOCOLS</span>
                </div>
                <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">CIRCULAR 2026/A-12</span>
              </div>
              <div className="p-4 text-xs text-slate-700 space-y-3 leading-relaxed">
                <p>
                  Welcome to the official <strong>Faculty-Student Appointment Scheduling Portal</strong>. This module is linked with the Central ERP database.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-2.5 rounded text-[11px] text-amber-900">
                  <strong>Important Guideline:</strong> Students must submit meeting requisitions at least 24 hours prior to faculty office hours.
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li><strong>Students:</strong> Log in with Roll Number (e.g. <code>22CS104</code>)</li>
                  <li><strong>Faculty:</strong> Log in with Faculty ID (e.g. <code>FAC-CS-042</code>)</li>
                  <li><strong>Admins / Deans:</strong> Access campus-wide analytics with Admin ID</li>
                </ul>
              </div>
            </div>

              {/* Quick 1-Click Demo Login Panel */}
            <div className="bg-white border border-slate-300 rounded p-4 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6B1D2F] border-b pb-2 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <span>Instant 1-Click Evaluation Personas</span>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  data-testid="quick-login-student"
                  aria-label="Quick login as student Priyansh Bansal"
                  onClick={() => handleQuickSelect('22CS104', 'password123')}
                  className="w-full text-left p-2 rounded border border-slate-200 hover:border-[#6B1D2F] hover:bg-red-50/30 transition flex items-center justify-between text-xs group"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-[#6B1D2F]">Priyansh Bansal (Student)</div>
                    <div className="text-[10px] text-slate-500 font-mono">Roll: 22CS104 • CSE 6th Sem</div>
                  </div>
                  <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded">Log in &rarr;</span>
                </button>

                <button
                  type="button"
                  data-testid="quick-login-faculty"
                  aria-label="Quick login as faculty Dr. Rajesh Sharma"
                  onClick={() => handleQuickSelect('FAC-CS-042', 'password123')}
                  className="w-full text-left p-2 rounded border border-slate-200 hover:border-[#1B2A4A] hover:bg-blue-50/30 transition flex items-center justify-between text-xs group"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-[#1B2A4A]">Dr. Rajesh Sharma (Faculty HOD)</div>
                    <div className="text-[10px] text-slate-500 font-mono">ID: FAC-CS-042 • CSE Dept</div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">Log in &rarr;</span>
                </button>

                <button
                  type="button"
                  data-testid="quick-login-admin"
                  aria-label="Quick login as administrator Dr. Suresh Venkat"
                  onClick={() => handleQuickSelect('ADMIN-01', 'password123')}
                  className="w-full text-left p-2 rounded border border-slate-200 hover:border-amber-600 hover:bg-amber-50/30 transition flex items-center justify-between text-xs group"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-amber-800">Dr. Suresh Venkat (Dean / Admin)</div>
                    <div className="text-[10px] text-slate-500 font-mono">ID: ADMIN-01 • Academic Affairs</div>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded">Log in &rarr;</span>
                </button>
              </div>

              {/* AI Agent Machine-Readable Notice */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  🤖 AI Agent Ready
                </span>
                <div className="space-x-2">
                  <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-mono text-[10px]">
                    /llms.txt
                  </a>
                  <span>•</span>
                  <a href="/docs" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-mono text-[10px]">
                    /docs
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Institutional Login Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow-lg border border-slate-300 overflow-hidden">
              
              {/* Card Banner */}
              <div className="bg-[#1B2A4A] text-white px-6 py-4 border-b-4 border-[#C59B27]">
                <h2 className="text-base font-bold tracking-wide">
                  SECURE INSTITUTIONAL ERP LOGIN
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Single Sign-On (SSO) for Students, Faculty Members & Academic Staff
                </p>
              </div>

              {/* Persona Tabs */}
              <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-300 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  data-testid="persona-tab-student"
                  aria-label="Switch to Student Persona"
                  onClick={() => handleTabChange('student')}
                  className={`py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                    activeTab === 'student'
                      ? 'bg-white text-[#6B1D2F] border-[#6B1D2F] font-bold shadow-2xs'
                      : 'border-transparent hover:bg-slate-200/60'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Portal</span>
                </button>
                <button
                  type="button"
                  data-testid="persona-tab-faculty"
                  aria-label="Switch to Faculty Persona"
                  onClick={() => handleTabChange('faculty')}
                  className={`py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                    activeTab === 'faculty'
                      ? 'bg-white text-[#1B2A4A] border-[#1B2A4A] font-bold shadow-2xs'
                      : 'border-transparent hover:bg-slate-200/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Faculty Portal</span>
                </button>
                <button
                  type="button"
                  data-testid="persona-tab-admin"
                  aria-label="Switch to Administrator Persona"
                  onClick={() => handleTabChange('admin')}
                  className={`py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                    activeTab === 'admin'
                      ? 'bg-white text-amber-800 border-amber-700 font-bold shadow-2xs'
                      : 'border-transparent hover:bg-slate-200/60'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Dean / Admin</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="p-6 md:p-8 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    {activeTab === 'student'
                      ? 'Student University Roll Number'
                      : activeTab === 'faculty'
                      ? 'Faculty Employee ID / Webmail'
                      : 'Administrator System ID'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      data-testid="login-identifier-input"
                      aria-label="Login Identifier or Email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        activeTab === 'student'
                          ? 'e.g. 22CS104'
                          : activeTab === 'faculty'
                          ? 'e.g. FAC-CS-042'
                          : 'e.g. ADMIN-01'
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-[#1B2A4A] focus:bg-white focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      ERP Account Password
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">Default: password123</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      data-testid="login-password-input"
                      aria-label="Account Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your secret password"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-[#1B2A4A] focus:bg-white focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#6B1D2F] focus:ring-[#6B1D2F]" />
                    <span>Remember ERP session</span>
                  </label>
                  <a href="#reset" onClick={(e) => { e.preventDefault(); alert("For demo purposes, all users have password: password123"); }} className="text-[#6B1D2F] hover:underline">
                    Forgot Password?
                  </a>
                </div>

                <button
                  type="submit"
                  data-testid="login-submit-button"
                  aria-label="Sign In to ERP Portal"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#6B1D2F] hover:bg-[#4F1220] text-white font-bold text-xs uppercase tracking-wider rounded shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Authenticating with ERP...' : 'Sign In to ERP Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick Switch Pills on Mobile / Small screens */}
                <div className="lg:hidden pt-4 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-600 mb-2">Quick 1-Click Demo Login:</div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('22CS104', 'password123')}
                      className="p-1.5 bg-red-50 text-red-900 border border-red-200 rounded font-semibold"
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('FAC-CS-042', 'password123')}
                      className="p-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded font-semibold"
                    >
                      Faculty
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('ADMIN-01', 'password123')}
                      className="p-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-semibold"
                    >
                      Dean/Admin
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#121C33] text-slate-400 text-[11px] py-3 px-6 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 Government Institute of Technology & Science • Computer Centre & ERP Cell
          </div>
          <div className="font-mono text-slate-500 text-[10px]">
            Server: NODE-ACAD-01 • Uptime: 99.98% • Secure 256-bit Encryption
          </div>
        </div>
      </footer>
    </div>
  );
};
