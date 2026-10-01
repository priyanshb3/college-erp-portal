import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CalendarEvent } from '../types';
import { api } from '../services/api';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Filter,
  Calendar as CalendarIcon,
  BookOpen,
  CalendarCheck2,
  AlertTriangle,
  Award,
  PlusCircle,
  X,
  FileCheck
} from 'lucide-react';

export const AcademicCalendarPage: React.FC<{ onNavigate?: (tab: string, extra?: any) => void }> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Add event modal for admin/faculty
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('INSTITUTIONAL');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventVenue, setNewEventVenue] = useState('Campus Wide');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getCalendarEvents(year, month, viewType);
      setEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [year, month, viewType]);

  const handlePrev = () => {
    if (viewType === 'MONTH') {
      setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
    } else if (viewType === 'WEEK') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewType === 'MONTH') {
      setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
    } else if (viewType === 'WEEK') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingEvent(true);
      await api.createCalendarEvent({
        title: newEventTitle,
        event_type: newEventType,
        start_date: newEventDate,
        end_date: newEventDate,
        venue: newEventVenue,
        description: newEventDesc,
      });
      setAddEventOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    } finally {
      setSavingEvent(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (selectedCategory === 'ALL') return true;
    return ev.category === selectedCategory;
  });

  // Month grid calculations
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
  // Adjust so Monday is 0
  const adjustedFirstDay = (firstDayIndex + 6) % 7;

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: adjustedFirstDay }, (_, i) => i);

  const getEventsForDay = (day: number) => {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter((ev) => ev.date === dayStr);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'sky':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'rose':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 rounded border border-amber-400/30 text-amber-300">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Unified Academic Calendar</h2>
              <p className="text-xs text-slate-300">
                Institutional timetable, appointments, assignment deadlines, and exam schedules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {role !== 'student' && (
              <button
                onClick={() => setAddEventOpen(true)}
                className="px-3.5 py-1.5 bg-[#C59B27] hover:bg-[#b0881f] text-slate-900 font-bold text-xs rounded shadow transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            )}

            <div className="flex items-center bg-[#121C33] rounded p-1 border border-slate-700">
              <button
                onClick={() => setViewType('MONTH')}
                className={`px-3 py-1 text-xs font-bold rounded transition ${
                  viewType === 'MONTH' ? 'bg-[#6B1D2F] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewType('WEEK')}
                className={`px-3 py-1 text-xs font-bold rounded transition ${
                  viewType === 'WEEK' ? 'bg-[#6B1D2F] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewType('DAY')}
                className={`px-3 py-1 text-xs font-bold rounded transition ${
                  viewType === 'DAY' ? 'bg-[#6B1D2F] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Controls & Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700 shadow-sm transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-slate-800 font-mono">
              {monthNames[month - 1]} {year}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700 shadow-sm transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700 shadow-sm"
            >
              Today
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'CLASS', label: 'Classes / Labs' },
              { id: 'APPOINTMENT', label: 'Consultations' },
              { id: 'DEADLINE', label: 'Deadlines' },
              { id: 'ASSESSMENT', label: 'Exams & Quizzes' },
              { id: 'INSTITUTIONAL', label: 'Institutional' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                  selectedCategory === cat.id
                    ? 'bg-[#1B2A4A] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      {viewType === 'MONTH' && (
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 bg-[#1B2A4A] text-white text-[11px] font-bold py-2.5 text-center uppercase tracking-wider font-mono">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200">
            {paddingArray.map((_, idx) => (
              <div key={`pad-${idx}`} className="bg-slate-50/60 min-h-[110px] p-1.5"></div>
            ))}

            {daysArray.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() + 1 === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[110px] p-1.5 flex flex-col justify-between transition hover:bg-amber-50/30 ${
                    isToday ? 'bg-amber-50/60' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-[#C59B27] text-slate-900 shadow' : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        {dayEvents.length} items
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[75px] scrollbar-thin">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold truncate cursor-pointer transition hover:opacity-90 ${getColorClasses(
                          ev.color
                        )}`}
                      >
                        <span className="font-mono text-[9px] mr-1">{ev.start_time}</span>
                        <span>{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        onClick={() => setSelectedEvent(dayEvents[3])}
                        className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer pl-1"
                      >
                        +{dayEvents.length - 3} more items...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK & DAY VIEWS (LIST FORMAT) */}
      {(viewType === 'WEEK' || viewType === 'DAY') && (
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden p-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1B2A4A]" />
            <span>Scheduled Academic Agenda ({filteredEvents.length} Events)</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No scheduled academic events found for this selection.
              </div>
            ) : (
              filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="py-3 px-3 hover:bg-slate-50 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`px-2 py-1 rounded text-center shrink-0 border ${getColorClasses(
                        ev.color
                      )}`}
                    >
                      <div className="font-mono font-bold text-xs">{ev.date.split('-')[2]}</div>
                      <div className="text-[9px] uppercase font-bold">{ev.category}</div>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{ev.title}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {ev.start_time} - {ev.end_time}
                        </span>
                        {ev.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-400" />
                            {ev.venue}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-[#1B2A4A] hover:underline">
                    View Details →
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1B2A4A] text-white p-4 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block font-mono">
                  {selectedEvent.category} • {selectedEvent.type}
                </span>
                <h3 className="font-bold text-sm leading-snug">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono font-bold text-slate-900">
                  Date: {selectedEvent.date}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono">
                  Timing: <strong>{selectedEvent.start_time}</strong> to <strong>{selectedEvent.end_time}</strong>
                </span>
              </div>

              {selectedEvent.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  <span>
                    Venue: <strong>{selectedEvent.venue}</strong>
                  </span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="block font-bold text-slate-500 text-[10px] uppercase mb-1">Description</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Action Buttons based on event type */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                {selectedEvent.category === 'CLASS' && role === 'faculty' && onNavigate && (
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      onNavigate('attendance');
                    }}
                    className="px-3.5 py-1.5 bg-[#1B2A4A] text-white font-bold rounded text-xs hover:bg-[#2A3E66]"
                  >
                    Open Attendance Register
                  </button>
                )}
                {selectedEvent.category === 'APPOINTMENT' && onNavigate && (
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      onNavigate('my-appointments');
                    }}
                    className="px-3.5 py-1.5 bg-emerald-700 text-white font-bold rounded text-xs hover:bg-emerald-800"
                  >
                    View Consultation Details
                  </button>
                )}
                {selectedEvent.category === 'DEADLINE' && onNavigate && (
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      onNavigate('submissions');
                    }}
                    className="px-3.5 py-1.5 bg-amber-600 text-white font-bold rounded text-xs hover:bg-amber-700"
                  >
                    View Assignment Module
                  </button>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CALENDAR EVENT MODAL (ADMIN / FACULTY) */}
      {addEventOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-md w-full overflow-hidden">
            <div className="bg-[#1B2A4A] text-white p-4 flex items-center justify-between border-b-2 border-[#C59B27]">
              <h3 className="font-bold text-sm">Add Academic Calendar Event</h3>
              <button onClick={() => setAddEventOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEvent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination or Faculty Colloquium"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Type</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                  >
                    <option value="INSTITUTIONAL">Institutional Event</option>
                    <option value="EXAM">Examination</option>
                    <option value="HOLIDAY">Academic Holiday</option>
                    <option value="SEMINAR">Seminar / Workshop</option>
                    <option value="MEETING">Faculty / Senate Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium or Senate Hall"
                  value={newEventVenue}
                  onChange={(e) => setNewEventVenue(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details, schedule, or attendee instructions..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddEventOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="px-4 py-1.5 bg-[#1B2A4A] text-white font-bold rounded hover:bg-[#2A3E66] transition disabled:opacity-50"
                >
                  {savingEvent ? 'Publishing...' : 'Add to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
