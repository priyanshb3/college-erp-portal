import React, { useState, useEffect } from 'react';
import { User, Slot } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookAppointmentModal } from '../components/BookAppointmentModal';
import {
  Users,
  Search,
  Filter,
  MapPin,
  Mail,
  Phone,
  Clock,
  CalendarPlus,
  Building2,
  GraduationCap,
  Award
} from 'lucide-react';

export const FacultyDirectoryPage: React.FC = () => {
  const { role } = useAuth();
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingFaculty, setBookingFaculty] = useState<User | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const facs = await api.getFacultyList(selectedDept, searchQuery);
      setFacultyList(facs);

      // Unique departments
      const allDepts = Array.from(new Set(facs.map((f) => f.department)));
      setDepartments(allDepts);
    } catch (err) {
      console.error('Failed to load faculty directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, [selectedDept, searchQuery]);

  const handleBookClick = (faculty: User) => {
    setBookingFaculty(faculty);
    setIsBookModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Directory Header Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#C59B27]" />
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-tight">
                Academic Faculty & Department Cabin Directory
              </h2>
              <p className="text-xs text-slate-300">
                Official Directory of Professors, HODs, Cabin Locations & Office Hours
              </p>
            </div>
          </div>

          <div className="text-xs bg-black/30 border border-white/15 px-3 py-1.5 rounded text-amber-200 font-mono">
            {facultyList.length} Faculty Members Listed
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-7 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by name, specialization, or cabin number..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-5 relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:outline-hidden"
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

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading faculty directory...</div>
      ) : facultyList.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border rounded">
          No faculty members found matching your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyList.map((fac) => (
            <div
              key={fac.id}
              className="bg-white border border-slate-300 rounded-lg shadow-2xs hover:shadow-md hover:border-[#1B2A4A] transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Header card */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={fac.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
                    alt={fac.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{fac.name}</h3>
                    </div>
                    <span className="inline-block text-[10px] font-mono bg-blue-50 text-blue-900 px-1.5 py-0.2 rounded border border-blue-200 mt-0.5">
                      {fac.identifier}
                    </span>
                    <div className="text-xs font-medium text-slate-700 mt-1 truncate">{fac.designation}</div>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span className="truncate">{fac.department}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="font-medium truncate">{fac.cabin_room}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{fac.email}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[11px] text-slate-700 mt-2">
                    <strong className="text-slate-900">Research & Specialization:</strong>
                    <div className="truncate text-slate-600 mt-0.5">{fac.specialization}</div>
                  </div>
                </div>
              </div>

              {/* Card Footer with Book Slot Button */}
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[10px] text-slate-500">
                  {fac.cgpa_or_experience}
                </div>

                {role === 'student' && (
                  <button
                    onClick={() => handleBookClick(fac)}
                    className="px-3 py-1.5 bg-[#6B1D2F] hover:bg-[#4F1220] text-white text-xs font-bold rounded shadow-xs transition flex items-center gap-1"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>Book Appointment</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={loadFaculty}
        preselectedFaculty={bookingFaculty}
      />
    </div>
  );
};
