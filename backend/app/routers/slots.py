from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Slot, User
from ..schemas import SlotCreate, SlotResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/slots", tags=["Faculty Availability Slots"])

@router.get("/faculty/{faculty_id}", response_model=List[SlotResponse])
def get_faculty_slots(faculty_id: int, db: Session = Depends(get_db)):
    slots = db.query(Slot).filter(Slot.faculty_id == faculty_id, Slot.is_active == True).all()
    return slots

@router.get("/my", response_model=List[SlotResponse])
def get_my_slots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "faculty" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only faculty can manage their slots")
    
    slots = db.query(Slot).filter(Slot.faculty_id == current_user.id).all()
    return slots

@router.post("/", response_model=SlotResponse, status_code=status.HTTP_201_CREATED)
def create_slot(
    req: SlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "faculty" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only faculty can create slots")

    new_slot = Slot(
        faculty_id=current_user.id,
        day_of_week=req.day_of_week,
        start_time=req.start_time,
        end_time=req.end_time,
        venue=req.venue or current_user.cabin_room or "Faculty Cabin",
        max_students=req.max_students or 3,
        is_active=req.is_active if req.is_active is not None else True,
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot

@router.delete("/{slot_id}")
def delete_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if current_user.role != "admin" and slot.faculty_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete another faculty member's slot")

    db.delete(slot)
    db.commit()
    return {"message": "Slot deleted successfully", "id": slot_id}
