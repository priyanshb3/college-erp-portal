import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(50), unique=True, index=True) # Roll No (e.g. 22CS104) or Faculty ID (FAC-CS-042) or Admin (ADMIN-01)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False) # "student", "faculty", "admin"
    department = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=True) # e.g. "Professor & Head of Dept" or "B.Tech CSE - 5th Sem"
    cabin_room = Column(String(100), nullable=True) # e.g. "Cabin 304, Block-B"
    phone = Column(String(20), nullable=True)
    specialization = Column(String(255), nullable=True) # e.g. "Machine Learning, Distributed Systems"
    avatar_url = Column(String(255), nullable=True)
    cgpa_or_experience = Column(String(50), nullable=True) # "8.92 CGPA" or "15+ Years Exp"
    semester = Column(Integer, nullable=True) # For students (1-8)
    status = Column(String(20), default="ACTIVE") # "ACTIVE", "ON_LEAVE", "INACTIVE"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    slots = relationship("Slot", back_populates="faculty", cascade="all, delete-orphan", foreign_keys="Slot.faculty_id")
    student_appointments = relationship("Appointment", back_populates="student", foreign_keys="Appointment.student_id")
    faculty_appointments = relationship("Appointment", back_populates="faculty", foreign_keys="Appointment.faculty_id")


class Slot(Base):
    __tablename__ = "slots"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday, etc.
    start_time = Column(String(20), nullable=False) # "10:00 AM"
    end_time = Column(String(20), nullable=False) # "11:00 AM"
    venue = Column(String(100), default="Faculty Cabin")
    max_students = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)

    faculty = relationship("User", back_populates="slots", foreign_keys=[faculty_id])
    appointments = relationship("Appointment", back_populates="slot")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_code = Column(String(30), unique=True, index=True) # e.g. "APP-2026-8921"
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("slots.id"), nullable=True)
    
    date = Column(String(20), nullable=False) # YYYY-MM-DD
    time_slot = Column(String(50), nullable=False) # "10:00 AM - 10:30 AM"
    purpose_category = Column(String(100), nullable=False) # "Project Guidance", "Doubt Clarification", etc.
    purpose_details = Column(Text, nullable=False)
    urgency = Column(String(20), default="NORMAL") # "NORMAL", "URGENT", "HIGH"
    meeting_mode = Column(String(20), default="CABIN") # "CABIN", "ONLINE", "LAB"
    status = Column(String(20), default="PENDING") # "PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"
    faculty_remarks = Column(Text, nullable=True)
    cabin_or_link = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("User", back_populates="student_appointments", foreign_keys=[student_id])
    faculty = relationship("User", back_populates="faculty_appointments", foreign_keys=[faculty_id])
    slot = relationship("Slot", back_populates="appointments")


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), default="ACADEMIC") # "ACADEMIC", "EXAM", "FACULTY", "URGENT"
    date = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    posted_by = Column(String(100), default="Dean Office / ERP Admin")
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True) # e.g. "CS501"
    name = Column(String(150), nullable=False) # e.g. "Advanced Operating Systems"
    department = Column(String(100), nullable=False)
    semester = Column(Integer, nullable=False) # 6
    credits = Column(Integer, default=4)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    section = Column(String(20), default="Sec-A")
    description = Column(Text, nullable=True)

    faculty = relationship("User", foreign_keys=[faculty_id])
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="course", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="course", cascade="all, delete-orphan")


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="enrollments")
    student = relationship("User", foreign_keys=[student_id])


class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # faculty or student
    day_of_week = Column(String(20), nullable=False) # "Monday", "Tuesday", etc.
    start_time = Column(String(20), nullable=False) # "09:00 AM"
    end_time = Column(String(20), nullable=False) # "10:00 AM"
    course_code = Column(String(20), nullable=False) # "CS501"
    subject_name = Column(String(150), nullable=False) # "Operating Systems"
    venue = Column(String(100), nullable=False) # "LH-204"
    session_type = Column(String(30), default="LECTURE") # "LECTURE", "LAB", "OFFICE_HOURS", "TUTORIAL"
    batch = Column(String(50), nullable=True) # "B.Tech CSE - Sec A"

    user = relationship("User", foreign_keys=[user_id])


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(20), nullable=False) # YYYY-MM-DD
    session_title = Column(String(150), default="Regular Lecture")
    time_slot = Column(String(50), nullable=True) # "09:00 AM - 10:00 AM"
    status = Column(String(20), nullable=False) # "PRESENT", "ABSENT", "LATE"
    remarks = Column(String(255), nullable=True)
    marked_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="attendance_records")
    faculty = relationship("User", foreign_keys=[faculty_id])
    student = relationship("User", foreign_keys=[student_id])


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(String(30), nullable=False) # YYYY-MM-DD HH:MM
    total_marks = Column(Integer, default=50)
    submission_format = Column(String(100), default="PDF / Zip / GitHub Link")
    attachment_hint = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="assignments")
    faculty = relationship("User", foreign_keys=[faculty_id])
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submission_text = Column(Text, nullable=True)
    attachment_name = Column(String(255), nullable=True)
    attachment_url = Column(String(255), nullable=True)
    status = Column(String(20), default="SUBMITTED") # "SUBMITTED", "GRADED", "LATE"
    marks_awarded = Column(Integer, nullable=True)
    faculty_feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    graded_at = Column(DateTime, nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])


class CommunicationMessage(Base):
    __tablename__ = "communication_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Null if broadcast
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    subject = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(30), default="DIRECT_QUERY") # "DIRECT_QUERY", "ANNOUNCEMENT", "DOUBT_CLEARANCE"
    parent_id = Column(Integer, ForeignKey("communication_messages.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    course = relationship("Course", foreign_keys=[course_id])


class FacultyAttendance(Base):
    __tablename__ = "faculty_attendance"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    check_in_time = Column(String(30), nullable=True) # "08:55 AM"
    check_out_time = Column(String(30), nullable=True) # "05:15 PM"
    status = Column(String(30), default="PRESENT") # "PRESENT", "HALF_DAY", "ON_LEAVE", "ON_DUTY", "ABSENT"
    work_mode = Column(String(30), default="IN_CAMPUS") # "IN_CAMPUS", "WORK_FROM_HOME", "FIELD_DUTY", "CONFERENCE"
    location_or_cabin = Column(String(100), nullable=True)
    work_summary = Column(Text, nullable=True)
    working_hours = Column(Float, default=0.0)
    is_regularized = Column(Boolean, default=False)
    marked_by_admin = Column(Boolean, default=False)
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    faculty = relationship("User", foreign_keys=[faculty_id])


class FacultyLeave(Base):
    __tablename__ = "faculty_leaves"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_type = Column(String(50), nullable=False) # "CASUAL_LEAVE", "MEDICAL_LEAVE", "EARNED_LEAVE", "DUTY_LEAVE_OD", "ACADEMIC_LEAVE"
    start_date = Column(String(20), nullable=False) # YYYY-MM-DD
    end_date = Column(String(20), nullable=False) # YYYY-MM-DD
    total_days = Column(Float, default=1.0)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING") # "PENDING", "APPROVED", "REJECTED", "CANCELLED"
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_remarks = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    faculty = relationship("User", foreign_keys=[faculty_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    assessment_type = Column(String(50), default="ASSIGNMENT") # "ASSIGNMENT", "QUIZ", "MID_TERM", "FINAL_EXAM", "LAB_VIVA", "PROJECT"
    max_marks = Column(Float, default=100.0)
    weightage_percent = Column(Float, default=20.0)
    date = Column(String(30), nullable=False) # YYYY-MM-DD
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="assessments")
    faculty = relationship("User", foreign_keys=[faculty_id])
    grades = relationship("GradeRecord", back_populates="assessment", cascade="all, delete-orphan")


class GradeRecord(Base):
    __tablename__ = "grade_records"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    marks_obtained = Column(Float, nullable=True)
    letter_grade = Column(String(10), nullable=True) # "A+", "A", "B+", "B", "C", "F"
    percentage = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String(20), default="GRADED") # "GRADED", "PENDING", "EXEMPT", "ABSENT"
    graded_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="grades")
    student = relationship("User", foreign_keys=[student_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="SYSTEM") # "APPOINTMENT", "ATTENDANCE_WARNING", "ASSIGNMENT", "GRADE", "COMMUNICATION", "SYSTEM"
    link_tab = Column(String(50), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])


class AcademicEvent(Base):
    __tablename__ = "academic_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    event_type = Column(String(50), default="INSTITUTIONAL") # "EXAM", "HOLIDAY", "SEMINAR", "DEADLINE", "MEETING", "INSTITUTIONAL"
    start_date = Column(String(30), nullable=False) # YYYY-MM-DD
    end_date = Column(String(30), nullable=False)
    venue = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    department = Column(String(100), default="All Departments")
    target_role = Column(String(20), default="ALL") # "ALL", "FACULTY", "STUDENT"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)



