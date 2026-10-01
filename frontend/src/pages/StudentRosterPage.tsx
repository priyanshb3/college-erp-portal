import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import {
  GraduationCap,
  Search,
  Building2,
  Mail,
  Award,
  BookOpen
} from 'lucide-react';

export const StudentRosterPage: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentList(selectedDept, searchQuery);
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedDept, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-[#C59B27]" />
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-tight">
                Student Enrollment & Academic Roster
              </h2>
              <p className="text-xs text-slate-300">
                Central ERP record of registered students, roll numbers, and departments
              </p>
            </div>
          </div>
          <div className="text-xs bg-black/30 border border-white/15 px-3 py-1.5 rounded text-amber-200 font-mono">
            {students.length} Students Enrolled
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, or email..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:outline-hidden font-semibold"
            >
              <option value="All Departments">All Departments</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading student roster...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No student records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Roll Number</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Academic Level</th>
                  <th className="py-2.5 px-3">CGPA Standing</th>
                  <th className="py-2.5 px-3">Specialization Track</th>
                  <th className="py-2.5 px-3 text-right">Webmail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#6B1D2F]">
                      {stu.identifier}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={stu.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={stu.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-300"
                        />
                        <span className="font-bold text-slate-900">{stu.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {stu.department}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {stu.designation || `Semester ${stu.semester || 6}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {stu.cgpa_or_experience}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {stu.specialization || 'General Engineering'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500">
                      {stu.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
