import React, { useState, useEffect } from 'react';
import { User, Slot } from '../types';
import { api } from '../services/api';
import { CalendarPlus, Clock, MapPin, AlertCircle, CheckCircle2, X, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedFaculty?: User | null;
}

export const BookAppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedFaculty,
}) => {
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>(
    preselectedFaculty ? preselectedFaculty.id : ''
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | ''>('');
  const [date, setDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // default tomorrow
  );
  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM - 10:30 AM');
  const [purposeCategory, setPurposeCategory] = useState<string>('Project Guidance');
  const [purposeDetails, setPurposeDetails] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('NORMAL');
  const [meetingMode, setMeetingMode] = useState<string>('CABIN');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      api.getFacultyList()
        .then((facs) => {
          setFacultyList(facs);
          if (preselectedFaculty) {
            setSelectedFacultyId(preselectedFaculty.id);
          } else if (facs.length > 0 && !selectedFacultyId) {
            setSelectedFacultyId(facs[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, preselectedFaculty]);

  // When selected faculty changes, load their slots
  useEffect(() => {
    if (selectedFacultyId) {
      api.getFacultySlots(Number(selectedFacultyId))
        .then((fetchedSlots) => {
          setSlots(fetchedSlots);
          if (fetchedSlots.length > 0) {
            setSelectedSlotId(fetchedSlots[0].id);
            setTimeSlot(`${fetchedSlots[0].start_time} - ${fetchedSlots[0].end_time}`);
          } else {
            setSelectedSlotId('');
          }
        })
        .catch(console.error);
    }
  }, [selectedFacultyId]);

  if (!isOpen) return null;

  const selectedFacultyObj = facultyList.find((f) => f.id === Number(selectedFacultyId));

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlotId(slot.id);
    setTimeSlot(`${slot.start_time} - ${slot.end_time}`);
    if (slot.venue.toLowerCase().includes('lab')) {
      setMeetingMode('LAB');
    } else if (slot.venue.toLowerCase().includes('meet') || slot.venue.toLowerCase().includes('online')) {
      setMeetingMode('ONLINE');
    } else {
      setMeetingMode('CABIN');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId) {
      setError('Please select a faculty member');
      return;
    }
    if (!purposeDetails.trim()) {
      setError('Please provide specific details about the purpose of the meeting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.bookAppointment({
        faculty_id: Number(selectedFacultyId),
        slot_id: selectedSlotId ? Number(selectedSlotId) : undefined,
        date,
        time_slot: timeSlot,
        purpose_category: purposeCategory,
        purpose_details: purposeDetails,
        urgency,
        meeting_mode: meetingMode,
      });

      setSuccessMsg('Appointment requisition registered successfully in the ERP system!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to submit appointment booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-[#1B2A4A] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-[#C59B27]" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                Requisition for Faculty Appointment Slot
              </h3>
              <p className="text-[10px] text-slate-300">
                Official College ERP Academic Booking Form
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Faculty Selector */}
          <div>
            <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              Select Faculty / Professor <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white"
              required
            >
              <option value="">-- Choose Faculty Member --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.identifier}) — {f.department} [{f.designation}]
                </option>
              ))}
            </select>
          </div>

          {/* Selected Faculty Profile Preview Card */}
          {selectedFacultyObj && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded flex items-center gap-3">
              <img
                src={selectedFacultyObj.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={selectedFacultyObj.name}
                className="w-11 h-11 rounded-full object-cover border border-slate-300 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {selectedFacultyObj.name}
                  </div>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded border border-blue-200">
                    {selectedFacultyObj.identifier}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 truncate">{selectedFacultyObj.designation}</div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" />
                    {selectedFacultyObj.cabin_room}
                  </span>
                  <span>•</span>
                  <span className="truncate text-slate-600">{selectedFacultyObj.specialization}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Available Office Hours / Slots */}
          <div>
            <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              Designated Office Hours / Predefined Slots
            </label>
            {slots.length === 0 ? (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[11px]">
                No predefined recurring slots configured by this faculty. You can specify a custom appointment date & time below.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {slots.map((s) => {
                  const isSelected = selectedSlotId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSlotSelect(s)}
                      className={`p-2.5 rounded border cursor-pointer transition flex items-start justify-between ${
                        isSelected
                          ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <Clock className={`w-3 h-3 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                          {s.day_of_week}: {s.start_time} - {s.end_time}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                          Venue: {s.venue}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold bg-[#C59B27] text-slate-900 px-1.5 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Date & Custom Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                Time Interval / Window <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="e.g. 10:00 AM - 10:30 AM"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white"
                required
              />
            </div>
          </div>

          {/* 4. Purpose Category & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                Purpose Category <span className="text-red-500">*</span>
              </label>
              <select
                value={purposeCategory}
                onChange={(e) => setPurposeCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white"
                required
              >
                <option value="Project Guidance">Capstone / Major Project Guidance</option>
                <option value="Doubt Clarification">Course Doubt / Assignment Clarification</option>
                <option value="Recommendation Letter">Letter of Recommendation (LoR)</option>
                <option value="Attendance / Leave">Attendance Compensation / Leave Sanction</option>
                <option value="Mentorship / Academic Counseling">Mentorship / Academic Counseling</option>
                <option value="Research Discussion">Research Paper / Lab Discussion</option>
                <option value="Other Academic Query">Other Academic / Administrative Query</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white font-medium"
              >
                <option value="NORMAL">Normal (Standard)</option>
                <option value="HIGH">High (Within 48 hrs)</option>
                <option value="URGENT">Urgent (Deadline/Exam)</option>
              </select>
            </div>
          </div>

          {/* 5. Meeting Mode */}
          <div>
            <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              Preferred Meeting Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="meetingMode"
                  value="CABIN"
                  checked={meetingMode === 'CABIN'}
                  onChange={() => setMeetingMode('CABIN')}
                  className="text-[#6B1D2F] focus:ring-[#6B1D2F]"
                />
                <span>In-Person Faculty Cabin</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="meetingMode"
                  value="ONLINE"
                  checked={meetingMode === 'ONLINE'}
                  onChange={() => setMeetingMode('ONLINE')}
                  className="text-[#6B1D2F] focus:ring-[#6B1D2F]"
                />
                <span>Virtual Video Meet</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="meetingMode"
                  value="LAB"
                  checked={meetingMode === 'LAB'}
                  onChange={() => setMeetingMode('LAB')}
                  className="text-[#6B1D2F] focus:ring-[#6B1D2F]"
                />
                <span>Department Lab / Workshop</span>
              </label>
            </div>
          </div>

          {/* 6. Purpose Detailed Description */}
          <div>
            <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              Detailed Agenda / Reason for Meeting <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={purposeDetails}
              onChange={(e) => setPurposeDetails(e.target.value)}
              placeholder="Please provide specific context, question numbers, project milestone, or background documents you plan to discuss..."
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white"
              required
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#6B1D2F] hover:bg-[#4F1220] rounded shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>{loading ? 'Submitting to ERP...' : 'Submit Booking Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
