from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, Course, CourseEnrollment, AttendanceRecord
from ..schemas import (
    CourseResponse,
    AttendanceRecordResponse,
    AttendanceTakeRequest,
    AttendanceStudentRosterItem,
    StudentAttendanceSummaryResponse,
    AttendanceSubjectSummary,
)
from ..auth import get_current_user, get_current_active_faculty

router = APIRouter(prefix="/api/attendance", tags=["Attendance Management"])

@router.get("/courses", response_model=List[CourseResponse])
def get_attendance_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "faculty":
        return db.query(Course).filter(Course.faculty_id == current_user.id).all()
    elif current_user.role == "student":
        enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
        course_ids = [e.course_id for e in enrollments]
        return db.query(Course).filter(Course.id.in_(course_ids)).all()
    else: # admin
        return db.query(Course).all()

@router.get("/course/{course_id}/roster", response_model=List[AttendanceStudentRosterItem])
def get_course_roster_for_attendance(
    course_id: int,
    date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.course_id == course_id).all()
    student_ids = [e.student_id for e in enrollments]
    students = db.query(User).filter(User.id.in_(student_ids)).order_by(User.identifier.asc()).all()

    # If no enrollments exist yet, let's auto-enroll students of matching department and semester
    if not students:
        dept_students = db.query(User).filter(
            User.role == "student",
            User.department == course.department
        ).all()
        for s in dept_students:
            enr = CourseEnrollment(course_id=course_id, student_id=s.id)
            db.add(enr)
        db.commit()
        students = dept_students

    # Today's or query date's records if already recorded
    check_date = date or datetime.date.today().strftime("%Y-%m-%d")
    existing_records = {
        r.student_id: r
        for r in db.query(AttendanceRecord).filter(
            AttendanceRecord.course_id == course_id,
            AttendanceRecord.date == check_date
        ).all()
    }

    result = []
    for s in students:
        # Compute overall stats in this course
        total = db.query(AttendanceRecord).filter(
            AttendanceRecord.course_id == course_id,
            AttendanceRecord.student_id == s.id
        ).count()
        attended = db.query(AttendanceRecord).filter(
            AttendanceRecord.course_id == course_id,
            AttendanceRecord.student_id == s.id,
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).count()
        pct = round((attended / total) * 100, 1) if total > 0 else 100.0

        existing = existing_records.get(s.id)
        current_status = existing.status if existing else "PRESENT"
        remarks = existing.remarks if existing else None

        result.append(AttendanceStudentRosterItem(
            student_id=s.id,
            identifier=s.identifier,
            name=s.name,
            avatar_url=s.avatar_url,
            total_classes=total,
            attended_classes=attended,
            percentage=pct,
            current_status=current_status,
            remarks=remarks
        ))

    return result

@router.post("/take")
def take_attendance(
    req: AttendanceTakeRequest,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == req.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    saved_count = 0
    for item in req.records:
        # Check if record already exists for this date, course, student, and session
        existing = db.query(AttendanceRecord).filter(
            AttendanceRecord.course_id == req.course_id,
            AttendanceRecord.student_id == item.student_id,
            AttendanceRecord.date == req.date,
            AttendanceRecord.session_title == req.session_title
        ).first()

        if existing:
            existing.status = item.status
            existing.remarks = item.remarks
            existing.marked_at = datetime.datetime.utcnow()
        else:
            rec = AttendanceRecord(
                course_id=req.course_id,
                faculty_id=current_user.id,
                student_id=item.student_id,
                date=req.date,
                session_title=req.session_title,
                time_slot=req.time_slot,
                status=item.status,
                remarks=item.remarks
            )
            db.add(rec)
        saved_count += 1

    db.commit()
    return {
        "message": f"Attendance successfully saved for {saved_count} students.",
        "course_code": course.code,
        "date": req.date,
        "session_title": req.session_title
    }

@router.get("/course/{course_id}/history")
def get_course_attendance_history(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(
        AttendanceRecord.date,
        AttendanceRecord.session_title,
        AttendanceRecord.time_slot,
        func.count(AttendanceRecord.id).label("total_marked"),
        func.sum(func.case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label("present_count"),
        func.sum(func.case((AttendanceRecord.status == "ABSENT", 1), else_=0)).label("absent_count"),
        func.sum(func.case((AttendanceRecord.status == "LATE", 1), else_=0)).label("late_count")
    ).filter(
        AttendanceRecord.course_id == course_id
    ).group_by(
        AttendanceRecord.date, AttendanceRecord.session_title, AttendanceRecord.time_slot
    ).order_by(AttendanceRecord.date.desc()).all()

    history = []
    for r in records:
        tot = r.total_marked or 0
        pres = (r.present_count or 0) + (r.late_count or 0)
        pct = round((pres / tot) * 100, 1) if tot > 0 else 0.0
        history.append({
            "date": r.date,
            "session_title": r.session_title,
            "time_slot": r.time_slot,
            "total_students": tot,
            "present_count": r.present_count or 0,
            "absent_count": r.absent_count or 0,
            "late_count": r.late_count or 0,
            "attendance_percentage": pct
        })
    return history

@router.get("/my-summary", response_model=StudentAttendanceSummaryResponse)
def get_student_attendance_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only students can access this attendance summary")

    student_id = current_user.id

    # Get enrolled courses
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == student_id).all()
    course_ids = [e.course_id for e in enrollments]
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()

    if not courses:
        # Fallback to courses of the student's department
        courses = db.query(Course).filter(Course.department == current_user.department).all()

    subject_summaries = []
    total_conducted_all = 0
    total_attended_all = 0

    for c in courses:
        held = db.query(AttendanceRecord).filter(
            AttendanceRecord.course_id == c.id,
            AttendanceRecord.student_id == student_id
        ).count()

        attended = db.query(AttendanceRecord).filter(
            AttendanceRecord.course_id == c.id,
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).count()

        pct = round((attended / held) * 100, 1) if held > 0 else 100.0
        total_conducted_all += held
        total_attended_all += attended

        shortage = pct < 75.0
        # Calculate classes needed to reach 75%
        # Formula: (attended + x) / (held + x) >= 0.75 => x >= 3*held - 4*attended
        margin_needed = 0
        if shortage:
            margin_needed = max(0, int(3 * held - 4 * attended))

        faculty_name = c.faculty.name if c.faculty else "Faculty Assigned"

        subject_summaries.append(AttendanceSubjectSummary(
            course_id=c.id,
            course_code=c.code,
            course_name=c.name,
            faculty_name=faculty_name,
            total_held=held,
            attended=attended,
            percentage=pct,
            shortage_warning=shortage,
            margin_classes_needed=margin_needed
        ))

    overall_pct = round((total_attended_all / total_conducted_all) * 100, 1) if total_conducted_all > 0 else 100.0
    if overall_pct >= 78.0:
        standing = "ELIGIBLE"
    elif overall_pct >= 75.0:
        standing = "BORDERLINE"
    else:
        standing = "SHORTAGE_DETENTION_RISK"

    # Recent 10 attendance records
    recent_recs = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student_id
    ).order_by(AttendanceRecord.date.desc(), AttendanceRecord.id.desc()).limit(10).all()

    return StudentAttendanceSummaryResponse(
        overall_percentage=overall_pct,
        total_conducted=total_conducted_all,
        total_attended=total_attended_all,
        status_standing=standing,
        subjects=subject_summaries,
        recent_records=recent_recs
    )
