from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Notification
from ..schemas import NotificationResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notification Center"])

@router.get("/", response_model=List[NotificationResponse])
def get_my_notifications(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit).all()

    # If user has no notifications yet, let's create a few realistic welcome/system notifications based on role
    if not notifs:
        now = datetime.datetime.utcnow()
        if current_user.role == "student":
            defaults = [
                Notification(
                    user_id=current_user.id,
                    title="Welcome to Academic Session 2026-27",
                    message="Your course enrollments and daily timetable are active. Ensure your attendance stays above 75% to maintain examination eligibility.",
                    category="SYSTEM",
                    link_tab="daily-schedule",
                    is_read=False,
                    created_at=now
                ),
                Notification(
                    user_id=current_user.id,
                    title="Attendance Health Reminder",
                    message="Keep track of your subject attendance percentages and use the 75% Tracker to plan your semester.",
                    category="ATTENDANCE_WARNING",
                    link_tab="attendance",
                    is_read=False,
                    created_at=now - datetime.timedelta(hours=5)
                ),
                Notification(
                    user_id=current_user.id,
                    title="Mid-Term Assessment Calendar",
                    message="Mid-term evaluations for CS501 and CS502 have been published in your Gradebook.",
                    category="GRADE",
                    link_tab="gradebook",
                    is_read=True,
                    created_at=now - datetime.timedelta(days=1)
                ),
            ]
        elif current_user.role == "faculty":
            defaults = [
                Notification(
                    user_id=current_user.id,
                    title="Attendance Register Ready for Today's Classes",
                    message="You have scheduled lectures today. Remember to mark student attendance after each class.",
                    category="SYSTEM",
                    link_tab="daily-schedule",
                    is_read=False,
                    created_at=now
                ),
                Notification(
                    user_id=current_user.id,
                    title="Pending Student Submissions",
                    message="Students have submitted files for your active assignments. Please review and award grades in the Gradebook.",
                    category="ASSIGNMENT",
                    link_tab="gradebook",
                    is_read=False,
                    created_at=now - datetime.timedelta(hours=4)
                ),
                Notification(
                    user_id=current_user.id,
                    title="Faculty Biometric & Attendance Regularized",
                    message="Your monthly attendance status has been verified by the Dean Office.",
                    category="SYSTEM",
                    link_tab="faculty-hr",
                    is_read=True,
                    created_at=now - datetime.timedelta(days=2)
                ),
            ]
        else:
            defaults = [
                Notification(
                    user_id=current_user.id,
                    title="Campus Academic Ecosystem Status: Healthy",
                    message="All 5 departments operating on schedule. 98.4% system uptime for the current academic cycle.",
                    category="SYSTEM",
                    link_tab="dashboard",
                    is_read=False,
                    created_at=now
                ),
                Notification(
                    user_id=current_user.id,
                    title="Faculty HR Leave Approval Queue",
                    message="Faculty leave requests pending administrative verification.",
                    category="SYSTEM",
                    link_tab="faculty-hr",
                    is_read=False,
                    created_at=now - datetime.timedelta(hours=2)
                ),
            ]
        db.add_all(defaults)
        db.commit()
        notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(limit).all()

    return notifs

@router.get("/unread-count")
def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read", "id": notification_id}

@router.post("/mark-all-read")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": f"Marked {updated} notifications as read"}
