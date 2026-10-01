from typing import List, Optional, Dict, Any
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import (
    User, Course, CourseEnrollment, ScheduleItem, AttendanceRecord,
    Assignment, Submission, Appointment, Assessment, GradeRecord
)
from ..schemas import (
    UserResponse,
    UserCreate,
    CourseResponse,
    CourseCreate,
    CourseUpdate,
    FacultyWorkloadItem,
)
from ..auth import get_current_user, get_password_hash

router = APIRouter(prefix="/api/admin-management", tags=["Administrative Academic Ecosystem Control"])

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Administrative privileges required to perform this action.")
    return current_user

# ----------------- FACULTY MANAGEMENT -----------------

@router.post("/faculty", response_model=UserResponse)
def add_new_faculty(
    req: UserCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(
        (User.identifier == req.identifier.strip()) |
        (User.email == req.email.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Faculty ID or Email already exists in ERP registry.")

    new_faculty = User(
        identifier=req.identifier.strip(),
        email=req.email.strip(),
        hashed_password=get_password_hash(req.password),
        name=req.name,
        role="faculty",
        department=req.department,
        designation=req.designation or "Assistant Professor",
        cabin_room=req.cabin_room or "Academic Block",
        phone=req.phone,
        specialization=req.specialization,
        avatar_url=req.avatar_url or "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        cgpa_or_experience=req.cgpa_or_experience or "5+ Years Exp",
        status="ACTIVE"
    )
    db.add(new_faculty)
    db.commit()
    db.refresh(new_faculty)
    return new_faculty

@router.patch("/faculty/{faculty_id}", response_model=UserResponse)
def update_faculty(
    faculty_id: int,
    data: Dict[str, Any],
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    fac = db.query(User).filter(User.id == faculty_id, User.role == "faculty").first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")

    allowed_fields = ["name", "department", "designation", "cabin_room", "phone", "specialization", "status", "cgpa_or_experience"]
    for field in allowed_fields:
        if field in data and data[field] is not None:
            setattr(fac, field, data[field])

    db.commit()
    db.refresh(fac)
    return fac

@router.get("/faculty-workloads", response_model=List[FacultyWorkloadItem])
def get_all_faculty_workloads(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    faculties = db.query(User).filter(User.role == "faculty").order_by(User.name.asc()).all()
    results = []

    for f in faculties:
        # Weekly classes count
        schedules = db.query(ScheduleItem).filter(ScheduleItem.user_id == f.id).all()
        classes_count = len(schedules)

        # Estimate hours
        hours = 0.0
        for s in schedules:
            try:
                # e.g., 09:00 AM - 10:00 AM or 2-hour labs
                if (s.session_type or "").upper() == "LAB":
                    hours += 2.0
                else:
                    hours += 1.0
            except Exception:
                hours += 1.0

        # Assigned courses
        courses = db.query(Course).filter(Course.faculty_id == f.id).all()
        c_ids = [c.id for c in courses]

        # Enrolled students across courses
        enrolled_count = db.query(CourseEnrollment).filter(CourseEnrollment.course_id.in_(c_ids)).count() if c_ids else 0

        # Pending assignments to grade
        pending_grades = db.query(Submission).join(Assignment).filter(
            Assignment.faculty_id == f.id,
            Submission.status.in_(["SUBMITTED", "LATE"])
        ).count()

        # Pending appointments
        pending_apps = db.query(Appointment).filter(
            Appointment.faculty_id == f.id,
            Appointment.status == "PENDING"
        ).count()

        # Unread messages
        unread_msgs = 0 # general metric

        # Calculate Workload Status
        # Score formula: (teaching_hours * 2) + (pending_grades * 1.5) + (classes_count * 1)
        score = round((hours * 2.0) + (pending_grades * 1.5) + (classes_count * 1.0), 1)
        if score > 35:
            status_str = "OVERLOADED"
        elif score > 22:
            status_str = "HEAVY"
        elif score > 10:
            status_str = "OPTIMAL"
        else:
            status_str = "MODERATE"

        results.append(FacultyWorkloadItem(
            faculty_id=f.id,
            faculty_name=f.name,
            identifier=f.identifier,
            department=f.department,
            designation=f.designation,
            avatar_url=f.avatar_url,
            weekly_classes_count=classes_count,
            weekly_teaching_hours=round(hours, 1),
            total_students_enrolled=enrolled_count,
            active_courses_count=len(courses),
            pending_assignments_to_grade=pending_grades,
            pending_appointment_requests=pending_apps,
            unread_messages_count=unread_msgs,
            workload_status=status_str,
            workload_score=score
        ))

    return results

# ----------------- COURSE & SECTION MANAGEMENT -----------------

@router.post("/courses", response_model=CourseResponse)
def create_new_course(
    req: CourseCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Course).filter(Course.code == req.code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course Code already registered in curriculum.")

    fac = db.query(User).filter(User.id == req.faculty_id, User.role == "faculty").first()
    if not fac:
        raise HTTPException(status_code=404, detail="Assigned faculty member not found.")

    new_course = Course(
        code=req.code.strip().upper(),
        name=req.name.strip(),
        department=req.department,
        semester=req.semester,
        credits=req.credits or 4,
        faculty_id=req.faculty_id,
        section=req.section or "Sec-A",
        description=req.description
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.patch("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    req: CourseUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if req.code:
        course.code = req.code.strip().upper()
    if req.name:
        course.name = req.name.strip()
    if req.department:
        course.department = req.department
    if req.semester:
        course.semester = req.semester
    if req.credits:
        course.credits = req.credits
    if req.faculty_id:
        fac = db.query(User).filter(User.id == req.faculty_id, User.role == "faculty").first()
        if not fac:
            raise HTTPException(status_code=404, detail="Faculty member not found")
        course.faculty_id = req.faculty_id
    if req.section:
        course.section = req.section
    if req.description is not None:
        course.description = req.description

    db.commit()
    db.refresh(course)
    return course

@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return {"message": "Course removed from curriculum registry", "id": course_id}

@router.post("/courses/{course_id}/enroll-student")
def enroll_student_in_course(
    course_id: int,
    student_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.student_id == student_id
    ).first()
    if existing:
        return {"message": "Student already enrolled in this course.", "status": "ALREADY_ENROLLED"}

    enr = CourseEnrollment(course_id=course_id, student_id=student_id)
    db.add(enr)
    db.commit()
    return {"message": f"Successfully enrolled {student.name} ({student.identifier}) in {course.code}."}

# ----------------- STUDENT RECORD MANAGEMENT -----------------

@router.patch("/students/{student_id}", response_model=UserResponse)
def update_student_record(
    student_id: int,
    data: Dict[str, Any],
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    allowed = ["name", "department", "semester", "designation", "phone", "specialization", "cgpa_or_experience", "status"]
    for k in allowed:
        if k in data and data[k] is not None:
            setattr(student, k, data[k])

    db.commit()
    db.refresh(student)
    return student

# ----------------- INSTITUTIONAL ANALYTICS -----------------

@router.get("/institutional-analytics")
def get_institutional_analytics(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_faculty = db.query(User).filter(User.role == "faculty").count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_courses = db.query(Course).count()
    total_enrollments = db.query(CourseEnrollment).count()

    # Attendance health analysis across all students
    students = db.query(User).filter(User.role == "student").all()
    healthy_attendance = 0
    borderline_attendance = 0
    critical_attendance = 0

    for s in students:
        total_rec = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == s.id).count()
        attended = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == s.id,
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).count()
        pct = (attended / total_rec * 100) if total_rec > 0 else 85.0
        if pct >= 78.0:
            healthy_attendance += 1
        elif pct >= 75.0:
            borderline_attendance += 1
        else:
            critical_attendance += 1

    # Assignment Submission & Grading Completion Rate
    total_assignments = db.query(Assignment).count()
    total_submissions = db.query(Submission).count()
    graded_submissions = db.query(Submission).filter(Submission.status == "GRADED").count()
    pending_submissions = db.query(Submission).filter(Submission.status.in_(["SUBMITTED", "LATE"])).count()
    grading_completion_pct = round((graded_submissions / total_submissions * 100), 1) if total_submissions > 0 else 85.0

    # Appointment Stats
    total_appointments = db.query(Appointment).count()
    approved_appointments = db.query(Appointment).filter(Appointment.status == "APPROVED").count()
    completed_appointments = db.query(Appointment).filter(Appointment.status == "COMPLETED").count()
    pending_appointments = db.query(Appointment).filter(Appointment.status == "PENDING").count()

    # Assessments created & graded
    total_assessments = db.query(Assessment).count()
    total_grades_awarded = db.query(GradeRecord).filter(GradeRecord.marks_obtained != None).count()

    return {
        "summary": {
            "total_students": total_students,
            "total_faculty": total_faculty,
            "total_courses": total_courses,
            "total_enrollments": total_enrollments,
            "system_status": "All Departments Operational",
            "academic_session": "2026-27 (Odd Semester)"
        },
        "attendance_health": {
            "eligible_healthy_count": healthy_attendance,
            "borderline_count": borderline_attendance,
            "critical_risk_count": critical_attendance,
            "compliance_rate": round(((healthy_attendance + borderline_attendance) / max(total_students, 1)) * 100, 1)
        },
        "academics_and_grading": {
            "total_assignments": total_assignments,
            "total_submissions": total_submissions,
            "graded_submissions": graded_submissions,
            "pending_submissions": pending_submissions,
            "grading_completion_rate": grading_completion_pct,
            "total_assessments": total_assessments,
            "total_grades_awarded": total_grades_awarded
        },
        "consultations_and_appointments": {
            "total_appointments": total_appointments,
            "approved": approved_appointments,
            "completed": completed_appointments,
            "pending": pending_appointments
        }
    }
