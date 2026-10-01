import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Appointment,
  ERPStats,
  User,
  Notice,
  AdminFacultyHROverview,
  AdminFacultyAttendanceItem,
  FacultyLeaveRecord,
  FacultyAttendanceRecord,
  Course,
  FacultyWorkloadItem
} from '../types';
import { api } from '../services/api';
import { StatusBadge, UrgencyBadge, ModeBadge } from '../components/StatusBadge';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';
import {
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  CalendarCheck2,
  Clock,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  BarChart3,
  UserCheck,
  Briefcase,
  Check,
  X,
  AlertCircle,
  FileCheck,
  Calendar,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  MapPin,
  Award,
  BookOpen,
  Trash2,
  Plus,
  Sparkles,
  ClipboardCheck,
  AlertTriangle
} from 'lucide-react';

export const AdminDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ERPStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [studentList, setStudentList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Appointments table filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);

  // Faculty HR & Attendance Hub State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hrOverview, setHrOverview] = useState<AdminFacultyHROverview | null>(null);
  const [hrDeptFilter, setHrDeptFilter] = useState<string>('ALL');
  const [hrSearchTerm, setHrSearchTerm] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'ANALYTICS' | 'FACULTY_MANAGEMENT' | 'COURSE_MANAGEMENT' | 'HR_CONTROL' | 'APPOINTMENTS'>('ANALYTICS');

  // Institutional Analytics & Workload States
  const [analytics, setAnalytics] = useState<any>(null);
  const [workloads, setWorkloads] = useState<FacultyWorkloadItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Add Faculty Modal State
  const [addFacultyOpen, setAddFacultyOpen] = useState(false);
  const [newFacultyData, setNewFacultyData] = useState({
    name: '',
    identifier: '',
    email: '',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    cabin_room: 'Academic Block B - Room 204',
    specialization: 'Artificial Intelligence & Data Systems',
    password: 'password123',
    phone: '+91 98765 43210',
    cgpa_or_experience: '6+ Years Experience'
  });

  // Create Course Modal State
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    code: '',
    name: '',
    department: 'Computer Science & Engineering',
    semester: 5,
    credits: 4,
    faculty_id: 1,
    section: 'A',
    description: ''
  });

  // Enroll Student Modal State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);

  // Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetFaculty, setTargetFaculty] = useState<User | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>('PRESENT');
  const [overrideInTime, setOverrideInTime] = useState<string>('09:00 AM');
  const [overrideOutTime, setOverrideOutTime] = useState<string>('05:00 PM');
  const [overrideWorkMode, setOverrideWorkMode] = useState<string>('IN_CAMPUS');
  const [overrideHours, setOverrideHours] = useState<number>(8.0);
  const [overrideRemarks, setOverrideRemarks] = useState<string>('Administrative Regularization');
  const [savingOverride, setSavingOverride] = useState(false);

  // Leave Review Action
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLeaveForReview, setSelectedLeaveForReview] = useState<FacultyLeaveRecord | null>(null);
  const [adminReviewAction, setAdminReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [adminReviewRemarks, setAdminReviewRemarks] = useState<string>('Approved as per department academic guidelines.');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (dateToQuery?: string) => {
    try {
      setLoading(true);
      const queryDate = dateToQuery || selectedDate;
      const [erpStats, apps, facs, hrData, analyticsData, workloadData, courseData, studentsData] = await Promise.all([
        api.getERPStats(),
        api.getMyAppointments(),
        api.getFacultyList(),
        api.getAdminFacultyHROverview(queryDate),
        api.getInstitutionalAnalytics().catch(() => null),
        api.getFacultyWorkloads().catch(() => []),
        api.getAttendanceCourses().catch(() => []),
        api.getStudentList().catch(() => []),
      ]);
      setStats(erpStats);
      setAppointments(apps);
      setFacultyList(facs);
      setHrOverview(hrData);
      if (analyticsData) setAnalytics(analyticsData);
      setWorkloads(workloadData || []);
      setCourses(courseData || []);
      setStudentList(studentsData || []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Handle open override modal
  const handleOpenOverride = (item: AdminFacultyAttendanceItem) => {
    setTargetFaculty(item.faculty);
    const att = item.attendance;
    if (att) {
      setOverrideStatus(att.status);
      setOverrideInTime(att.check_in_time || '09:00 AM');
      setOverrideOutTime(att.check_out_time || '05:00 PM');
      setOverrideWorkMode(att.work_mode || 'IN_CAMPUS');
      setOverrideHours(att.working_hours || 8.0);
      setOverrideRemarks(att.remarks || 'Admin Attendance Override');
    } else {
      setOverrideStatus('PRESENT');
      setOverrideInTime('09:00 AM');
      setOverrideOutTime('05:00 PM');
      setOverrideWorkMode('IN_CAMPUS');
      setOverrideHours(8.0);
      setOverrideRemarks('Administrative Duty Verification');
    }
    setOverrideModalOpen(true);
  };

  // Submit override
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFaculty) return;
    try {
      setSavingOverride(true);
      await api.adminOverrideFacultyAttendance({
        faculty_id: targetFaculty.id,
        date: selectedDate,
        status: overrideStatus,
        check_in_time: overrideInTime,
        check_out_time: overrideOutTime,
        work_mode: overrideWorkMode,
        working_hours: Number(overrideHours),
        remarks: overrideRemarks,
      });
      showToast(`Attendance updated for ${targetFaculty.name} on ${selectedDate}!`);
      setOverrideModalOpen(false);
      await loadData(selectedDate);
    } catch (err: any) {
      alert(`Error updating attendance: ${err.message || 'Unknown error'}`);
    } finally {
      setSavingOverride(false);
    }
  };

  // Handle leave review modal
  const handleOpenLeaveReview = (leave: FacultyLeaveRecord, action: 'APPROVED' | 'REJECTED') => {
    setSelectedLeaveForReview(leave);
    setAdminReviewAction(action);
    setAdminReviewRemarks(
      action === 'APPROVED'
        ? 'Approved by Dean Office. Academic duties adjusted.'
        : 'Disapproved due to concurrent departmental exams / schedule conflict.'
    );
    setReviewModalOpen(true);
  };

  const handleConfirmLeaveReview = async () => {
    if (!selectedLeaveForReview) return;
    try {
      setSubmittingReview(true);
      await api.adminReviewFacultyLeave(selectedLeaveForReview.id, {
        status: adminReviewAction,
        admin_remarks: adminReviewRemarks,
      });
      showToast(
        `Leave requisition ${adminReviewAction === 'APPROVED' ? 'Approved' : 'Rejected'} for ${
          selectedLeaveForReview.faculty?.name || 'Faculty'
        }!`
      );
      setReviewModalOpen(false);
      await loadData(selectedDate);
    } catch (err: any) {
      alert(`Error reviewing leave: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered Appointments
  const filteredApps = appointments.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      app.appointment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.faculty?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.purpose_category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Faculty HR items
  const filteredHRItems = (hrOverview?.faculty_records || []).filter((item) => {
    const matchesDept = hrDeptFilter === 'ALL' || item.faculty.department.includes(hrDeptFilter);
    const matchesSearch =
      hrSearchTerm === '' ||
      item.faculty.name.toLowerCase().includes(hrSearchTerm.toLowerCase()) ||
      item.faculty.identifier.toLowerCase().includes(hrSearchTerm.toLowerCase()) ||
      item.faculty.department.toLowerCase().includes(hrSearchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addFaculty(newFacultyData);
      showToast(`Faculty ${newFacultyData.name} registered successfully!`);
      setAddFacultyOpen(false);
      setNewFacultyData({
        name: '',
        identifier: '',
        email: '',
        department: 'Computer Science & Engineering',
        designation: 'Assistant Professor',
        cabin_room: 'Academic Block B - Room 204',
        specialization: 'Artificial Intelligence & Data Systems',
        password: 'password123',
        phone: '+91 98765 43210',
        cgpa_or_experience: '6+ Years Experience'
      });
      await loadData();
    } catch (err: any) {
      alert(`Error adding faculty: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse({
        ...newCourseData,
        semester: Number(newCourseData.semester),
        credits: Number(newCourseData.credits),
        faculty_id: Number(newCourseData.faculty_id),
      });
      showToast(`Course ${newCourseData.code} created and assigned!`);
      setCreateCourseOpen(false);
      setNewCourseData({
        code: '',
        name: '',
        department: 'Computer Science & Engineering',
        semester: 5,
        credits: 4,
        faculty_id: 1,
        section: 'A',
        description: ''
      });
      await loadData();
    } catch (err: any) {
      alert(`Error creating course: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteCourse = async (courseId: number, code: string) => {
    if (confirm(`Are you sure you want to deactivate and remove course ${code}?`)) {
      try {
        await api.deleteCourse(courseId);
        showToast(`Course ${code} removed from active curriculum.`);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete course');
      }
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEnroll || !selectedStudentId) return;
    try {
      await api.enrollStudentInCourse(selectedCourseForEnroll.id, selectedStudentId);
      showToast(`Student enrolled into ${selectedCourseForEnroll.code}!`);
      setEnrollModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to enroll student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Executive Header */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={user?.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#C59B27] shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{user?.name}</h2>
                <span className="bg-amber-700 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500 font-mono">
                  {user?.identifier}
                </span>
                <span className="bg-emerald-900/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-700">
                  Super-Admin / Dean
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {user?.designation} • {user?.department}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-amber-200">
                <span>Campus Control: <strong>All Academic Blocks & Faculty Cabins</strong></span>
                <span>•</span>
                <span>Security Clearance: <strong>Tier-1 Superuser</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('gradebook')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded border border-amber-500 shadow transition flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-white" />
              <span>Gradebook Audit</span>
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="px-3.5 py-2 bg-[#2D3F66] hover:bg-[#3A4F7C] text-white text-xs font-bold rounded border border-[#435C91] shadow transition flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-[#C59B27]" />
              <span>University Calendar</span>
            </button>
            <button
              onClick={() => onNavigate('faculty-hr')}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded border border-indigo-600 shadow transition flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span>Faculty HR</span>
            </button>
            <button
              onClick={() => onNavigate('student-roster')}
              className="px-3.5 py-2 bg-[#C59B27] hover:bg-amber-400 text-slate-900 text-xs font-bold rounded shadow transition"
            >
              Student Registry
            </button>
          </div>
        </div>

        {/* Global Executive Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-6 bg-slate-50 border-t border-slate-200 divide-x divide-slate-200 text-xs">
          <div className="p-3 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total Faculty</div>
            <div className="text-xl font-bold text-[#1B2A4A] mt-0.5">{stats?.total_faculty || 5}</div>
          </div>
          <div className="p-3 text-center bg-emerald-50/60">
            <div className="text-[10px] text-emerald-900 font-bold uppercase">Faculty Present Today</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">
              {hrOverview?.present_today || 0}
              <span className="text-xs text-slate-500"> / {hrOverview?.total_faculty || 5}</span>
            </div>
          </div>
          <div className="p-3 text-center bg-indigo-50/60">
            <div className="text-[10px] text-indigo-900 font-bold uppercase">On Duty / Leave</div>
            <div className="text-xl font-bold text-indigo-700 mt-0.5">
              {(hrOverview?.on_duty_today || 0) + (hrOverview?.on_leave_today || 0)}
            </div>
          </div>
          <div className="p-3 text-center bg-blue-50/60">
            <div className="text-[10px] text-blue-900 font-bold uppercase">Faculty Attendance Rate</div>
            <div className="text-xl font-bold text-blue-800 mt-0.5">
              {hrOverview?.attendance_rate || 0}%
            </div>
          </div>
          <div className="p-3 text-center bg-amber-50/60">
            <div className="text-[10px] text-amber-900 font-bold uppercase">Pending Faculty Leaves</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">
              {hrOverview?.pending_leaves?.length || 0}
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Student Requisitions</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.total_appointments || 0}</div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-3 rounded shadow-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Main Control Switch Tabs */}
      <div className="border-b border-slate-300 flex items-center justify-between overflow-x-auto bg-white px-2 rounded-t shadow-2xs">
        <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveSection('ANALYTICS')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'ANALYTICS'
                ? 'border-[#C59B27] text-[#1B2A4A] bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#C59B27]" />
            <span>Institutional Analytics & Pulse</span>
          </button>

          <button
            onClick={() => setActiveSection('FACULTY_MANAGEMENT')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'FACULTY_MANAGEMENT'
                ? 'border-[#C59B27] text-[#1B2A4A] bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-[#1B2A4A]" />
            <span>Faculty Ecosystem & Workloads ({workloads.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('COURSE_MANAGEMENT')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'COURSE_MANAGEMENT'
                ? 'border-[#C59B27] text-[#1B2A4A] bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>Curriculum & Sections ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('HR_CONTROL')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'HR_CONTROL'
                ? 'border-[#C59B27] text-[#1B2A4A] bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-indigo-700" />
            <span>Faculty Attendance & HR</span>
            {(hrOverview?.pending_leaves?.length || 0) > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {hrOverview?.pending_leaves.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('APPOINTMENTS')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'APPOINTMENTS'
                ? 'border-[#C59B27] text-[#1B2A4A] bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4 text-blue-700" />
            <span>Consultations Ledger ({appointments.length})</span>
          </button>
        </div>
      </div>

      {/* ===================== SECTION: INSTITUTIONAL ANALYTICS & PULSE ===================== */}
      {activeSection === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Executive Pulse Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded border border-slate-300 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider">Campus Enrollment</span>
                <GraduationCap className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {analytics?.summary?.total_students || stats?.total_students || 3} Students
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {analytics?.summary?.total_enrollments || 6} Total Active Course Enrollments
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-slate-300 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider">Faculty Body</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {analytics?.summary?.total_faculty || stats?.total_faculty || 5} Professors
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Across {courses.length || 4} Curricular Programs
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-slate-300 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider">Attendance Compliance</span>
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-800 mt-2">
                {analytics?.attendance_health?.compliance_rate || 88.5}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {analytics?.attendance_health?.critical_risk_count || 1} Students Below 75% Rule
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-slate-300 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider">Grading Velocity</span>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 mt-2">
                {analytics?.academics_and_grading?.grading_completion_rate || 75.0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {analytics?.academics_and_grading?.graded_submissions || 2} of {analytics?.academics_and_grading?.total_submissions || 3} evaluated
              </div>
            </div>
          </div>

          {/* Institutional Health Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6: Campus Attendance Standing */}
            <div className="lg:col-span-6 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
              <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#C59B27]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Statutory Attendance Audit & Detention Risk
                  </h3>
                </div>
                <span className="text-[10px] text-slate-300 font-mono">
                  Min 75% Rule
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Healthy Attendance (&ge; 78%)</span>
                    <span className="font-bold text-emerald-700">
                      {analytics?.attendance_health?.eligible_healthy_count ?? 2} Students
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '66%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Borderline Warning (75% - 78%)</span>
                    <span className="font-bold text-amber-600">
                      {analytics?.attendance_health?.borderline_count ?? 0} Students
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Critical Shortage (&lt; 75% Debarment Risk)</span>
                    <span className="font-bold text-rose-700">
                      {analytics?.attendance_health?.critical_risk_count ?? 1} Students
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-rose-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Dean Directive: Send advisory notice to students facing shortage.</span>
                  <button
                    onClick={() => onNavigate('attendance')}
                    className="text-xs font-bold text-[#1B2A4A] hover:underline"
                  >
                    Open Student Attendance Register &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Right 6: Academic Grading & Assessment Velocity */}
            <div className="lg:col-span-6 bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
              <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C59B27]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Academic Evaluation & Gradebook Completion
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('gradebook')}
                  className="text-[11px] text-amber-300 hover:text-white"
                >
                  Gradebook Audit &rarr;
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border rounded">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Assessments Created</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {analytics?.academics_and_grading?.total_assessments || 8}
                    </div>
                    <div className="text-[10px] text-slate-500">Quizzes, Mid-terms, Labs</div>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Grades Awarded</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">
                      {analytics?.academics_and_grading?.total_grades_awarded || 10}
                    </div>
                    <div className="text-[10px] text-slate-500">Letter grades in registry</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Assignment Evaluation Rate</span>
                    <span className="font-bold text-[#1B2A4A]">
                      {analytics?.academics_and_grading?.grading_completion_rate || 75.0}% Completed
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-amber-500 h-3 rounded-full transition-all"
                      style={{ width: `${analytics?.academics_and_grading?.grading_completion_rate || 75}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border flex items-center justify-between">
                  <span>Pending evaluations across faculty: <strong>{analytics?.academics_and_grading?.pending_submissions || 1}</strong> submissions</span>
                  <button
                    onClick={() => setActiveSection('FACULTY_MANAGEMENT')}
                    className="text-indigo-700 font-bold hover:underline"
                  >
                    View Faculty Workloads &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SECTION: FACULTY ECOSYSTEM & WORKLOAD MANAGEMENT ===================== */}
      {activeSection === 'FACULTY_MANAGEMENT' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded border border-slate-300 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1B2A4A]" />
                University Faculty Workload & Department Roster
              </h3>
              <p className="text-xs text-slate-500">
                Monitor teaching hours, assigned courses, batch enrollment, and evaluation backlog.
              </p>
            </div>
            <button
              onClick={() => setAddFacultyOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Faculty</span>
            </button>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Faculty / Employee</th>
                    <th className="py-2.5 px-3">Department & Cabin</th>
                    <th className="py-2.5 px-3 text-center">Weekly Load</th>
                    <th className="py-2.5 px-3 text-center">Courses</th>
                    <th className="py-2.5 px-3 text-center">Enrolled Students</th>
                    <th className="py-2.5 px-3 text-center">Grading Backlog</th>
                    <th className="py-2.5 px-3 text-center">Workload Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {workloads.map((item) => (
                    <tr key={item.faculty_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.faculty_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{item.identifier} • {item.designation}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{item.department}</div>
                        <div className="text-[10px] text-slate-500">{item.cabin_room}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <div className="font-bold text-slate-900">{item.weekly_classes_count} classes</div>
                        <div className="text-[10px] text-slate-500">{item.weekly_teaching_hours} teaching hrs</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {item.active_courses_count}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700">
                        {item.total_students_enrolled}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          item.pending_assignments_to_grade > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.pending_assignments_to_grade} pending
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          item.workload_status === 'HEAVY'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : item.workload_status === 'MODERATE'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {item.workload_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            const fac = facultyList.find((f) => f.id === item.faculty_id);
                            if (fac) {
                              const hrItem: any = { faculty: fac };
                              handleOpenOverride(hrItem);
                            }
                          }}
                          className="px-2 py-1 bg-[#1B2A4A] text-white hover:bg-[#2D3F66] rounded text-[10px] font-semibold"
                        >
                          Override / Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SECTION: CURRICULUM & SECTION MANAGEMENT ===================== */}
      {activeSection === 'COURSE_MANAGEMENT' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded border border-slate-300 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                Active University Curriculum & Course Sections
              </h3>
              <p className="text-xs text-slate-500">
                Create courses, assign faculty instructors, manage class sections, and enroll students.
              </p>
            </div>
            <button
              onClick={() => setCreateCourseOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Course</span>
            </button>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Code & Section</th>
                    <th className="py-2.5 px-3">Course Title</th>
                    <th className="py-2.5 px-3">Department & Semester</th>
                    <th className="py-2.5 px-3">Assigned Faculty</th>
                    <th className="py-2.5 px-3 text-center">Credits</th>
                    <th className="py-2.5 px-3 text-center">Enrollment</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-sm text-[#6B1D2F]">{c.code}</div>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-semibold">
                          Section: {c.section || 'A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {c.name}
                        {c.description && <p className="text-[10px] text-slate-500 font-normal line-clamp-1">{c.description}</p>}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{c.department}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Semester {c.semester}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{c.faculty?.name || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-500">{c.faculty?.identifier}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {c.credits || 4}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700">
                        {c.enrolled_count || 0} Students
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCourseForEnroll(c);
                              setEnrollModalOpen(true);
                            }}
                            className="px-2 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-[10px] font-semibold"
                            title="Enroll Student"
                          >
                            + Enroll
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(c.id, c.code)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SECTION: FACULTY HR & ATTENDANCE CONTROL ===================== */}
      {activeSection === 'HR_CONTROL' && (
        <div className="space-y-6">
          {/* Pending Leave Requests Alert Banner (if any) */}
          {(hrOverview?.pending_leaves?.length || 0) > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-800" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Pending Faculty Leave & On-Duty Requisitions Awaiting Dean Approval
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                  {hrOverview?.pending_leaves.length} Requisitions Requiring Action
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hrOverview?.pending_leaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="bg-white p-3.5 rounded border border-amber-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {leave.faculty?.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {leave.faculty?.identifier} • {leave.faculty?.department}
                          </div>
                        </div>
                        <span className="bg-amber-100 text-amber-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          {leave.leave_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{leave.start_date} to {leave.end_date}</span>
                          <span className="text-slate-400">•</span>
                          <span>{leave.total_days} {leave.total_days === 1 ? 'Day' : 'Days'}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 italic">
                          "{leave.reason}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenLeaveReview(leave, 'REJECTED')}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleOpenLeaveReview(leave, 'APPROVED')}
                        className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Leave</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Faculty Attendance Register & Marker Audit Table */}
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            {/* Header Control Bar */}
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#C59B27]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Campus Faculty Daily Attendance Register & Marker
                  </h3>
                  <div className="text-[10px] text-slate-300">
                    Live Biometric Gateway & Administrative Regularization
                  </div>
                </div>
              </div>

              {/* Filters & Date selector */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Date Picker */}
                <div className="flex items-center gap-1.5 bg-[#121C33] border border-slate-600 px-2 py-1 rounded">
                  <span className="text-[10px] text-amber-300 uppercase font-mono font-bold">Audit Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-white text-xs font-mono focus:outline-hidden"
                  />
                </div>

                {/* Dept Filter */}
                <select
                  value={hrDeptFilter}
                  onChange={(e) => setHrDeptFilter(e.target.value)}
                  className="bg-[#121C33] border border-slate-600 text-white text-xs py-1 px-2.5 rounded focus:outline-hidden"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Information Technology">Information Tech</option>
                </select>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={hrSearchTerm}
                    onChange={(e) => setHrSearchTerm(e.target.value)}
                    placeholder="Search faculty..."
                    className="pl-7 pr-3 py-1 bg-[#121C33] border border-slate-600 rounded text-xs text-white placeholder-slate-400 focus:outline-hidden"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
              </div>
            </div>

            {/* Quick Status Sub-Bar */}
            {hrOverview && (
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <span>Audit Date: <strong className="font-mono text-slate-900">{selectedDate}</strong></span>
                  <span>•</span>
                  <span>Present: <strong className="text-emerald-700 font-bold">{hrOverview.present_today}</strong></span>
                  <span>•</span>
                  <span>On Duty (OD): <strong className="text-indigo-700 font-bold">{hrOverview.on_duty_today}</strong></span>
                  <span>•</span>
                  <span>Half Day: <strong className="text-amber-700 font-bold">{hrOverview.half_day_today}</strong></span>
                  <span>•</span>
                  <span>On Leave: <strong className="text-red-700 font-bold">{hrOverview.on_leave_today}</strong></span>
                  <span>•</span>
                  <span>Unmarked: <strong className="text-slate-500 font-bold">{hrOverview.unmarked_today}</strong></span>
                </div>
                <div className="text-[11px] font-bold text-slate-600 font-mono">
                  Institutional Turnout: <span className="text-emerald-700">{hrOverview.attendance_rate}%</span>
                </div>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading faculty attendance overview...</div>
            ) : filteredHRItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No faculty members match the filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3">Faculty Details</th>
                      <th className="py-2.5 px-3">Cabin Room</th>
                      <th className="py-2.5 px-3">Today's Punch In</th>
                      <th className="py-2.5 px-3">Today's Punch Out</th>
                      <th className="py-2.5 px-3">Hours Logged</th>
                      <th className="py-2.5 px-3">Work Mode</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Month Performance</th>
                      <th className="py-2.5 px-3 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredHRItems.map((item) => {
                      const att = item.attendance;
                      const hasRecord = !!att;
                      const isPresent = att?.status === 'PRESENT';
                      const isOD = att?.status === 'ON_DUTY';
                      const isHalf = att?.status === 'HALF_DAY';
                      const isLeave = att?.status === 'ON_LEAVE';
                      const isUnmarked = !att;

                      return (
                        <tr key={item.faculty.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  item.faculty.avatar_url ||
                                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
                                }
                                alt={item.faculty.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-300"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{item.faculty.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {item.faculty.identifier} • {item.faculty.department}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3 h-3 text-red-500" />
                              <span>{item.faculty.cabin_room || 'Cabin 304'}</span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                            {att?.check_in_time ? (
                              <span className="text-emerald-700 font-bold">{att.check_in_time}</span>
                            ) : (
                              <span className="text-slate-400">--:--</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                            {att?.check_out_time ? (
                              <span className="text-blue-700 font-bold">{att.check_out_time}</span>
                            ) : (
                              <span className="text-slate-400">--:--</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                            {att && att.working_hours > 0 ? (
                              <span className="bg-slate-100 font-bold px-1.5 py-0.5 rounded text-slate-800">
                                {att.working_hours} hrs
                              </span>
                            ) : (
                              <span className="text-slate-400">0.0</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap text-[10px] font-mono">
                            {att?.work_mode ? (
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                                {att.work_mode.replace(/_/g, ' ')}
                              </span>
                            ) : (
                              <span className="text-slate-400">IN CAMPUS</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {isPresent && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded border border-emerald-300">
                                PRESENT
                              </span>
                            )}
                            {isOD && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold text-[10px] rounded border border-indigo-300">
                                ON DUTY (OD)
                              </span>
                            )}
                            {isHalf && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded border border-amber-300">
                                HALF DAY
                              </span>
                            )}
                            {isLeave && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 font-extrabold text-[10px] rounded border border-red-300">
                                ON LEAVE
                              </span>
                            )}
                            {isUnmarked && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-extrabold text-[10px] rounded border border-slate-300">
                                NOT MARKED
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-800">{item.month_percentage}%</div>
                            <div className="text-[10px] text-slate-500">
                              {item.month_present_days} days • {item.month_total_hours} hrs
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenOverride(item)}
                              className="px-2.5 py-1 bg-[#1B2A4A] hover:bg-[#2D3F66] text-white rounded text-[11px] font-semibold transition"
                            >
                              Mark / Override
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== SECTION 2: APPOINTMENTS REQUISITION REGISTRY ===================== */}
      {activeSection === 'APPOINTMENTS' && (
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#1B2A4A] text-white px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-[#C59B27]">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Campus-Wide Appointment Requisition Registry
              </h3>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-60">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search token, student, faculty..."
                  className="w-full pl-7 pr-3 py-1 bg-[#121C33] border border-slate-600 rounded text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#121C33] border border-slate-600 text-white text-xs py-1 px-2.5 rounded focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading campus registry...</div>
          ) : filteredApps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No appointments matching filters found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#121C33] text-white text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Token Code</th>
                    <th className="py-2.5 px-3">Student Details</th>
                    <th className="py-2.5 px-3">Faculty / Guide</th>
                    <th className="py-2.5 px-3">Scheduled Date</th>
                    <th className="py-2.5 px-3">Purpose Category</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {app.appointment_code}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{app.student?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {app.student?.identifier} • {app.student?.department}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{app.faculty?.name}</div>
                        <div className="text-[10px] text-slate-500">{app.faculty?.cabin_room}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{app.date}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{app.time_slot}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px]">
                        <div className="font-semibold text-slate-800 truncate">{app.purpose_category}</div>
                        <div className="text-[10px] text-slate-500 truncate">{app.purpose_details}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <ModeBadge mode={app.meeting_mode} />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setViewingAppointment(app)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================== ADMIN OVERRIDE MODAL ===================== */}
      {overrideModalOpen && targetFaculty && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-slate-300">
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Admin Faculty Attendance Marker & Override
                </h3>
              </div>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="p-4 space-y-3">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center gap-3">
                <img
                  src={targetFaculty.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                  alt={targetFaculty.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#C59B27]"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{targetFaculty.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {targetFaculty.identifier} • {targetFaculty.department}
                  </div>
                  <div className="text-[10px] text-amber-700">Date: {selectedDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="ON_DUTY">ON DUTY (OD)</option>
                    <option value="HALF_DAY">HALF DAY</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Mode</label>
                  <select
                    value={overrideWorkMode}
                    onChange={(e) => setOverrideWorkMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="IN_CAMPUS">In-Campus</option>
                    <option value="WORK_FROM_HOME">Work From Home</option>
                    <option value="FIELD_DUTY">Field / Exam Duty</option>
                    <option value="CONFERENCE">Conference Deputation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check-in</label>
                  <input
                    type="text"
                    value={overrideInTime}
                    onChange={(e) => setOverrideInTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check-out</label>
                  <input
                    type="text"
                    value={overrideOutTime}
                    onChange={(e) => setOverrideOutTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={overrideHours}
                    onChange={(e) => setOverrideHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrative Remarks / Verification Reason
                </label>
                <textarea
                  rows={2}
                  value={overrideRemarks}
                  onChange={(e) => setOverrideRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOverride}
                  className="px-4 py-1.5 bg-[#1B2A4A] hover:bg-[#2D3F66] text-white text-xs font-bold rounded shadow transition disabled:opacity-50"
                >
                  {savingOverride ? 'Updating...' : 'Save & Overwrite Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== LEAVE REVIEW MODAL ===================== */}
      {reviewModalOpen && selectedLeaveForReview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-slate-300">
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Review Leave Application
                </h3>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="text-xs font-bold text-slate-900">
                  {selectedLeaveForReview.faculty?.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {selectedLeaveForReview.leave_type.replace(/_/g, ' ')} • {selectedLeaveForReview.total_days} Day(s)
                </div>
                <div className="text-[11px] text-slate-700 mt-1">
                  Dates: <strong>{selectedLeaveForReview.start_date}</strong> to{' '}
                  <strong>{selectedLeaveForReview.end_date}</strong>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 italic">
                  "{selectedLeaveForReview.reason}"
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dean / Admin Review Decision
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      checked={adminReviewAction === 'APPROVED'}
                      onChange={() => setAdminReviewAction('APPROVED')}
                    />
                    <span>Approve Application</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-rose-800 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      checked={adminReviewAction === 'REJECTED'}
                      onChange={() => setAdminReviewAction('REJECTED')}
                    />
                    <span>Reject Application</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrative Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={adminReviewRemarks}
                  onChange={(e) => setAdminReviewRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLeaveReview}
                  disabled={submittingReview}
                  className={`px-4 py-1.5 text-white text-xs font-bold rounded shadow transition disabled:opacity-50 ${
                    adminReviewAction === 'APPROVED'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {submittingReview ? 'Processing...' : `Confirm ${adminReviewAction}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: ADD NEW FACULTY ===================== */}
      {addFacultyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded shadow-xl max-w-lg w-full overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Register New Faculty Member into University ERP
                </h3>
              </div>
              <button
                onClick={() => setAddFacultyOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFaculty} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Prof. / Dr. Full Name"
                    value={newFacultyData.name}
                    onChange={(e) => setNewFacultyData({ ...newFacultyData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="FAC-006"
                    value={newFacultyData.identifier}
                    onChange={(e) => setNewFacultyData({ ...newFacultyData, identifier: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="faculty@git.ac.in"
                    value={newFacultyData.email}
                    onChange={(e) => setNewFacultyData({ ...newFacultyData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <select
                    value={newFacultyData.designation}
                    onChange={(e) => setNewFacultyData({ ...newFacultyData, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    <option value="Professor & Head">Professor & Head</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Visiting Lecturer">Visiting Lecturer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={newFacultyData.department}
                    onChange={(e) => setNewFacultyData({ ...newFacultyData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cabin / Office Room</label>
                  <input
                    type="text"
                    placeholder="Academic Block B - Room 204"
                    value={newFacultyData.cabin_room}
                    onChange={(e) => setNewFacultyData({ ...newFacultyData, cabin_room: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialization / Expertise</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems, Machine Learning"
                  value={newFacultyData.specialization}
                  onChange={(e) => setNewFacultyData({ ...newFacultyData, specialization: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newFacultyData.password}
                  onChange={(e) => setNewFacultyData({ ...newFacultyData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddFacultyOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow transition"
                >
                  Register Faculty Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: CREATE NEW COURSE ===================== */}
      {createCourseOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded shadow-xl max-w-lg w-full overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Define University Course & Assign Instructor
                </h3>
              </div>
              <button
                onClick={() => setCreateCourseOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="CS503"
                    value={newCourseData.code}
                    onChange={(e) => setNewCourseData({ ...newCourseData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-[#6B1D2F]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Operating Systems & Concurrency"
                    value={newCourseData.name}
                    onChange={(e) => setNewCourseData({ ...newCourseData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={newCourseData.department}
                    onChange={(e) => setNewCourseData({ ...newCourseData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">ME</option>
                    <option value="Civil Engineering">CE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={newCourseData.semester}
                    onChange={(e) => setNewCourseData({ ...newCourseData, semester: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="A"
                    value={newCourseData.section}
                    onChange={(e) => setNewCourseData({ ...newCourseData, section: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newCourseData.credits}
                    onChange={(e) => setNewCourseData({ ...newCourseData, credits: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Instructor *</label>
                  <select
                    value={newCourseData.faculty_id}
                    onChange={(e) => setNewCourseData({ ...newCourseData, faculty_id: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.identifier})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Syllabus Overview</label>
                <textarea
                  rows={2}
                  placeholder="Core curriculum requirements and prerequisites..."
                  value={newCourseData.description}
                  onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateCourseOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow transition"
                >
                  Create & Catalog Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: ENROLL STUDENT ===================== */}
      {enrollModalOpen && selectedCourseForEnroll && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl max-w-md w-full overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Enroll Student in {selectedCourseForEnroll.code}
                </h3>
              </div>
              <button
                onClick={() => setEnrollModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} className="p-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded border text-xs">
                <div className="font-bold text-slate-900">{selectedCourseForEnroll.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {selectedCourseForEnroll.code} • Section {selectedCourseForEnroll.section || 'A'} • Semester {selectedCourseForEnroll.semester}
                </div>
                <div className="text-[11px] text-amber-800 mt-1">
                  Instructor: <strong>{selectedCourseForEnroll.faculty?.name}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Student to Enroll *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-900"
                >
                  <option value={0}>-- Select Registered Student --</option>
                  {studentList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.identifier}) — {st.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudentId}
                  className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded shadow transition disabled:opacity-50"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        appointment={viewingAppointment}
      />
    </div>
  );
};
