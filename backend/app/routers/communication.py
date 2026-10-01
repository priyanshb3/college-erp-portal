from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Course, CourseEnrollment, CommunicationMessage
from ..schemas import (
    MessageResponse,
    MessageSendRequest,
    BroadcastSendRequest,
)
from ..auth import get_current_user, get_current_active_faculty

router = APIRouter(prefix="/api/communication", tags=["Communication Bridge & Doubts"])

@router.get("/threads", response_model=List[MessageResponse])
def get_message_threads(
    filter_type: Optional[str] = None, # "DOUBT_CLEARANCE", "ANNOUNCEMENT", "DIRECT_QUERY"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Enrolled course IDs for students
    enrolled_ids = []
    if current_user.role == "student":
        enrs = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
        enrolled_ids = [e.course_id for e in enrs]
    elif current_user.role == "faculty":
        taught = db.query(Course).filter(Course.faculty_id == current_user.id).all()
        enrolled_ids = [c.id for c in taught]

    # Threads where:
    # 1. User is sender
    # 2. User is direct receiver
    # 3. Message is broadcast to a course user is part of
    query = db.query(CommunicationMessage).filter(
        CommunicationMessage.parent_id == None
    )

    if current_user.role != "admin":
        query = query.filter(
            (CommunicationMessage.sender_id == current_user.id) |
            (CommunicationMessage.receiver_id == current_user.id) |
            ((CommunicationMessage.receiver_id == None) & (CommunicationMessage.course_id.in_(enrolled_ids)))
        )

    if filter_type and filter_type != "ALL":
        query = query.filter(CommunicationMessage.message_type == filter_type)

    threads = query.order_by(CommunicationMessage.id.desc()).all()

    results = []
    for t in threads:
        rep_count = db.query(CommunicationMessage).filter(CommunicationMessage.parent_id == t.id).count()
        results.append(MessageResponse(
            id=t.id,
            sender_id=t.sender_id,
            receiver_id=t.receiver_id,
            course_id=t.course_id,
            subject=t.subject,
            content=t.content,
            message_type=t.message_type,
            parent_id=t.parent_id,
            is_read=t.is_read,
            created_at=t.created_at,
            sender=t.sender,
            receiver=t.receiver,
            course=t.course,
            replies_count=rep_count
        ))

    return results

@router.get("/threads/{thread_id}")
def get_thread_detail(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    parent = db.query(CommunicationMessage).filter(CommunicationMessage.id == thread_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Message thread not found")

    replies = db.query(CommunicationMessage).filter(
        CommunicationMessage.parent_id == thread_id
    ).order_by(CommunicationMessage.created_at.asc()).all()

    # Mark unread messages to this user as read
    if parent.receiver_id == current_user.id and not parent.is_read:
        parent.is_read = True
    for r in replies:
        if r.receiver_id == current_user.id and not r.is_read:
            r.is_read = True
    db.commit()

    return {
        "parent": parent,
        "replies": replies
    }

@router.post("/send", response_model=MessageResponse)
def send_message(
    req: MessageSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = CommunicationMessage(
        sender_id=current_user.id,
        receiver_id=req.receiver_id,
        course_id=req.course_id,
        subject=req.subject,
        content=req.content,
        message_type=req.message_type or "DIRECT_QUERY",
        parent_id=req.parent_id,
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return MessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        course_id=msg.course_id,
        subject=msg.subject,
        content=msg.content,
        message_type=msg.message_type,
        parent_id=msg.parent_id,
        is_read=msg.is_read,
        created_at=msg.created_at,
        sender=msg.sender,
        receiver=msg.receiver,
        course=msg.course,
        replies_count=0
    )

@router.post("/announcement", response_model=MessageResponse)
def post_course_announcement(
    req: BroadcastSendRequest,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == req.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    msg = CommunicationMessage(
        sender_id=current_user.id,
        receiver_id=None, # Broadcast to course
        course_id=req.course_id,
        subject=f"[{course.code}] {req.subject}",
        content=req.content,
        message_type="ANNOUNCEMENT",
        parent_id=None,
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return MessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        course_id=msg.course_id,
        subject=msg.subject,
        content=msg.content,
        message_type=msg.message_type,
        parent_id=msg.parent_id,
        is_read=msg.is_read,
        created_at=msg.created_at,
        sender=msg.sender,
        receiver=msg.receiver,
        course=msg.course,
        replies_count=0
    )

@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(CommunicationMessage).filter(
        CommunicationMessage.receiver_id == current_user.id,
        CommunicationMessage.is_read == False
    ).count()
    return {"unread_count": count}
