from typing import List, Optional, Dict, Any
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    User, Course, CourseEnrollment, ScheduleItem, AttendanceRecord,
    Assignment, Submission, Appointment, Slot
)
from ..schemas import (
    AttendanceRiskItem,
    FacultyRecommendationItem,
)
from ..auth import get_current_user

router = APIRouter(prefix="/api/insights", tags=["Intelligent ERP Academic Insights"])

@router.get("/attendance-risk", response_model=List[AttendanceRiskItem])
def get_attendance_risk_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Attendance risk analysis is available for students and administrators.")

    student_id = current_user.id
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == student_id).all()
    course_ids = [e.course_id for e in enrollments]
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
    if not courses:
        courses = db.query(Course).filter(Course.department == current_user.department).all()

    risk_list = []
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

        # Calculations:
        # Classes needed to reach 75%:
        # (attended + x) / (held + x) >= 0.75 => x >= 3*held - 4*attended
        classes_needed = 0
        classes_can_miss = 0

        if pct < 75.0:
            classes_needed = max(0, int(3 * held - 4 * attended))
            risk_level = "CRITICAL_DETENTION"
        elif pct <= 78.0:
            classes_needed = max(0, int(3 * held - 4 * attended))
            risk_level = "BORDERLINE_WARNING"
        else:
            # Classes student can safely miss:
            # attended / (held + m) >= 0.75 => m <= (4*attended - 3*held)/3
            classes_can_miss = max(0, int((4 * attended - 3 * held) / 3))
            risk_level = "HEALTHY"

        fac_name = c.faculty.name if c.faculty else "Faculty Assigned"
        risk_list.append(AttendanceRiskItem(
            course_id=c.id,
            course_code=c.code,
            course_name=c.name,
            faculty_name=fac_name,
            current_percentage=pct,
            held_classes=held,
            attended_classes=attended,
            classes_needed_for_75=classes_needed,
            classes_can_miss=classes_can_miss,
            risk_level=risk_level
        ))

    # Sort so critical risks appear first
    risk_list.sort(key=lambda x: (x.risk_level != "CRITICAL_DETENTION", x.current_percentage))
    return risk_list

@router.get("/faculty-recommendations", response_model=List[FacultyRecommendationItem])
def get_faculty_recommendations(
    subject_query: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "faculty")
    if department and department != "All Departments":
        query = query.filter(User.department == department)
    elif current_user.role == "student" and not department:
        # Default recommend within student's department or related
        query = query.filter(User.department == current_user.department)

    faculties = query.all()
    recommendations = []

    for f in faculties:
        # Check active office hours slots
        slots_count = db.query(Slot).filter(Slot.faculty_id == f.id, Slot.is_active == True).count()

        # Workload calculation
        classes_count = db.query(ScheduleItem).filter(ScheduleItem.user_id == f.id).count()
        pending_grades = db.query(Submission).join(Assignment).filter(
            Assignment.faculty_id == f.id,
            Submission.status.in_(["SUBMITTED", "LATE"])
        ).count()

        score = (classes_count * 1.5) + (pending_grades * 1.2)
        if score > 25:
            workload_status = "BUSY"
        elif score > 15:
            workload_status = "MODERATE"
        else:
            workload_status = "AVAILABLE"

        match_reason = f"Specialist in {f.specialization or f.department} with {slots_count} active weekly consultation slots."
        if subject_query and subject_query.lower() in (f.specialization or "").lower():
            match_reason = f"Direct match for research interest '{subject_query}'. Active cabin hours available."

        recommendations.append(FacultyRecommendationItem(
            faculty_id=f.id,
            name=f.name,
            identifier=f.identifier,
            department=f.department,
            designation=f.designation,
            cabin_room=f.cabin_room,
            specialization=f.specialization,
            avatar_url=f.avatar_url,
            available_slots_count=slots_count,
            workload_status=workload_status,
            match_reason=match_reason
        ))

    # Sort available and slot-rich faculty first
    recommendations.sort(key=lambda x: (x.workload_status == "BUSY", -x.available_slots_count))
    return recommendations

@router.get("/deadline-prioritization")
def get_prioritized_deadlines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Deadline prioritization is for student accounts.")

    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
    c_ids = [e.course_id for e in enrollments]

    assignments = db.query(Assignment).filter(Assignment.course_id.in_(c_ids)).all()
    now = datetime.datetime.now()

    urgent_list = []
    approaching_list = []
    upcoming_list = []
    completed_list = []

    for a in assignments:
        sub = db.query(Submission).filter(
            Submission.assignment_id == a.id,
            Submission.student_id == current_user.id
        ).first()

        is_completed = sub is not None
        due_str = a.due_date.replace("T", " ")

        time_remaining_str = ""
        hours_remaining = 999.0
        try:
            due_dt = datetime.datetime.strptime(due_str, "%Y-%m-%d %H:%M")
            diff = due_dt - now
            hours_remaining = diff.total_seconds() / 3600.0
            if diff.total_seconds() < 0:
                time_remaining_str = "Overdue"
            elif hours_remaining < 24:
                time_remaining_str = f"{int(hours_remaining)} hours left"
            else:
                days = int(hours_remaining / 24)
                time_remaining_str = f"{days} days left"
        except Exception:
            time_remaining_str = a.due_date

        item = {
            "id": a.id,
            "title": a.title,
            "course_code": a.course.code,
            "course_name": a.course.name,
            "due_date": a.due_date,
            "total_marks": a.total_marks,
            "submission_format": a.submission_format,
            "time_remaining": time_remaining_str,
            "hours_remaining": hours_remaining,
            "is_submitted": is_completed,
            "status": sub.status if sub else ("OVERDUE" if hours_remaining < 0 else "PENDING"),
            "marks_awarded": sub.marks_awarded if sub else None
        }

        if is_completed:
            completed_list.append(item)
        elif hours_remaining < 24:
            item["urgency"] = "CRITICAL"
            urgent_list.append(item)
        elif hours_remaining <= 72:
            item["urgency"] = "HIGH"
            approaching_list.append(item)
        else:
            item["urgency"] = "NORMAL"
            upcoming_list.append(item)

    urgent_list.sort(key=lambda x: x["hours_remaining"])
    approaching_list.sort(key=lambda x: x["hours_remaining"])
    upcoming_list.sort(key=lambda x: x["hours_remaining"])

    return {
        "urgent": urgent_list,
        "approaching": approaching_list,
        "upcoming": upcoming_list,
        "completed": completed_list,
        "total_pending": len(urgent_list) + len(approaching_list) + len(upcoming_list)
    }

@router.get("/faculty-action-center")
def get_faculty_action_center(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Action center is for faculty accounts.")

    # 1. Pending Assignment Submissions awaiting grading
    pending_submissions = db.query(Submission).join(Assignment).filter(
        Assignment.faculty_id == current_user.id,
        Submission.status.in_(["SUBMITTED", "LATE"])
    ).all()

    # 2. Pending Appointment requests
    pending_apps = db.query(Appointment).filter(
        Appointment.faculty_id == current_user.id,
        Appointment.status == "PENDING"
    ).all()

    # 3. Unread Doubt messages
    from ..models import CommunicationMessage
    unread_doubts = db.query(CommunicationMessage).filter(
        CommunicationMessage.receiver_id == current_user.id,
        CommunicationMessage.is_read == False
    ).all()

    # 4. Today's attendance requirements
    today_weekday = datetime.datetime.now().strftime("%A")
    today_classes = db.query(ScheduleItem).filter(
        ScheduleItem.user_id == current_user.id,
        ScheduleItem.day_of_week == today_weekday
    ).all()

    today_date = datetime.date.today().strftime("%Y-%m-%d")
    classes_requiring_attendance = []
    course_map = {c.code.upper(): c for c in db.query(Course).all()}

    for cls in today_classes:
        c_obj = course_map.get(cls.course_code.upper().strip())
        is_marked = False
        if c_obj:
            is_marked = db.query(AttendanceRecord).filter(
                AttendanceRecord.course_id == c_obj.id,
                AttendanceRecord.date == today_date
            ).first() is not None

        classes_requiring_attendance.append({
            "schedule_id": cls.id,
            "course_id": c_obj.id if c_obj else None,
            "course_code": cls.course_code,
            "subject_name": cls.subject_name,
            "time_slot": f"{cls.start_time} - {cls.end_time}",
            "venue": cls.venue,
            "batch": cls.batch,
            "is_attendance_marked": is_marked
        })

    # 5. Students below attendance threshold across faculty courses
    courses = db.query(Course).filter(Course.faculty_id == current_user.id).all()
    c_ids = [c.id for c in courses]
    
    enrs = db.query(CourseEnrollment).filter(CourseEnrollment.course_id.in_(c_ids)).all()
    students_below_75 = []
    checked = set()

    for e in enrs:
        key = (e.course_id, e.student_id)
        if key in checked:
            continue
        checked.add(key)

        held = db.query(AttendanceRecord).filter(
            AttendanceRecord.course_id == e.course_id,
            AttendanceRecord.student_id == e.student_id
        ).count()
        attended = db.query(AttendanceRecord).filter(
            AttendanceRecord.course_id == e.course_id,
            AttendanceRecord.student_id == e.student_id,
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).count()

        pct = round((attended / held) * 100, 1) if held > 0 else 100.0
        if pct < 75.0:
            c = next((c for c in courses if c.id == e.course_id), None)
            st = db.query(User).filter(User.id == e.student_id).first()
            if c and st:
                students_below_75.append({
                    "student_id": st.id,
                    "student_name": st.name,
                    "roll_no": st.identifier,
                    "course_code": c.code,
                    "course_name": c.name,
                    "percentage": pct,
                    "held": held,
                    "attended": attended
                })

    # 6. Teaching Workload calculation for faculty self-view
    all_schedules = db.query(ScheduleItem).filter(ScheduleItem.user_id == current_user.id).all()
    weekly_hours = 0.0
    for s in all_schedules:
        if (s.session_type or "").upper() == "LAB":
            weekly_hours += 2.0
        else:
            weekly_hours += 1.0

    enrolled_student_count = db.query(CourseEnrollment).filter(CourseEnrollment.course_id.in_(c_ids)).count() if c_ids else 0
    workload_score = len(all_schedules) * 1.5 + len(pending_submissions) * 1.0 + (len(c_ids) * 2.0)
    if workload_score > 25:
        workload_status = "HEAVY"
    elif workload_score > 12:
        workload_status = "OPTIMAL"
    else:
        workload_status = "LIGHT"

    workload_summary = {
        "weekly_classes": len(all_schedules),
        "weekly_hours": weekly_hours,
        "active_courses": len(courses),
        "enrolled_students": enrolled_student_count,
        "workload_status": workload_status,
        "workload_score": round(workload_score, 1)
    }

    return {
        "pending_grading_count": len(pending_submissions),
        "pending_appointments_count": len(pending_apps),
        "unread_doubts_count": len(unread_doubts),
        "today_classes_count": len(today_classes),
        "attendance_pending_classes_count": len([c for c in classes_requiring_attendance if not c["is_attendance_marked"]]),
        "students_below_threshold_count": len(students_below_75),
        "today_attendance_schedule": classes_requiring_attendance,
        "students_below_threshold": students_below_75[:10],
        "workload": workload_summary,
        "pending_appointments": [{
            "id": a.id,
            "appointment_code": a.appointment_code,
            "student_name": a.student.name,
            "roll_no": a.student.identifier,
            "date": a.date,
            "time_slot": a.time_slot,
            "purpose_category": a.purpose_category,
            "urgency": a.urgency
        } for a in pending_apps[:5]]
    }
