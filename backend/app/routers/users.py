from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Appointment, Notice, Slot
from ..schemas import UserResponse, NoticeResponse, ERPStats
from ..auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users & ERP Info"])

@router.get("/faculty", response_model=List[UserResponse])
def get_faculty_directory(
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "faculty")

    if department and department != "All Departments":
        query = query.filter(User.department == department)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_pattern)) |
            (User.specialization.ilike(search_pattern)) |
            (User.department.ilike(search_pattern)) |
            (User.cabin_room.ilike(search_pattern))
        )

    return query.order_by(User.name.asc()).all()

@router.get("/students", response_model=List[UserResponse])
def get_students_directory(
    department: Optional[str] = None,
    semester: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "student")

    if department and department != "All Departments":
        query = query.filter(User.department == department)

    if semester:
        query = query.filter(User.semester == semester)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_pattern)) |
            (User.identifier.ilike(search_pattern)) |
            (User.email.ilike(search_pattern))
        )

    return query.order_by(User.identifier.asc()).all()

@router.get("/stats", response_model=ERPStats)
def get_erp_stats(db: Session = Depends(get_db)):
    total_faculty = db.query(User).filter(User.role == "faculty").count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_appointments = db.query(Appointment).count()
    pending_appointments = db.query(Appointment).filter(Appointment.status == "PENDING").count()

    today_str = datetime.date.today().strftime("%Y-%m-%d")
    approved_today = db.query(Appointment).filter(
        Appointment.date == today_str,
        Appointment.status == "APPROVED"
    ).count()

    departments = db.query(User.department).distinct().count()

    return {
        "total_faculty": total_faculty,
        "total_students": total_students,
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments,
        "approved_today": approved_today,
        "departments_count": max(departments, 5),
    }

@router.get("/notices", response_model=List[NoticeResponse])
def get_campus_notices(db: Session = Depends(get_db)):
    notices = db.query(Notice).order_by(Notice.is_pinned.desc(), Notice.id.desc()).all()
    return notices
