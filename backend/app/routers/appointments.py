import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Appointment, User, Slot
from ..schemas import AppointmentCreate, AppointmentStatusUpdate, AppointmentResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

def generate_appointment_code():
    rand_num = random.randint(1000, 9999)
    return f"APP-2026-{rand_num}"

@router.get("/my", response_model=List[AppointmentResponse])
def get_my_appointments(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment).options(
        joinedload(Appointment.student),
        joinedload(Appointment.faculty),
        joinedload(Appointment.slot)
    )

    if current_user.role == "student":
        query = query.filter(Appointment.student_id == current_user.id)
    elif current_user.role == "faculty":
        query = query.filter(Appointment.faculty_id == current_user.id)
    # Admin can view all

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Appointment.status == status_filter.upper())

    appointments = query.order_by(Appointment.date.desc(), Appointment.id.desc()).all()
    return appointments

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_detail(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Appointment).options(
        joinedload(Appointment.student),
        joinedload(Appointment.faculty)
    ).filter(Appointment.id == appointment_id).first()

    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "student" and app.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")
    if current_user.role == "faculty" and app.faculty_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    return app

@router.post("/book", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    req: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only students or admins can create appointment bookings")

    faculty = db.query(User).filter(User.id == req.faculty_id, User.role == "faculty").first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Selected faculty member not found")

    # Determine default venue from faculty cabin or mode
    default_venue = faculty.cabin_room or "Faculty Cabin"
    if req.meeting_mode == "ONLINE":
        default_venue = "Online Video Conference (Link will be provided upon approval)"
    elif req.meeting_mode == "LAB":
        default_venue = f"{faculty.department} Department Lab"

    new_app = Appointment(
        appointment_code=generate_appointment_code(),
        student_id=current_user.id,
        faculty_id=faculty.id,
        slot_id=req.slot_id,
        date=req.date,
        time_slot=req.time_slot,
        purpose_category=req.purpose_category,
        purpose_details=req.purpose_details,
        urgency=req.urgency or "NORMAL",
        meeting_mode=req.meeting_mode or "CABIN",
        status="PENDING",
        cabin_or_link=default_venue,
    )

    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    return new_app

@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    req: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "faculty" and app.faculty_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update appointments scheduled with you")
    elif current_user.role == "student":
        # Students can only cancel pending appointments
        if req.status != "CANCELLED" or app.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Students can only cancel their own appointments")

    app.status = req.status.upper()
    if req.faculty_remarks is not None:
        app.faculty_remarks = req.faculty_remarks
    if req.cabin_or_link is not None:
        app.cabin_or_link = req.cabin_or_link

    db.commit()
    db.refresh(app)
    return app

@router.delete("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "student" and app.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot cancel another student's appointment")

    app.status = "CANCELLED"
    db.commit()
    return {"message": "Appointment cancelled successfully", "id": appointment_id}
