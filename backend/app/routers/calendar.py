from typing import List, Optional, Dict, Any
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, ScheduleItem, Appointment, Assignment, Assessment, AcademicEvent, Course, CourseEnrollment
from ..schemas import AcademicEventCreate, AcademicEventResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/calendar", tags=["Unified Academic Calendar"])

DAYS_MAP = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday",
}

@router.get("/events")
def get_calendar_events(
    year: Optional[int] = None,
    month: Optional[int] = None, # 1-12
    view_type: Optional[str] = "MONTH", # "DAY", "WEEK", "MONTH"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.datetime.now()
    target_year = year or now.year
    target_month = month or now.month

    # Generate dates for target month
    # We will aggregate:
    # 1. Weekly Schedule Classes (projected onto actual dates of this month)
    # 2. Approved Appointments
    # 3. Assignment Deadlines
    # 4. Course Assessments & Exams
    # 5. Institutional Academic Events

    events = []

    # 1. Institutional Academic Events
    query_events = db.query(AcademicEvent)
    if current_user.role != "admin":
        query_events = query_events.filter(AcademicEvent.target_role.in_(["ALL", current_user.role.upper()]))
    
    academic_events = query_events.all()
    for ae in academic_events:
        events.append({
            "id": f"event_{ae.id}",
            "title": ae.title,
            "type": ae.event_type, # "EXAM", "HOLIDAY", "SEMINAR", "DEADLINE", "MEETING", "INSTITUTIONAL"
            "color": "indigo" if ae.event_type == "INSTITUTIONAL" else ("emerald" if ae.event_type == "HOLIDAY" else "rose"),
            "date": ae.start_date.split(" ")[0] if " " in ae.start_date else ae.start_date,
            "start_time": "09:00 AM",
            "end_time": "05:00 PM",
            "venue": ae.venue or "Campus Wide",
            "description": ae.description,
            "category": "INSTITUTIONAL"
        })

    # If no academic events exist yet, seed a few standard university calendar items
    if not academic_events:
        m_str = f"{target_year}-{target_month:02d}"
        seed_events = [
            AcademicEvent(
                title="Mid-Semester Examination Week",
                event_type="EXAM",
                start_date=f"{m_str}-15",
                end_date=f"{m_str}-20",
                venue="Examination Hall Complex",
                description="Central university mid-semester theoretical and practical evaluations.",
                target_role="ALL"
            ),
            AcademicEvent(
                title="Department Research Colloquium & Paper Presentation",
                event_type="SEMINAR",
                start_date=f"{m_str}-24",
                end_date=f"{m_str}-24",
                venue="Main Auditorium, Block-B",
                description="Invited keynote lectures by IEEE Fellows and postgraduate research showcases.",
                target_role="ALL"
            ),
            AcademicEvent(
                title="Academic Advisory Council Faculty Meeting",
                event_type="MEETING",
                start_date=f"{m_str}-28",
                end_date=f"{m_str}-28",
                venue="Senate Hall, Admin Block",
                description="Curriculum review and student academic performance review with Dean.",
                target_role="FACULTY"
            )
        ]
        db.add_all(seed_events)
        db.commit()
        for ae in seed_events:
            events.append({
                "id": f"event_{ae.id}",
                "title": ae.title,
                "type": ae.event_type,
                "color": "rose" if ae.event_type == "EXAM" else "indigo",
                "date": ae.start_date,
                "start_time": "10:00 AM",
                "end_time": "04:00 PM",
                "venue": ae.venue,
                "description": ae.description,
                "category": "INSTITUTIONAL"
            })

    # 2. Approved Appointments
    app_query = db.query(Appointment).filter(Appointment.status == "APPROVED")
    if current_user.role == "faculty":
        app_query = app_query.filter(Appointment.faculty_id == current_user.id)
    elif current_user.role == "student":
        app_query = app_query.filter(Appointment.student_id == current_user.id)

    approved_apps = app_query.all()
    for app in approved_apps:
        other_name = app.student.name if current_user.role == "faculty" else app.faculty.name
        events.append({
            "id": f"app_{app.id}",
            "title": f"Consultation: {other_name} ({app.purpose_category})",
            "type": "APPOINTMENT",
            "color": "emerald",
            "date": app.date,
            "start_time": app.time_slot.split("-")[0].strip() if "-" in app.time_slot else app.time_slot,
            "end_time": app.time_slot.split("-")[1].strip() if "-" in app.time_slot else "",
            "venue": app.cabin_or_link or "Faculty Cabin",
            "description": app.purpose_details,
            "category": "APPOINTMENT"
        })

    # 3. Assignment Deadlines
    assign_query = db.query(Assignment)
    if current_user.role == "faculty":
        assign_query = assign_query.filter(Assignment.faculty_id == current_user.id)
    elif current_user.role == "student":
        enrs = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
        c_ids = [e.course_id for e in enrs]
        assign_query = assign_query.filter(Assignment.course_id.in_(c_ids))

    assignments = assign_query.all()
    for ass in assignments:
        due_parts = ass.due_date.replace("T", " ").split(" ")
        d_date = due_parts[0]
        d_time = due_parts[1] if len(due_parts) > 1 else "11:59 PM"
        events.append({
            "id": f"assign_{ass.id}",
            "title": f"Deadline: {ass.title} ({ass.course.code})",
            "type": "DEADLINE",
            "color": "amber",
            "date": d_date,
            "start_time": d_time,
            "end_time": d_time,
            "venue": "ERP Portal Submission",
            "description": ass.description,
            "category": "DEADLINE"
        })

    # 4. Course Assessments
    ass_query = db.query(Assessment)
    if current_user.role == "faculty":
        ass_query = ass_query.filter(Assessment.faculty_id == current_user.id)
    elif current_user.role == "student":
        enrs = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
        c_ids = [e.course_id for e in enrs]
        ass_query = ass_query.filter(Assessment.course_id.in_(c_ids))

    assessments = ass_query.all()
    for a in assessments:
        events.append({
            "id": f"assess_{a.id}",
            "title": f"{a.assessment_type}: {a.title} ({a.course.code})",
            "type": "ASSESSMENT",
            "color": "rose",
            "date": a.date,
            "start_time": "10:00 AM",
            "end_time": "12:00 PM",
            "venue": a.course.name,
            "description": a.description,
            "category": "ASSESSMENT"
        })

    # 5. Weekly Schedule Classes projected onto the selected month
    # Get user's weekly timetable items
    schedules = db.query(ScheduleItem).filter(ScheduleItem.user_id == current_user.id).all()
    
    # Calculate days in this month
    try:
        start_of_month = datetime.date(target_year, target_month, 1)
        if target_month == 12:
            end_of_month = datetime.date(target_year + 1, 1, 1) - datetime.timedelta(days=1)
        else:
            end_of_month = datetime.date(target_year, target_month + 1, 1) - datetime.timedelta(days=1)
    except Exception:
        start_of_month = datetime.date.today().replace(day=1)
        end_of_month = (start_of_month + datetime.timedelta(days=31)).replace(day=1) - datetime.timedelta(days=1)

    cur_d = start_of_month
    while cur_d <= end_of_month:
        weekday_name = DAYS_MAP[cur_d.weekday()]
        day_str = cur_d.strftime("%Y-%m-%d")
        matching_sessions = [s for s in schedules if s.day_of_week.lower() == weekday_name.lower()]

        for sess in matching_sessions:
            is_lab = (sess.session_type or "").upper() == "LAB"
            events.append({
                "id": f"sched_{sess.id}_{day_str}",
                "title": f"{sess.course_code}: {sess.subject_name}",
                "type": sess.session_type or "LECTURE",
                "color": "purple" if is_lab else "sky",
                "date": day_str,
                "start_time": sess.start_time,
                "end_time": sess.end_time,
                "venue": sess.venue,
                "description": f"Section: {sess.batch or 'All'}",
                "category": "CLASS"
            })
        cur_d += datetime.timedelta(days=1)

    # Sort events by date and start_time
    events.sort(key=lambda x: (x["date"], x["start_time"]))

    return {
        "year": target_year,
        "month": target_month,
        "total_events": len(events),
        "events": events
    }

@router.post("/event", response_model=AcademicEventResponse)
def create_academic_event(
    req: AcademicEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin" and current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty and administrators can publish calendar events")

    evt = AcademicEvent(
        title=req.title,
        event_type=req.event_type or "INSTITUTIONAL",
        start_date=req.start_date,
        end_date=req.end_date,
        venue=req.venue or "Campus Wide",
        description=req.description,
        department=req.department or current_user.department,
        target_role=req.target_role or "ALL"
    )
    db.add(evt)
    db.commit()
    db.refresh(evt)
    return evt
