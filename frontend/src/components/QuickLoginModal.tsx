import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserCheck, GraduationCap, ShieldAlert, BookOpen, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickLoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { quickSwitch } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getDemoUsers()
        .then(setDemoUsers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (user: User) => {
    await quickSwitch(user);
    onClose();
  };

  const students = demoUsers.filter((u) => u.role === 'student');
  const faculties = demoUsers.filter((u) => u.role === 'faculty');
  const admins = demoUsers.filter((u) => u.role === 'admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-[#1B2A4A] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#C59B27]" />
            <h3 className="text-base font-semibold tracking-wide">
              Switch ERP Persona / Quick Test Login
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          <p className="text-xs text-slate-600">
            Select any college persona below to immediately log in without typing passwords. All test passwords default to <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono border">password123</code>.
          </p>

          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm">Loading college directory personas...</div>
          ) : (
            <div className="space-y-6">
              {/* Students Section */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B1D2F] border-b border-slate-200 pb-1.5 mb-3">
                  <GraduationCap className="w-4 h-4" />
                  Student Personas (Book & Track Appointments)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {students.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      className="group border border-slate-200 hover:border-[#6B1D2F] hover:bg-red-50/40 p-3 rounded cursor-pointer transition-all flex items-start gap-3 bg-white shadow-2xs"
                    >
                      <img
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={u.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-300 group-hover:ring-2 group-hover:ring-[#6B1D2F]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#6B1D2F]">
                            {u.name}
                          </h4>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border">
                            {u.identifier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{u.designation}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">
                          <span className="font-semibold text-emerald-700">{u.cgpa_or_experience}</span>
                          <span>•</span>
                          <span className="truncate">{u.department}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty Section */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2A4A] border-b border-slate-200 pb-1.5 mb-3">
                  <BookOpen className="w-4 h-4" />
                  Faculty & Professors (Manage Slots & Approve Requests)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {faculties.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      className="group border border-slate-200 hover:border-[#1B2A4A] hover:bg-blue-50/40 p-3 rounded cursor-pointer transition-all flex items-start gap-3 bg-white shadow-2xs"
                    >
                      <img
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                        alt={u.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-300 group-hover:ring-2 group-hover:ring-[#1B2A4A]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#1B2A4A]">
                            {u.name}
                          </h4>
                          <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                            {u.identifier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium truncate">{u.designation}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{u.cabin_room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Section */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 border-b border-slate-200 pb-1.5 mb-3">
                  <ShieldAlert className="w-4 h-4" />
                  Dean / ERP Administrator (Campus-Wide Control)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {admins.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      className="group border border-slate-200 hover:border-amber-600 hover:bg-amber-50/40 p-3 rounded cursor-pointer transition-all flex items-start gap-3 bg-white shadow-2xs"
                    >
                      <img
                        src={u.avatar_url}
                        alt={u.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-300 group-hover:ring-2 group-hover:ring-amber-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-amber-900">
                            {u.name}
                          </h4>
                          <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 font-bold">
                            {u.identifier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium truncate">{u.designation}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{u.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
