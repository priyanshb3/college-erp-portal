import {
  User,
  Slot,
  Appointment,
  Notice,
  ERPStats,
  Course,
  ScheduleItem,
  TodayScheduleResponse,
  AttendanceStudentRosterItem,
  StudentAttendanceSummary,
  Assignment,
  Submission,
  CommunicationMessage,
  ThreadDetail,
  FacultyAttendanceRecord,
  FacultyLeaveRecord,
  FacultyHRSummary,
  AdminFacultyHROverview,
  Assessment,
  CourseGradebook,
  StudentGradeHistory,
  NotificationItem,
  CalendarEvent,
  FacultyWorkloadItem,
  AttendanceRiskItem,
  FacultyRecommendationItem,
  FacultyActionCenter,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('erp_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch {
      errorMsg = res.statusText;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(identifier: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    return handleResponse<{ access_token: string; token_type: string; user: User }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  async getDemoUsers() {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    return handleResponse<any[]>(res);
  },

  // Appointments
  async getMyAppointments(status?: string) {
    const url = status && status !== 'ALL'
      ? `${API_BASE}/appointments/my?status_filter=${status}`
      : `${API_BASE}/appointments/my`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Appointment[]>(res);
  },

  async getAppointmentDetail(id: number) {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Appointment>(res);
  },

  async bookAppointment(data: {
    faculty_id: number;
    slot_id?: number;
    date: string;
    time_slot: string;
    purpose_category: string;
    purpose_details: string;
    urgency?: string;
    meeting_mode?: string;
  }) {
    const res = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Appointment>(res);
  },

  async updateAppointmentStatus(id: number, data: {
    status: string;
    faculty_remarks?: string;
    cabin_or_link?: string;
  }) {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Appointment>(res);
  },

  async cancelAppointment(id: number) {
    const res = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; id: number }>(res);
  },

  // Faculty Availability Slots
  async getFacultySlots(facultyId: number) {
    const res = await fetch(`${API_BASE}/slots/faculty/${facultyId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Slot[]>(res);
  },

  async getMySlots() {
    const res = await fetch(`${API_BASE}/slots/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Slot[]>(res);
  },

  async createSlot(data: {
    day_of_week: string;
    start_time: string;
    end_time: string;
    venue?: string;
    max_students?: number;
    is_active?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/slots/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Slot>(res);
  },

  async deleteSlot(id: number) {
    const res = await fetch(`${API_BASE}/slots/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; id: number }>(res);
  },

  // Users & Directory
  async getFacultyList(department?: string, search?: string) {
    const params = new URLSearchParams();
    if (department && department !== 'All Departments') params.append('department', department);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/users/faculty?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User[]>(res);
  },

  async getStudentList(department?: string, search?: string) {
    const params = new URLSearchParams();
    if (department && department !== 'All Departments') params.append('department', department);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/users/students?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User[]>(res);
  },

  async getERPStats() {
    const res = await fetch(`${API_BASE}/users/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ERPStats>(res);
  },

  async getNotices() {
    const res = await fetch(`${API_BASE}/users/notices`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Notice[]>(res);
  },

  // Daily Schedule & Timetable
  async getMySchedule(dayOfWeek?: string) {
    const url = dayOfWeek && dayOfWeek !== 'All'
      ? `${API_BASE}/schedule/my?day_of_week=${dayOfWeek}`
      : `${API_BASE}/schedule/my`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse<ScheduleItem[]>(res);
  },

  async getTodaySchedule(day?: string) {
    const url = day && day !== 'Auto'
      ? `${API_BASE}/schedule/today?day=${day}`
      : `${API_BASE}/schedule/today`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse<TodayScheduleResponse>(res);
  },

  async createScheduleItem(data: {
    day_of_week: string;
    start_time: string;
    end_time: string;
    course_code: string;
    subject_name: string;
    venue: string;
    session_type?: string;
    batch?: string;
  }) {
    const res = await fetch(`${API_BASE}/schedule/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ScheduleItem>(res);
  },

  async deleteScheduleItem(id: number) {
    const res = await fetch(`${API_BASE}/schedule/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; id: number }>(res);
  },

  // Attendance Management
  async getAttendanceCourses() {
    const res = await fetch(`${API_BASE}/attendance/courses`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Course[]>(res);
  },

  async getCourseRosterForAttendance(courseId: number, date?: string) {
    const url = date
      ? `${API_BASE}/attendance/course/${courseId}/roster?date=${date}`
      : `${API_BASE}/attendance/course/${courseId}/roster`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse<AttendanceStudentRosterItem[]>(res);
  },

  async takeAttendance(data: {
    course_id: number;
    date: string;
    session_title: string;
    time_slot?: string;
    records: { student_id: number; status: string; remarks?: string }[];
  }) {
    const res = await fetch(`${API_BASE}/attendance/take`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; course_code: string; date: string; session_title: string }>(res);
  },

  async getCourseAttendanceHistory(courseId: number) {
    const res = await fetch(`${API_BASE}/attendance/course/${courseId}/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async getStudentAttendanceSummary() {
    const res = await fetch(`${API_BASE}/attendance/my-summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<StudentAttendanceSummary>(res);
  },

  // Submissions & Assignments
  async getAssignments(courseId?: number) {
    const url = courseId
      ? `${API_BASE}/submissions/assignments?course_id=${courseId}`
      : `${API_BASE}/submissions/assignments`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse<Assignment[]>(res);
  },

  async createAssignment(data: {
    course_id: number;
    title: string;
    description: string;
    due_date: string;
    total_marks?: number;
    submission_format?: string;
    attachment_hint?: string;
  }) {
    const res = await fetch(`${API_BASE}/submissions/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Assignment>(res);
  },

  async getAssignmentSubmissions(assignmentId: number) {
    const res = await fetch(`${API_BASE}/submissions/assignments/${assignmentId}/submissions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Submission[]>(res);
  },

  async submitAssignment(assignmentId: number, data: {
    submission_text?: string;
    attachment_name?: string;
    attachment_url?: string;
  }) {
    const res = await fetch(`${API_BASE}/submissions/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Submission>(res);
  },

  async gradeSubmission(submissionId: number, data: {
    marks_awarded: number;
    faculty_feedback?: string;
  }) {
    const res = await fetch(`${API_BASE}/submissions/${submissionId}/grade`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Submission>(res);
  },

  // Communication Bridge & Doubts
  async getMessageThreads(filterType?: string) {
    const url = filterType && filterType !== 'ALL'
      ? `${API_BASE}/communication/threads?filter_type=${filterType}`
      : `${API_BASE}/communication/threads`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse<CommunicationMessage[]>(res);
  },

  async getThreadDetail(threadId: number) {
    const res = await fetch(`${API_BASE}/communication/threads/${threadId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ThreadDetail>(res);
  },

  async sendMessage(data: {
    receiver_id?: number;
    course_id?: number;
    subject: string;
    content: string;
    message_type?: string;
    parent_id?: number;
  }) {
    const res = await fetch(`${API_BASE}/communication/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<CommunicationMessage>(res);
  },

  async postCourseAnnouncement(data: {
    course_id: number;
    subject: string;
    content: string;
  }) {
    const res = await fetch(`${API_BASE}/communication/announcement`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<CommunicationMessage>(res);
  },

  async getUnreadMessageCount() {
    const res = await fetch(`${API_BASE}/communication/unread-count`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ unread_count: number }>(res);
  },

  // Faculty Attendance & HR
  async punchFacultyAttendance(data: {
    action: 'CHECK_IN' | 'CHECK_OUT' | 'MARK_TODAY';
    status?: string;
    work_mode?: string;
    work_summary?: string;
    location_or_cabin?: string;
    date?: string;
    custom_time?: string;
  }) {
    const res = await fetch(`${API_BASE}/faculty-hr/punch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<FacultyAttendanceRecord>(res);
  },

  async getFacultyHRSummary() {
    const res = await fetch(`${API_BASE}/faculty-hr/my-summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<FacultyHRSummary>(res);
  },

  async getFacultyAttendanceLogs(month?: string) {
    const url = month ? `${API_BASE}/faculty-hr/my-logs?month=${month}` : `${API_BASE}/faculty-hr/my-logs`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<FacultyAttendanceRecord[]>(res);
  },

  async applyFacultyLeave(data: {
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
  }) {
    const res = await fetch(`${API_BASE}/faculty-hr/leave/apply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<FacultyLeaveRecord>(res);
  },

  async getFacultyLeaves() {
    const res = await fetch(`${API_BASE}/faculty-hr/my-leaves`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<FacultyLeaveRecord[]>(res);
  },

  async cancelFacultyLeave(leaveId: number) {
    const res = await fetch(`${API_BASE}/faculty-hr/leave/${leaveId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async getAdminFacultyHROverview(date?: string) {
    const url = date ? `${API_BASE}/faculty-hr/admin/overview?date=${date}` : `${API_BASE}/faculty-hr/admin/overview`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminFacultyHROverview>(res);
  },

  async adminOverrideFacultyAttendance(data: {
    faculty_id: number;
    date: string;
    status: string;
    check_in_time?: string;
    check_out_time?: string;
    work_mode?: string;
    working_hours?: number;
    remarks?: string;
    work_summary?: string;
  }) {
    const res = await fetch(`${API_BASE}/faculty-hr/admin/override-attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<FacultyAttendanceRecord>(res);
  },

  async adminReviewFacultyLeave(leaveId: number, data: { status: 'APPROVED' | 'REJECTED'; admin_remarks?: string }) {
    const res = await fetch(`${API_BASE}/faculty-hr/admin/leave/${leaveId}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<FacultyLeaveRecord>(res);
  },

  // Gradebook & Course Assessments
  async getGradebookCourses() {
    const res = await fetch(`${API_BASE}/gradebook/courses`, { headers: getAuthHeaders() });
    return handleResponse<Course[]>(res);
  },

  async getCourseGradebook(courseId: number) {
    const res = await fetch(`${API_BASE}/gradebook/course/${courseId}`, { headers: getAuthHeaders() });
    return handleResponse<CourseGradebook>(res);
  },

  async createAssessment(data: {
    course_id: number;
    title: string;
    assessment_type?: string;
    max_marks?: number;
    weightage_percent?: number;
    date: string;
    description?: string;
  }) {
    const res = await fetch(`${API_BASE}/gradebook/assessment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Assessment>(res);
  },

  async deleteAssessment(id: number) {
    const res = await fetch(`${API_BASE}/gradebook/assessment/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; id: number }>(res);
  },

  async recordGrades(assessmentId: number, grades: { student_id: number; marks_obtained?: number | null; feedback?: string | null; status?: string }[]) {
    const res = await fetch(`${API_BASE}/gradebook/grades`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assessment_id: assessmentId, grades }),
    });
    return handleResponse<{ message: string; assessment_id: number }>(res);
  },

  async getMyGradeHistory() {
    const res = await fetch(`${API_BASE}/gradebook/my-grades`, { headers: getAuthHeaders() });
    return handleResponse<StudentGradeHistory>(res);
  },

  // Notification Center
  async getNotifications(limit = 25) {
    const res = await fetch(`${API_BASE}/notifications/?limit=${limit}`, { headers: getAuthHeaders() });
    return handleResponse<NotificationItem[]>(res);
  },

  async getUnreadNotificationCount() {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, { headers: getAuthHeaders() });
    return handleResponse<{ unread_count: number }>(res);
  },

  async markNotificationRead(id: number) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; id: number }>(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Unified Academic Calendar
  async getCalendarEvents(year?: number, month?: number, viewType?: string) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (viewType) params.append('view_type', viewType);
    const res = await fetch(`${API_BASE}/calendar/events?${params.toString()}`, { headers: getAuthHeaders() });
    return handleResponse<{ year: number; month: number; total_events: number; events: CalendarEvent[] }>(res);
  },

  async createCalendarEvent(data: {
    title: string;
    event_type: string;
    start_date: string;
    end_date: string;
    venue?: string;
    description?: string;
    department?: string;
    target_role?: string;
  }) {
    const res = await fetch(`${API_BASE}/calendar/event`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Admin Ecosystem Management
  async addFaculty(data: any) {
    const res = await fetch(`${API_BASE}/admin-management/faculty`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  async updateFaculty(facultyId: number, data: any) {
    const res = await fetch(`${API_BASE}/admin-management/faculty/${facultyId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  async getFacultyWorkloads() {
    const res = await fetch(`${API_BASE}/admin-management/faculty-workloads`, { headers: getAuthHeaders() });
    return handleResponse<FacultyWorkloadItem[]>(res);
  },

  async createCourse(data: {
    code: string;
    name: string;
    department: string;
    semester: number;
    credits?: number;
    faculty_id: number;
    section?: string;
    description?: string;
  }) {
    const res = await fetch(`${API_BASE}/admin-management/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Course>(res);
  },

  async updateCourse(courseId: number, data: any) {
    const res = await fetch(`${API_BASE}/admin-management/courses/${courseId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Course>(res);
  },

  async deleteCourse(courseId: number) {
    const res = await fetch(`${API_BASE}/admin-management/courses/${courseId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; id: number }>(res);
  },

  async enrollStudentInCourse(courseId: number, studentId: number) {
    const res = await fetch(`${API_BASE}/admin-management/courses/${courseId}/enroll-student?student_id=${studentId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async updateStudentRecord(studentId: number, data: any) {
    const res = await fetch(`${API_BASE}/admin-management/students/${studentId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  async getInstitutionalAnalytics() {
    const res = await fetch(`${API_BASE}/admin-management/institutional-analytics`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },

  // Smart Features & Insights
  async getAttendanceRisk() {
    const res = await fetch(`${API_BASE}/insights/attendance-risk`, { headers: getAuthHeaders() });
    return handleResponse<AttendanceRiskItem[]>(res);
  },

  async getFacultyRecommendations(subjectQuery?: string, department?: string) {
    const params = new URLSearchParams();
    if (subjectQuery) params.append('subject_query', subjectQuery);
    if (department && department !== 'All Departments') params.append('department', department);
    const res = await fetch(`${API_BASE}/insights/faculty-recommendations?${params.toString()}`, { headers: getAuthHeaders() });
    return handleResponse<FacultyRecommendationItem[]>(res);
  },

  async getPrioritizedDeadlines() {
    const res = await fetch(`${API_BASE}/insights/deadline-prioritization`, { headers: getAuthHeaders() });
    return handleResponse<{
      urgent: any[];
      approaching: any[];
      upcoming: any[];
      completed: any[];
      total_pending: number;
    }>(res);
  },

  async getFacultyActionCenter() {
    const res = await fetch(`${API_BASE}/insights/faculty-action-center`, { headers: getAuthHeaders() });
    return handleResponse<FacultyActionCenter>(res);
  },
};

