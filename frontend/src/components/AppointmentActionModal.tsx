import React, { useState } from 'react';
import { Appointment } from '../types';
import { api } from '../services/api';
import { CheckCircle2, XCircle, Clock, ShieldCheck, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment | null;
  initialAction?: 'APPROVE' | 'REJECT' | 'COMPLETE';
}

export const AppointmentActionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  initialAction = 'APPROVE',
}) => {
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | 'COMPLETE'>(initialAction);
  const [remarks, setRemarks] = useState<string>('');
  const [cabinOrLink, setCabinOrLink] = useState<string>(
    appointment?.cabin_or_link || 'Academic Block-A, Cabin 304'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let newStatus = 'APPROVED';
    if (action === 'REJECT') newStatus = 'REJECTED';
    if (action === 'COMPLETE') newStatus = 'COMPLETED';

    try {
      await api.updateAppointmentStatus(appointment.id, {
        status: newStatus,
        faculty_remarks: remarks || (action === 'APPROVE' ? 'Slot confirmed by faculty.' : 'Slot declined due to prior academic commitment.'),
        cabin_or_link: cabinOrLink,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update appointment status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="bg-[#1B2A4A] text-white px-5 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C59B27]" />
            <h3 className="text-sm font-bold tracking-wide">
              Faculty Appointment Action — {appointment.appointment_code}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 rounded">
              {error}
            </div>
          )}

          {/* Student Request Info Summary */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">REQUISITION CODE: {appointment.appointment_code}</span>
              <span className="font-bold text-slate-900">{appointment.date} ({appointment.time_slot})</span>
            </div>
            <div className="font-bold text-slate-800 text-xs">
              Student: {appointment.student?.name} ({appointment.student?.identifier})
            </div>
            <div className="text-slate-600">
              <strong>Purpose:</strong> {appointment.purpose_category}
            </div>
            <div className="text-slate-500 italic bg-white p-2 rounded border border-slate-100 mt-1">
              "{appointment.purpose_details}"
            </div>
          </div>

          {/* Action Switcher Tabs */}
          <div>
            <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-1.5">
              Select Decision / Status Update
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction('APPROVE')}
                className={`py-2 px-2 text-center rounded border flex items-center justify-center gap-1.5 font-bold transition ${
                  action === 'APPROVE'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Slot
              </button>
              <button
                type="button"
                onClick={() => setAction('REJECT')}
                className={`py-2 px-2 text-center rounded border flex items-center justify-center gap-1.5 font-bold transition ${
                  action === 'REJECT'
                    ? 'bg-rose-700 text-white border-rose-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Decline / Reject
              </button>
              <button
                type="button"
                onClick={() => setAction('COMPLETE')}
                className={`py-2 px-2 text-center rounded border flex items-center justify-center gap-1.5 font-bold transition ${
                  action === 'COMPLETE'
                    ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Mark Attended
              </button>
            </div>
          </div>

          {/* Venue / Link Input (if approving) */}
          {action === 'APPROVE' && (
            <div>
              <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                Venue / Cabin Room / Meeting Link
              </label>
              <input
                type="text"
                value={cabinOrLink}
                onChange={(e) => setCabinOrLink(e.target.value)}
                placeholder="e.g. Block-A Cabin 304 or https://meet.google.com/xyz"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white"
                required
              />
            </div>
          )}

          {/* Faculty Remarks */}
          <div>
            <label className="block font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
              Faculty Remarks / Instructions for Student
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                action === 'APPROVE'
                  ? 'e.g. Approved. Please bring your project report draft and laptop.'
                  : action === 'REJECT'
                  ? 'e.g. Busy in Department Academic Council Meeting. Please book Friday 2 PM slot instead.'
                  : 'e.g. Meeting concluded. Student milestone verified.'
              }
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:bg-white"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-1.5 text-xs font-bold text-white rounded shadow transition ${
                action === 'APPROVE'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : action === 'REJECT'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {loading ? 'Processing...' : `Confirm ${action}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
