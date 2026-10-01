export type UserRole = 'student' | 'faculty' | 'admin';

export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'HIGH';

export type MeetingMode = 'CABIN' | 'ONLINE' | 'LAB';

export interface User {
  id: number;
  identifier: string; // Roll No or Faculty ID or Admin ID
  email: string;
  name: string;
  role: UserRole;
  department: string;
  designation?: string;
  cabin_room?: string;
  phone?: string;
  specialization?: string;
  avatar_url?: string;
  cgpa_or_experience?: string;
  semester?: number;
  status?: string;
  created_at?: string;
}

export interface Slot {
  id: number;
  faculty_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  venue: string;
  max_students: number;
  is_active: boolean;
}

export interface Appointment {
  id: number;
  appointment_code: string;
  student_id: number;
  faculty_id: number;
  slot_id?: number;
  date: string;
  time_slot: string;
  purpose_category: string;
  purpose_details: string;
  urgency: UrgencyLevel;
  meeting_mode: MeetingMode;
  status: AppointmentStatus;
  faculty_remarks?: string;
  cabin_or_link?: string;
  created_at?: string;
  updated_at?: string;
  student?: User;
  faculty?: User;
}

export interface Notice {
  id: number;
  title: string;
  category: 'ACADEMIC' | 'EXAM' | 'FACULTY' | 'URGENT';
  date: string;
  content: string;
  posted_by: string;
  is_pinned: boolean;
  created_at?: string;
}

export interface ERPStats {
  total_faculty: number;
  total_students: number;
  total_appointments: number;
  pending_appointments: number;
  approved_today: number;
  departments_count: number;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: number;
  credits: number;
  faculty_id: number;
  section?: string;
  description?: string;
  enrolled_count?: number;
  faculty?: User;
}

export interface ScheduleItem {
  id: number;
  user_id?: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  course_code: string;
  subject_name: string;
  venue: string;
  session_type: 'LECTURE' | 'LAB' | 'OFFICE_HOURS' | 'TUTORIAL';
  batch?: string;
  source?: 'TIMETABLE' | 'APPOINTMENT';
  appointment_code?: string;
  course_id?: number | null;
}

export interface TodayScheduleResponse {
  current_day: string;
  date: string;
  total_sessions: number;
  sessions: ScheduleItem[];
}

export interface AttendanceRecord {
  id: number;
  course_id: number;
  faculty_id: number;
  student_id: number;
  date: string;
  session_title: string;
  time_slot?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  remarks?: string;
  marked_at?: string;
  student?: User;
  course?: Course;
}

export interface AttendanceStudentRosterItem {
  student_id: number;
  identifier: string;
  name: string;
  avatar_url?: string;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  current_status: 'PRESENT' | 'ABSENT' | 'LATE';
  remarks?: string;
}

export interface AttendanceSubjectSummary {
  course_id: number;
  course_code: string;
  course_name: string;
  faculty_name: string;
  total_held: number;
  attended: number;
  percentage: number;
  shortage_warning: boolean;
  margin_classes_needed: number;
}

export interface StudentAttendanceSummary {
  overall_percentage: number;
  total_conducted: number;
  total_attended: number;
  status_standing: 'ELIGIBLE' | 'SHORTAGE_DETENTION_RISK' | 'BORDERLINE';
  subjects: AttendanceSubjectSummary[];
  recent_records: AttendanceRecord[];
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  submission_text?: string;
  attachment_name?: string;
  attachment_url?: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
  marks_awarded?: number;
  faculty_feedback?: string;
  submitted_at?: string;
  graded_at?: string;
  student?: User;
}

export interface Assignment {
  id: number;
  course_id: number;
  faculty_id: number;
  title: string;
  description: string;
  due_date: string;
  total_marks: number;
  submission_format: string;
  attachment_hint?: string;
  created_at?: string;
  course?: Course;
  faculty?: User;
  submissions_count?: number;
  my_submission?: Submission | null;
}

export interface CommunicationMessage {
  id: number;
  sender_id: number;
  receiver_id?: number;
  course_id?: number;
  subject: string;
  content: string;
  message_type: 'DIRECT_QUERY' | 'ANNOUNCEMENT' | 'DOUBT_CLEARANCE';
  parent_id?: number;
  is_read: boolean;
  created_at?: string;
  sender?: User;
  receiver?: User;
  course?: Course;
  replies_count?: number;
}

export interface ThreadDetail {
  parent: CommunicationMessage;
  replies: CommunicationMessage[];
}

export type FacultyAttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'ON_LEAVE' | 'ON_DUTY' | 'ABSENT';
export type FacultyWorkMode = 'IN_CAMPUS' | 'WORK_FROM_HOME' | 'FIELD_DUTY' | 'CONFERENCE';
export type FacultyLeaveType = 'CASUAL_LEAVE' | 'MEDICAL_LEAVE' | 'EARNED_LEAVE' | 'DUTY_LEAVE_OD' | 'ACADEMIC_LEAVE';
export type FacultyLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface FacultyAttendanceRecord {
  id: number;
  faculty_id: number;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: FacultyAttendanceStatus;
  work_mode: FacultyWorkMode;
  location_or_cabin?: string;
  work_summary?: string;
  working_hours: number;
  is_regularized: boolean;
  marked_by_admin: boolean;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  faculty?: User;
}

export interface FacultyLeaveRecord {
  id: number;
  faculty_id: number;
  leave_type: FacultyLeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: FacultyLeaveStatus;
  applied_at?: string;
  reviewed_by?: number;
  admin_remarks?: string;
  reviewed_at?: string;
  faculty?: User;
  reviewer?: User;
}

export interface LeaveBalanceCategory {
  total: number;
  used: number;
  remaining: number;
}

export interface FacultyHRSummary {
  today_record?: FacultyAttendanceRecord | null;
  attendance_percentage: number;
  total_working_days: number;
  present_days: number;
  half_days: number;
  leaves_taken: number;
  od_days: number;
  total_hours_worked: number;
  avg_daily_hours: number;
  leave_balances: {
    casual: LeaveBalanceCategory;
    medical: LeaveBalanceCategory;
    earned: LeaveBalanceCategory;
    duty: LeaveBalanceCategory;
  };
  recent_punches: FacultyAttendanceRecord[];
  recent_leaves: FacultyLeaveRecord[];
}

export interface AdminFacultyAttendanceItem {
  faculty: User;
  attendance?: FacultyAttendanceRecord | null;
  month_percentage: number;
  month_present_days: number;
  month_total_hours: number;
  pending_leaves_count: number;
}

export interface AdminFacultyHROverview {
  date: string;
  total_faculty: number;
  present_today: number;
  half_day_today: number;
  on_leave_today: number;
  on_duty_today: number;
  unmarked_today: number;
  attendance_rate: number;
  faculty_records: AdminFacultyAttendanceItem[];
  pending_leaves: FacultyLeaveRecord[];
}

export interface Assessment {
  id: number;
  course_id: number;
  faculty_id: number;
  title: string;
  assessment_type: 'ASSIGNMENT' | 'QUIZ' | 'MID_TERM' | 'FINAL_EXAM' | 'LAB_VIVA' | 'PROJECT';
  max_marks: number;
  weightage_percent: number;
  date: string;
  description?: string;
  created_at?: string;
  course?: Course;
  faculty?: User;
  grades_count?: number;
  average_marks?: number;
}

export interface GradeEntryItem {
  student_id: number;
  marks_obtained?: number | null;
  letter_grade?: string | null;
  feedback?: string | null;
  status?: string;
}

export interface GradeRecord {
  id: number;
  assessment_id: number;
  student_id: number;
  marks_obtained?: number | null;
  letter_grade?: string | null;
  percentage?: number | null;
  feedback?: string | null;
  status: string;
  graded_at?: string;
  student?: User;
  assessment?: Assessment;
}

export interface GradebookStudentRow {
  student: User;
  grades: Record<string, {
    marks_obtained?: number | null;
    letter_grade?: string | null;
    percentage?: number | null;
    feedback?: string | null;
    status: string;
  }>;
  total_obtained: number;
  total_possible: number;
  percentage: number;
  final_grade: string;
}

export interface CourseGradebook {
  course: Course;
  assessments: Assessment[];
  students: GradebookStudentRow[];
  class_average: number;
  highest_percentage: number;
  lowest_percentage: number;
  grade_distribution: Record<string, number>;
}

export interface StudentCourseGradeItem {
  assessment_id: number;
  title: string;
  assessment_type: string;
  max_marks: number;
  weightage_percent: number;
  date: string;
  marks_obtained?: number | null;
  letter_grade?: string | null;
  percentage?: number | null;
  feedback?: string | null;
  status: string;
}

export interface StudentCourseGradeSummary {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  faculty_name: string;
  weighted_percentage: number;
  overall_letter_grade: string;
  assessments: StudentCourseGradeItem[];
}

export interface StudentGradeHistory {
  student: User;
  cumulative_gpa: number;
  total_credits: number;
  courses: StudentCourseGradeSummary[];
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  category: 'APPOINTMENT' | 'ATTENDANCE_WARNING' | 'ASSIGNMENT' | 'GRADE' | 'COMMUNICATION' | 'SYSTEM';
  link_tab?: string;
  is_read: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  color: string;
  date: string;
  start_time: string;
  end_time: string;
  venue?: string;
  description?: string;
  category: 'CLASS' | 'APPOINTMENT' | 'DEADLINE' | 'ASSESSMENT' | 'INSTITUTIONAL';
}

export interface FacultyWorkloadItem {
  faculty_id: number;
  faculty_name: string;
  identifier: string;
  department: string;
  designation?: string;
  cabin_room?: string;
  avatar_url?: string;
  weekly_classes_count: number;
  weekly_teaching_hours: number;
  total_students_enrolled: number;
  active_courses_count: number;
  pending_assignments_to_grade: number;
  pending_appointment_requests: number;
  unread_messages_count: number;
  workload_status: 'OPTIMAL' | 'MODERATE' | 'HEAVY' | 'OVERLOADED';
  workload_score: number;
}

export interface AttendanceRiskItem {
  course_id: number;
  course_code: string;
  course_name: string;
  faculty_name: string;
  current_percentage: number;
  held_classes: number;
  attended_classes: number;
  classes_needed_for_75: number;
  classes_can_miss: number;
  risk_level: 'CRITICAL_DETENTION' | 'BORDERLINE_WARNING' | 'HEALTHY';
}

export interface FacultyRecommendationItem {
  faculty_id: number;
  name: string;
  identifier: string;
  department: string;
  designation?: string;
  cabin_room?: string;
  specialization?: string;
  avatar_url?: string;
  available_slots_count: number;
  workload_status: string;
  match_reason: string;
}

export interface FacultyActionCenter {
  pending_grading_count: number;
  pending_appointments_count: number;
  unread_doubts_count: number;
  today_classes_count: number;
  attendance_pending_classes_count: number;
  students_below_threshold_count: number;
  today_attendance_schedule: Array<{
    schedule_id: number;
    course_id: number | null;
    course_code: string;
    subject_name: string;
    time_slot: string;
    venue: string;
    batch?: string;
    is_attendance_marked: boolean;
  }>;
  students_below_threshold: Array<{
    student_id: number;
    student_name: string;
    roll_no: string;
    course_code: string;
    course_name: string;
    percentage: number;
    held: number;
    attended: number;
  }>;
  pending_appointments: Array<{
    id: number;
    appointment_code: string;
    student_name: string;
    roll_no: string;
    date: string;
    time_slot: string;
    purpose_category: string;
    urgency: string;
  }>;
  workload?: {
    weekly_classes: number;
    weekly_hours: number;
    active_courses: number;
    enrolled_students: number;
    workload_status: string;
    workload_score: number;
  };
}



