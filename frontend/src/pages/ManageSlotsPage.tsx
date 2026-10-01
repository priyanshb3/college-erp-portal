import React, { useState, useEffect } from 'react';
import { Slot } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  ShieldCheck
} from 'lucide-react';

export const ManageSlotsPage: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:30 AM');
  const [venue, setVenue] = useState(user?.cabin_room || 'Academic Block-A, Cabin 304');
  const [maxStudents, setMaxStudents] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadSlots = async () => {
    try {
      setLoading(true);
      const mySlots = await api.getMySlots();
      setSlots(mySlots);
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.createSlot({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        venue,
        max_students: Number(maxStudents),
      });

      setSuccessMsg('Office hour availability slot published to student portal!');
      loadSlots();
    } catch (err: any) {
      setError(err.message || 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (confirm('Are you sure you want to remove this office hours slot?')) {
      try {
        await api.deleteSlot(id);
        loadSlots();
      } catch (err: any) {
        alert(err.message || 'Failed to remove slot');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#C59B27]" />
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-tight">
                Faculty Office Hours & Weekly Slot Configuration
              </h2>
              <p className="text-xs text-slate-300">
                Define recurring consultation windows for student academic advising and project reviews
              </p>
            </div>
          </div>

          <div className="text-xs bg-black/30 border border-white/15 px-3 py-1.5 rounded text-amber-200 font-mono">
            {slots.length} Active Slots Configured
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Create Slot Form */}
        <div className="lg:col-span-5 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#6B1D2F] text-white px-4 py-2.5 flex items-center gap-2 border-b-2 border-[#C59B27]">
            <PlusCircle className="w-4 h-4 text-[#C59B27]" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Add Weekly Availability Window
            </h3>
          </div>

          <form onSubmit={handleCreateSlot} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 uppercase text-[11px] mb-1">
                Day of Week <span className="text-red-500">*</span>
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white"
                required
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 uppercase text-[11px] mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase text-[11px] mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="e.g. 11:30 AM"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase text-[11px] mb-1">
                Venue / Room / Virtual Link <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Cabin 304, Academic Block-A or Google Meet"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase text-[11px] mb-1">
                Maximum Student Capacity per Slot
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#6B1D2F] hover:bg-[#4F1220] text-white font-bold text-xs uppercase tracking-wider rounded shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4 text-[#C59B27]" />
              <span>{submitting ? 'Publishing...' : 'Publish Office Hour Slot'}</span>
            </button>
          </form>
        </div>

        {/* Right 7 Cols: Existing Slots Table */}
        <div className="lg:col-span-7 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#1B2A4A] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Current Configured Weekly Office Hours
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading configured slots...</div>
          ) : slots.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No office hours currently configured. Use the form on the left to add consultation slots.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Day of Week</th>
                    <th className="py-2.5 px-3">Time Window</th>
                    <th className="py-2.5 px-3">Designated Venue</th>
                    <th className="py-2.5 px-3">Max Cap</th>
                    <th className="py-2.5 px-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {slots.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {s.day_of_week}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {s.start_time} - {s.end_time}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {s.venue}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {s.max_students} students
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteSlot(s.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete Slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
