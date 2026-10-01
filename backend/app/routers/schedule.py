from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, ScheduleItem, Appointment, Course
from ..schemas import ScheduleItemCreate, ScheduleItemResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/schedule", tags=["Daily Schedule & Timetable"])

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

@router.get("/my", response_model=List[ScheduleItemResponse])
def get_my_schedule(
    day_of_week: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ScheduleItem).filter(ScheduleItem.user_id == current_user.id)
    if day_of_week and day_of_week != "All":
        query = query.filter(ScheduleItem.day_of_week == day_of_week)
    return query.order_by(ScheduleItem.start_time.asc()).all()

@router.get("/today")
def get_today_schedule(
    day: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Determine today's day of week
    if not day or day == "Auto":
        today_weekday = datetime.datetime.now().weekday()
        current_day = DAYS[today_weekday] if today_weekday < len(DAYS) else "Monday"
    else:
        current_day = day

    # Fetch regular schedule items for this day
    items = db.query(ScheduleItem).filter(
        ScheduleItem.user_id == current_user.id,
        ScheduleItem.day_of_week == current_day
    ).order_by(ScheduleItem.start_time.asc()).all()

    # Look up courses to link course_id for 1-click attendance taking
    course_map = {c.code.upper(): c.id for c in db.query(Course).all()}

    combined = []
    for item in items:
        c_id = course_map.get(item.course_code.upper().strip(), None)
        combined.append({
            "id": item.id,
            "day_of_week": item.day_of_week,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "course_code": item.course_code,
            "subject_name": item.subject_name,
            "venue": item.venue,
            "session_type": item.session_type,
            "batch": item.batch,
            "source": "TIMETABLE",
            "course_id": c_id,
        })

    # Also check for approved appointments for today!
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    if current_user.role == "faculty":
        apps = db.query(Appointment).filter(
            Appointment.faculty_id == current_user.id,
            Appointment.date == today_str,
            Appointment.status == "APPROVED"
        ).all()
        for app in apps:
            combined.append({
                "id": 10000 + app.id,
                "day_of_week": current_day,
                "start_time": app.time_slot.split("-")[0].strip() if "-" in app.time_slot else app.time_slot,
                "end_time": app.time_slot.split("-")[1].strip() if "-" in app.time_slot else "",
                "course_code": "CONSULT",
                "subject_name": f"Student Consultation: {app.student.name} ({app.purpose_category})",
                "venue": app.cabin_or_link or current_user.cabin_room or "Faculty Cabin",
                "session_type": "OFFICE_HOURS",
                "batch": app.student.identifier,
                "source": "APPOINTMENT",
                "appointment_code": app.appointment_code,
                "course_id": None
            })
    elif current_user.role == "student":
        apps = db.query(Appointment).filter(
            Appointment.student_id == current_user.id,
            Appointment.date == today_str,
            Appointment.status == "APPROVED"
        ).all()
        for app in apps:
            combined.append({
                "id": 10000 + app.id,
                "day_of_week": current_day,
                "start_time": app.time_slot.split("-")[0].strip() if "-" in app.time_slot else app.time_slot,
                "end_time": app.time_slot.split("-")[1].strip() if "-" in app.time_slot else "",
                "course_code": "CONSULT",
                "subject_name": f"Faculty Meeting: {app.faculty.name} ({app.purpose_category})",
                "venue": app.cabin_or_link or app.faculty.cabin_room or "Faculty Cabin",
                "session_type": "OFFICE_HOURS",
                "batch": "Guide Consultation",
                "source": "APPOINTMENT",
                "appointment_code": app.appointment_code,
                "course_id": None
            })

    return {
        "current_day": current_day,
        "date": today_str,
        "total_sessions": len(combined),
        "sessions": combined
    }

@router.post("/", response_model=ScheduleItemResponse)
def create_schedule_item(
    item_in: ScheduleItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = ScheduleItem(
        user_id=current_user.id,
        day_of_week=item_in.day_of_week,
        start_time=item_in.start_time,
        end_time=item_in.end_time,
        course_code=item_in.course_code,
        subject_name=item_in.subject_name,
        venue=item_in.venue,
        session_type=item_in.session_type or "LECTURE",
        batch=item_in.batch,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_schedule_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ScheduleItem).filter(ScheduleItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    if item.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this schedule item")
    db.delete(item)
    db.commit()
    return {"message": "Schedule item removed successfully", "id": item_id}
