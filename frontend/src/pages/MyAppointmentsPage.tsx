import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, UrgencyBadge, ModeBadge } from '../components/StatusBadge';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';
import { AppointmentActionModal } from '../components/AppointmentActionModal';
import {
  CalendarCheck2,
  Search,
  Filter,
  Eye,
  XCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  Download,
  RotateCcw
} from 'lucide-react';

export const MyAppointmentsPage: React.FC = () => {
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [actionApp, setActionApp] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'COMPLETE'>('APPROVE');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const apps = await api.getMyAppointments(statusFilter);
      setAppointments(apps);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const handleCancel = async (id: number) => {
    if (confirm('Are you sure you want to cancel this appointment requisition?')) {
      try {
        await api.cancelAppointment(id);
        loadAppointments();
      } catch (err: any) {
        alert(err.message || 'Failed to cancel appointment');
      }
    }
  };

  const filteredApps = appointments.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.appointment_code.toLowerCase().includes(q) ||
      app.purpose_category.toLowerCase().includes(q) ||
      app.purpose_details.toLowerCase().includes(q) ||
      app.student?.name.toLowerCase().includes(q) ||
      app.faculty?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-3">
            <CalendarCheck2 className="w-8 h-8 text-[#C59B27]" />
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-tight">
                Academic Appointment Requisition Ledger
              </h2>
              <p className="text-xs text-slate-300">
                Central ERP record of all appointment bookings, approvals, and formal slips
              </p>
            </div>
          </div>

          <button
            onClick={loadAppointments}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded border border-white/20 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-8 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Token Code, Faculty/Student name, or Subject..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Status Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:outline-hidden font-semibold"
            >
              <option value="ALL">All Statuses (Full History)</option>
              <option value="PENDING">Pending Requisitions</option>
              <option value="APPROVED">Confirmed / Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Declined / Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading ledger records...</div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No appointment records found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Token Code</th>
                  <th className="py-3 px-3">{role === 'student' ? 'Faculty / Professor' : 'Student Applicant'}</th>
                  <th className="py-3 px-3">Date & Time Slot</th>
                  <th className="py-3 px-3">Purpose & Subject</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-3">Mode & Venue</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#6B1D2F] whitespace-nowrap">
                      {app.appointment_code}
                    </td>

                    <td className="py-3 px-3">
                      {role === 'student' ? (
                        <div>
                          <div className="font-bold text-slate-900">{app.faculty?.name}</div>
                          <div className="text-[10px] text-slate-500">{app.faculty?.department}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900">{app.student?.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{app.student?.identifier} • {app.student?.department}</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{app.date}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{app.time_slot}</div>
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="font-semibold text-slate-900 truncate">{app.purpose_category}</div>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5">{app.purpose_details}</div>
                      {app.faculty_remarks && (
                        <div className="text-[10px] text-blue-700 italic truncate mt-0.5">
                          Note: "{app.faculty_remarks}"
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <UrgencyBadge urgency={app.urgency} />
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <ModeBadge mode={app.meeting_mode} />
                      <div className="text-[10px] text-slate-600 truncate mt-0.5 max-w-[130px]">
                        {app.cabin_or_link || app.faculty?.cabin_room}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={app.status} />
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingAppointment(app)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 border border-slate-300"
                          title="View Official Requisition Slip"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Slip</span>
                        </button>

                        {role === 'student' && app.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(app.id)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
                            title="Cancel Requisition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {role === 'faculty' && app.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setActionApp(app);
                              setActionType('APPROVE');
                            }}
                            className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold"
                          >
                            Approve
                          </button>
                        )}

                        {role === 'faculty' && app.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setActionApp(app);
                              setActionType('COMPLETE');
                            }}
                            className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[11px] font-semibold"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        appointment={viewingAppointment}
      />

      {/* Faculty Action Modal */}
      <AppointmentActionModal
        isOpen={!!actionApp}
        onClose={() => setActionApp(null)}
        onSuccess={loadAppointments}
        appointment={actionApp}
        initialAction={actionType}
      />
    </div>
  );
};
