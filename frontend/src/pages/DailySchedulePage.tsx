import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ScheduleItem } from '../types';
import { api } from '../services/api';
import {
  Clock,
  Calendar,
  MapPin,
  BookOpen,
  ClipboardCheck,
  PlusCircle,
  Trash2,
  Users,
  CheckCircle2,
  CalendarDays,
  Sparkles
} from 'lucide-react';

interface Props {
  onNavigate: (tab: string, extra?: any) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const DailySchedulePage: React.FC<Props> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New slot form state
  const [formDay, setFormDay] = useState('Monday');
  const [formStart, setFormStart] = useState('09:00 AM');
  const [formEnd, setFormEnd] = useState('10:00 AM');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formVenue, setFormVenue] = useState('LH-204');
  const [formType, setFormType] = useState<'LECTURE' | 'LAB' | 'OFFICE_HOURS' | 'TUTORIAL'>('LECTURE');
  const [formBatch, setFormBatch] = useState('B.Tech CSE - 6A');
  const [submitting, setSubmitting] = useState(false);

  // Automatically detect current day on mount
  useEffect(() => {
    const todayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
    if (todayIndex >= 1 && todayIndex <= 5) {
      setSelectedDay(DAYS[todayIndex - 1]);
    }
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await api.getMySchedule(selectedDay);
      setScheduleItems(data);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [selectedDay]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName || !formVenue) {
      alert('Please complete all schedule details.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createScheduleItem({
        day_of_week: formDay,
        start_time: formStart,
        end_time: formEnd,
        course_code: formCode,
        subject_name: formName,
        venue: formVenue,
        session_type: formType,
        batch: formBatch,
      });
      setIsAddModalOpen(false);
      setFormCode('');
      setFormName('');
      loadSchedule();
    } catch (err: any) {
      alert(err.message || 'Failed to create schedule entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to remove this schedule slot?')) {
      try {
        await api.deleteScheduleItem(id);
        loadSchedule();
      } catch (err: any) {
        alert(err.message || 'Failed to delete schedule slot');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#C59B27]" />
              <h1 className="text-lg font-bold tracking-tight">
                {role === 'faculty' ? 'Faculty Daily Lecture & Cabin Schedule' : 'Academic Class Timetable & Schedule'}
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Weekly timetable, classroom venues, scheduled laboratory practicals, and student consultation sessions.
            </p>
          </div>

          {role === 'faculty' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-[#C59B27] hover:bg-[#D4A936] text-[#0E1726] font-bold text-xs rounded shadow flex items-center gap-1.5 transition border border-amber-400"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Lecture Slot</span>
            </button>
          )}
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center overflow-x-auto bg-slate-100 border-b border-slate-300 px-3 pt-2 gap-1.5">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 text-xs font-bold rounded-t transition border-t-2 ${
                  isSelected
                    ? 'bg-white text-[#1B2A4A] border-[#C59B27] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Timeline List */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
          <h3 className="text-xs font-bold uppercase tracking-wider">
            {selectedDay}'s Academic Sessions & Engagements
          </h3>
          <span className="text-[11px] text-amber-300 font-mono font-bold">
            {scheduleItems.length} Sessions Scheduled
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading daily schedule...</div>
        ) : scheduleItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <p>No lectures or sessions scheduled for {selectedDay}. Enjoy your academic preparation time!</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {scheduleItems.map((item, idx) => {
              const isLab = item.session_type === 'LAB';
              const isOffice = item.session_type === 'OFFICE_HOURS';

              return (
                <div
                  key={item.id || idx}
                  className={`p-4 rounded border transition hover:shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isLab
                      ? 'bg-purple-50/50 border-purple-200'
                      : isOffice
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Time Pillar */}
                    <div className="bg-[#1B2A4A] text-white rounded p-2 text-center min-w-[100px] shrink-0 border border-[#C59B27]">
                      <Clock className="w-4 h-4 text-[#C59B27] mx-auto mb-0.5" />
                      <div className="font-mono text-xs font-bold">{item.start_time}</div>
                      <div className="text-[10px] text-slate-300 font-mono">to {item.end_time}</div>
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 bg-[#6B1D2F] text-white rounded">
                          {item.course_code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isLab
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : isOffice
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}
                        >
                          {item.session_type}
                        </span>
                        {item.batch && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            {item.batch}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mt-1">{item.subject_name}</h4>

                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span>Venue: <strong>{item.venue}</strong></span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {role === 'faculty' && (
                      <>
                        <button
                          onClick={() => onNavigate('attendance', { courseCode: item.course_code })}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5"
                          title="Open Attendance Register for this class"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          <span>Take Attendance</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-700 rounded transition"
                          title="Remove Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {role === 'student' && (
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Scheduled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Lecture Slot Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-[#C59B27] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1B2A4A] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#C59B27]">
              <h3 className="font-bold text-sm">Add Lecture Slot to Faculty Timetable</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-300 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Session Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                  >
                    <option value="LECTURE">Lecture</option>
                    <option value="LAB">Lab Practical</option>
                    <option value="TUTORIAL">Tutorial</option>
                    <option value="OFFICE_HOURS">Office Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">End Time</label>
                  <input
                    type="text"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Course Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. CS501"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Advanced Operating Systems"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Venue / Room</label>
                  <input
                    type="text"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="LH-204"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Target Batch</label>
                  <input
                    type="text"
                    value={formBatch}
                    onChange={(e) => setFormBatch(e.target.value)}
                    placeholder="B.Tech CSE - 6A"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#6B1D2F] text-white font-bold rounded shadow hover:bg-[#4F1220] transition disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Save Schedule Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
