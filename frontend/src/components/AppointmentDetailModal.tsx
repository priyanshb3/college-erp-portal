import React from 'react';
import { Appointment } from '../types';
import { StatusBadge, UrgencyBadge, ModeBadge } from './StatusBadge';
import { Printer, X, Building2, MapPin, Calendar, Clock, User as UserIcon, MessageSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const AppointmentDetailModal: React.FC<Props> = ({ isOpen, onClose, appointment }) => {
  if (!isOpen || !appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#1B2A4A] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#C59B27] print:hidden">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#C59B27]" />
            <h3 className="text-sm font-bold tracking-wide">
              Official ERP Academic Appointment Slip
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-[#C59B27] text-slate-900 px-2.5 py-1 rounded text-xs font-semibold hover:bg-amber-400 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable ERP Slip Document */}
        <div className="p-6 space-y-6 text-xs bg-white" id="printable-slip">
          {/* Institutional Header Banner */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between">
            <div>
              <div className="text-[10px] tracking-widest font-bold text-slate-500 font-serif-erp uppercase">
                GOVERNMENT INSTITUTE OF TECHNOLOGY & SCIENCE
              </div>
              <h2 className="text-base font-bold text-[#1B2A4A]">
                FACULTY - STUDENT ACADEMIC APPOINTMENT SLIP
              </h2>
              <p className="text-[11px] text-slate-600">
                Academic Session: 2026-27 (Odd Semester) • Enterprise Resource Planning Cell
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-500">APPOINTMENT TOKEN</div>
              <div className="text-sm font-mono font-black text-[#6B1D2F] bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                {appointment.appointment_code}
              </div>
            </div>
          </div>

          {/* Status & Timing Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-3 rounded">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Status</div>
              <div className="mt-0.5"><StatusBadge status={appointment.status} /></div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Urgency</div>
              <div className="mt-0.5"><UrgencyBadge urgency={appointment.urgency} /></div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Scheduled Date</div>
              <div className="mt-0.5 font-bold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                {appointment.date}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Time Slot</div>
              <div className="mt-0.5 font-bold text-slate-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                {appointment.time_slot}
              </div>
            </div>
          </div>

          {/* Student & Faculty Two-Column Detail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Column */}
            <div className="border border-slate-200 rounded p-3 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B1D2F] border-b pb-1 mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                Applicant (Student Record)
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div><strong>Name:</strong> {appointment.student?.name}</div>
                <div><strong>Roll Number:</strong> <span className="font-mono">{appointment.student?.identifier}</span></div>
                <div><strong>Department:</strong> {appointment.student?.department}</div>
                <div><strong>Class/Sem:</strong> {appointment.student?.designation || `Semester ${appointment.student?.semester || 6}`}</div>
                <div><strong>Email:</strong> {appointment.student?.email}</div>
                <div><strong>Academic Standing:</strong> {appointment.student?.cgpa_or_experience}</div>
              </div>
            </div>

            {/* Faculty Column */}
            <div className="border border-slate-200 rounded p-3 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#1B2A4A] border-b pb-1 mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                Host (Faculty Record)
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div><strong>Name:</strong> {appointment.faculty?.name}</div>
                <div><strong>Faculty ID:</strong> <span className="font-mono">{appointment.faculty?.identifier}</span></div>
                <div><strong>Department:</strong> {appointment.faculty?.department}</div>
                <div><strong>Designation:</strong> {appointment.faculty?.designation}</div>
                <div><strong>Cabin/Room:</strong> {appointment.faculty?.cabin_room}</div>
                <div><strong>Official Email:</strong> {appointment.faculty?.email}</div>
              </div>
            </div>
          </div>

          {/* Meeting Specifics */}
          <div className="space-y-3">
            <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
              <div className="text-[10px] font-bold uppercase text-slate-700 mb-1">
                Meeting Mode & Approved Location
              </div>
              <div className="flex items-center gap-3">
                <ModeBadge mode={appointment.meeting_mode} />
                <div className="text-slate-800 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  {appointment.cabin_or_link || appointment.faculty?.cabin_room || 'Academic Block'}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded p-3">
              <div className="text-[10px] font-bold uppercase text-slate-700 mb-1">
                Subject & Reason for Appointment: <span className="text-[#6B1D2F] font-bold">{appointment.purpose_category}</span>
              </div>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                {appointment.purpose_details}
              </p>
            </div>

            {appointment.faculty_remarks && (
              <div className="border border-blue-200 bg-blue-50/60 rounded p-3">
                <div className="text-[10px] font-bold uppercase text-blue-900 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Faculty Remarks / Confirmation Instructions
                </div>
                <p className="text-blue-950 font-medium italic">
                  "{appointment.faculty_remarks}"
                </p>
              </div>
            )}
          </div>

          {/* Verification Footer for Print */}
          <div className="pt-4 border-t border-slate-300 grid grid-cols-2 text-[10px] text-slate-500">
            <div>
              <p>Generated by College ERP Gateway</p>
              <p>Timestamp: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="border-b border-slate-400 pb-4 mb-1">Faculty / Authorized Seal</p>
              <p>Academic Affairs Verification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
