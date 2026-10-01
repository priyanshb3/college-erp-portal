from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenData(BaseModel):
    identifier: Optional[str] = None
    role: Optional[str] = None

# Login Schema
class LoginRequest(BaseModel):
    identifier: str # Roll no, faculty ID, or email
    password: str
    role_hint: Optional[str] = None # "student", "faculty", "admin"

# User Schemas
class UserBase(BaseModel):
    identifier: str
    email: EmailStr
    name: str
    role: str
    department: str
    designation: Optional[str] = None
    cabin_room: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    avatar_url: Optional[str] = None
    cgpa_or_experience: Optional[str] = None
    semester: Optional[int] = None
    status: Optional[str] = "ACTIVE"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Slot Schemas
class SlotBase(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    venue: Optional[str] = "Faculty Cabin"
    max_students: Optional[int] = 3
    is_active: Optional[bool] = True

class SlotCreate(SlotBase):
    pass

class SlotResponse(SlotBase):
    id: int
    faculty_id: int

    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentCreate(BaseModel):
    faculty_id: int
    slot_id: Optional[int] = None
    date: str
    time_slot: str
    purpose_category: str
    purpose_details: str
    urgency: Optional[str] = "NORMAL"
    meeting_mode: Optional[str] = "CABIN"

class AppointmentStatusUpdate(BaseModel):
    status: str # APPROVED, REJECTED, COMPLETED, CANCELLED
    faculty_remarks: Optional[str] = None
    cabin_or_link: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    appointment_code: str
    student_id: int
    faculty_id: int
    slot_id: Optional[int] = None
    date: str
    time_slot: str
    purpose_category: str
    purpose_details: str
    urgency: str
    meeting_mode: str
    status: str
    faculty_remarks: Optional[str] = None
    cabin_or_link: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    student: Optional[UserResponse] = None
    faculty: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Notice Schemas
class NoticeResponse(BaseModel):
    id: int
    title: str
    category: str
    date: str
    content: str
    posted_by: str
    is_pinned: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ERP Stats Schemas
class ERPStats(BaseModel):
    total_faculty: int
    total_students: int
    total_appointments: int
    pending_appointments: int
    approved_today: int
    departments_count: int

# Course Schemas
class CourseCreate(BaseModel):
    code: str
    name: str
    department: str
    semester: int
    credits: Optional[int] = 4
    faculty_id: int
    section: Optional[str] = "Sec-A"
    description: Optional[str] = None

class CourseUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    credits: Optional[int] = None
    faculty_id: Optional[int] = None
    section: Optional[str] = None
    description: Optional[str] = None

class CourseResponse(BaseModel):
    id: int
    code: str
    name: str
    department: str
    semester: int
    credits: int
    faculty_id: int
    section: Optional[str] = "Sec-A"
    description: Optional[str] = None
    faculty: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Schedule Schemas
class ScheduleItemBase(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    course_code: str
    subject_name: str
    venue: str
    session_type: Optional[str] = "LECTURE"
    batch: Optional[str] = None

class ScheduleItemCreate(ScheduleItemBase):
    pass

class ScheduleItemResponse(ScheduleItemBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceRecordResponse(BaseModel):
    id: int
    course_id: int
    faculty_id: int
    student_id: int
    date: str
    session_title: str
    time_slot: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    marked_at: Optional[datetime] = None
    student: Optional[UserResponse] = None
    course: Optional[CourseResponse] = None

    class Config:
        from_attributes = True

class AttendanceTakeItem(BaseModel):
    student_id: int
    status: str # "PRESENT", "ABSENT", "LATE"
    remarks: Optional[str] = None

class AttendanceTakeRequest(BaseModel):
    course_id: int
    date: str
    session_title: str
    time_slot: Optional[str] = "09:00 AM - 10:00 AM"
    records: List[AttendanceTakeItem]

class AttendanceStudentRosterItem(BaseModel):
    student_id: int
    identifier: str
    name: str
    avatar_url: Optional[str] = None
    total_classes: int
    attended_classes: int
    percentage: float
    current_status: Optional[str] = "PRESENT"
    remarks: Optional[str] = None

class AttendanceSubjectSummary(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    faculty_name: str
    total_held: int
    attended: int
    percentage: float
    shortage_warning: bool
    margin_classes_needed: int

class StudentAttendanceSummaryResponse(BaseModel):
    overall_percentage: float
    total_conducted: int
    total_attended: int
    status_standing: str # "ELIGIBLE", "SHORTAGE_DETENTION_RISK", "BORDERLINE"
    subjects: List[AttendanceSubjectSummary]
    recent_records: List[AttendanceRecordResponse]

# Submission & Assignment Schemas
class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    submission_text: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_url: Optional[str] = None
    status: str
    marks_awarded: Optional[int] = None
    faculty_feedback: Optional[str] = None
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None
    student: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class AssignmentCreate(BaseModel):
    course_id: int
    title: str
    description: str
    due_date: str
    total_marks: Optional[int] = 50
    submission_format: Optional[str] = "PDF / Zip / GitHub Link"
    attachment_hint: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: int
    course_id: int
    faculty_id: int
    title: str
    description: str
    due_date: str
    total_marks: int
    submission_format: str
    attachment_hint: Optional[str] = None
    created_at: Optional[datetime] = None
    course: Optional[CourseResponse] = None
    faculty: Optional[UserResponse] = None
    submissions_count: Optional[int] = 0
    my_submission: Optional[SubmissionResponse] = None

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    submission_text: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_url: Optional[str] = None

class SubmissionGradeRequest(BaseModel):
    marks_awarded: int
    faculty_feedback: Optional[str] = None

# Communication Bridge Schemas
class MessageSendRequest(BaseModel):
    receiver_id: Optional[int] = None
    course_id: Optional[int] = None
    subject: str
    content: str
    message_type: Optional[str] = "DIRECT_QUERY"
    parent_id: Optional[int] = None

class BroadcastSendRequest(BaseModel):
    course_id: int
    subject: str
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: Optional[int] = None
    course_id: Optional[int] = None
    subject: str
    content: str
    message_type: str
    parent_id: Optional[int] = None
    is_read: bool
    created_at: Optional[datetime] = None
    sender: Optional[UserResponse] = None
    receiver: Optional[UserResponse] = None
    course: Optional[CourseResponse] = None
    replies_count: Optional[int] = 0


# Faculty Attendance & HR Schemas
class FacultyAttendancePunchRequest(BaseModel):
    action: str # "CHECK_IN", "CHECK_OUT", "MARK_TODAY"
    status: Optional[str] = "PRESENT" # "PRESENT", "HALF_DAY", "ON_LEAVE", "ON_DUTY", "ABSENT"
    work_mode: Optional[str] = "IN_CAMPUS" # "IN_CAMPUS", "WORK_FROM_HOME", "FIELD_DUTY", "CONFERENCE"
    work_summary: Optional[str] = None
    location_or_cabin: Optional[str] = None
    date: Optional[str] = None
    custom_time: Optional[str] = None

class FacultyAttendanceAdminUpdateRequest(BaseModel):
    faculty_id: int
    date: str
    status: str
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    work_mode: Optional[str] = "IN_CAMPUS"
    working_hours: Optional[float] = None
    remarks: Optional[str] = None
    work_summary: Optional[str] = None

class FacultyAttendanceResponse(BaseModel):
    id: int
    faculty_id: int
    date: str
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    status: str
    work_mode: str
    location_or_cabin: Optional[str] = None
    work_summary: Optional[str] = None
    working_hours: float = 0.0
    is_regularized: bool = False
    marked_by_admin: bool = False
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    faculty: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class FacultyLeaveApplyRequest(BaseModel):
    leave_type: str
    start_date: str
    end_date: str
    reason: str

class FacultyLeaveReviewRequest(BaseModel):
    status: str # "APPROVED" or "REJECTED"
    admin_remarks: Optional[str] = None

class FacultyLeaveResponse(BaseModel):
    id: int
    faculty_id: int
    leave_type: str
    start_date: str
    end_date: str
    total_days: float
    reason: str
    status: str
    applied_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    admin_remarks: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    faculty: Optional[UserResponse] = None
    reviewer: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class FacultyHRSummaryResponse(BaseModel):
    today_record: Optional[FacultyAttendanceResponse] = None
    attendance_percentage: float
    total_working_days: int
    present_days: int
    half_days: int
    leaves_taken: int
    od_days: int
    total_hours_worked: float
    avg_daily_hours: float
    leave_balances: Dict[str, Any]
    recent_punches: List[FacultyAttendanceResponse]
    recent_leaves: List[FacultyLeaveResponse]

class AdminFacultyAttendanceItem(BaseModel):
    faculty: UserResponse
    attendance: Optional[FacultyAttendanceResponse] = None
    month_percentage: float
    month_present_days: int
    month_total_hours: float
    pending_leaves_count: int

class AdminFacultyHROverviewResponse(BaseModel):
    date: str
    total_faculty: int
    present_today: int
    half_day_today: int
    on_leave_today: int
    on_duty_today: int
    unmarked_today: int
    attendance_rate: float
    faculty_records: List[AdminFacultyAttendanceItem]
    pending_leaves: List[FacultyLeaveResponse]

# Assessment & Gradebook Schemas
class AssessmentCreate(BaseModel):
    course_id: int
    title: str
    assessment_type: Optional[str] = "ASSIGNMENT" # "ASSIGNMENT", "QUIZ", "MID_TERM", "FINAL_EXAM", "LAB_VIVA", "PROJECT"
    max_marks: Optional[float] = 100.0
    weightage_percent: Optional[float] = 20.0
    date: str # YYYY-MM-DD
    description: Optional[str] = None

class AssessmentResponse(BaseModel):
    id: int
    course_id: int
    faculty_id: int
    title: str
    assessment_type: str
    max_marks: float
    weightage_percent: float
    date: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    course: Optional[CourseResponse] = None
    faculty: Optional[UserResponse] = None
    grades_count: Optional[int] = 0
    average_marks: Optional[float] = None

    class Config:
        from_attributes = True

class GradeEntryItem(BaseModel):
    student_id: int
    marks_obtained: Optional[float] = None
    letter_grade: Optional[str] = None
    feedback: Optional[str] = None
    status: Optional[str] = "GRADED"

class GradeBatchUpdateRequest(BaseModel):
    assessment_id: int
    grades: List[GradeEntryItem]

class GradeRecordResponse(BaseModel):
    id: int
    assessment_id: int
    student_id: int
    marks_obtained: Optional[float] = None
    letter_grade: Optional[str] = None
    percentage: Optional[float] = None
    feedback: Optional[str] = None
    status: str
    graded_at: Optional[datetime] = None
    student: Optional[UserResponse] = None
    assessment: Optional[AssessmentResponse] = None

    class Config:
        from_attributes = True

class StudentCourseGradeItem(BaseModel):
    assessment_id: int
    title: str
    assessment_type: str
    max_marks: float
    weightage_percent: float
    date: str
    marks_obtained: Optional[float] = None
    letter_grade: Optional[str] = None
    percentage: Optional[float] = None
    feedback: Optional[str] = None
    status: str

class StudentCourseGradeSummary(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    credits: int
    faculty_name: str
    weighted_percentage: float
    overall_letter_grade: str
    assessments: List[StudentCourseGradeItem]

class StudentGradeHistoryResponse(BaseModel):
    student: UserResponse
    cumulative_gpa: float
    total_credits: int
    courses: List[StudentCourseGradeSummary]

class GradebookStudentRow(BaseModel):
    student: UserResponse
    grades: Dict[str, Any]
    total_obtained: float
    total_possible: float
    percentage: float
    final_grade: str

class CourseGradebookResponse(BaseModel):
    course: CourseResponse
    assessments: List[AssessmentResponse]
    students: List[GradebookStudentRow]
    class_average: float
    highest_percentage: float
    lowest_percentage: float
    grade_distribution: Dict[str, int]

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    category: str
    link_tab: Optional[str] = None
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Academic Event Schemas
class AcademicEventCreate(BaseModel):
    title: str
    event_type: Optional[str] = "INSTITUTIONAL"
    start_date: str
    end_date: str
    venue: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = "All Departments"
    target_role: Optional[str] = "ALL"

class AcademicEventResponse(BaseModel):
    id: int
    title: str
    event_type: str
    start_date: str
    end_date: str
    venue: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = "All Departments"
    target_role: Optional[str] = "ALL"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Workload & Smart Insights Schemas
class FacultyWorkloadItem(BaseModel):
    faculty_id: int
    faculty_name: str
    identifier: str
    department: str
    designation: Optional[str] = None
    avatar_url: Optional[str] = None
    weekly_classes_count: int
    weekly_teaching_hours: float
    total_students_enrolled: int
    active_courses_count: int
    pending_assignments_to_grade: int
    pending_appointment_requests: int
    unread_messages_count: int
    workload_status: str # "OPTIMAL", "MODERATE", "HEAVY", "OVERLOADED"
    workload_score: float

class AttendanceRiskItem(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    faculty_name: str
    current_percentage: float
    held_classes: int
    attended_classes: int
    classes_needed_for_75: int
    classes_can_miss: int
    risk_level: str # "CRITICAL_DETENTION", "BORDERLINE_WARNING", "HEALTHY"

class FacultyRecommendationItem(BaseModel):
    faculty_id: int
    name: str
    identifier: str
    department: str
    designation: Optional[str] = None
    cabin_room: Optional[str] = None
    specialization: Optional[str] = None
    avatar_url: Optional[str] = None
    available_slots_count: int
    workload_status: str
    match_reason: str

Token.update_forward_refs()
AssessmentResponse.update_forward_refs()
GradeRecordResponse.update_forward_refs()
CourseResponse.update_forward_refs()


