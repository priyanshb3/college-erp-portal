import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, FacultyAttendance, FacultyLeave
from ..schemas import (
    FacultyAttendancePunchRequest,
    FacultyAttendanceAdminUpdateRequest,
    FacultyAttendanceResponse,
    FacultyLeaveApplyRequest,
    FacultyLeaveReviewRequest,
    FacultyLeaveResponse,
    FacultyHRSummaryResponse,
    AdminFacultyHROverviewResponse,
    AdminFacultyAttendanceItem,
)
from ..auth import get_current_user, get_current_active_faculty, get_current_active_admin

router = APIRouter(prefix="/api/faculty-hr", tags=["Faculty HR & Attendance"])

def _calculate_hours(check_in_str: Optional[str], check_out_str: Optional[str]) -> float:
    if not check_in_str or not check_out_str:
        return 0.0
    try:
        # Try "%I:%M %p" (e.g., "09:15 AM")
        t_in = datetime.datetime.strptime(check_in_str.strip().upper(), "%I:%M %p")
        t_out = datetime.datetime.strptime(check_out_str.strip().upper(), "%I:%M %p")
        diff_seconds = (t_out - t_in).total_seconds()
        if diff_seconds < 0:
            diff_seconds += 24 * 3600 # Handle overnight / edge case
        return round(diff_seconds / 3600.0, 2)
    except Exception:
        try:
            # Fallback to "%H:%M" (e.g., "09:15")
            t_in = datetime.datetime.strptime(check_in_str.strip(), "%H:%M")
            t_out = datetime.datetime.strptime(check_out_str.strip(), "%H:%M")
            diff_seconds = (t_out - t_in).total_seconds()
            if diff_seconds < 0:
                diff_seconds += 24 * 3600
            return round(diff_seconds / 3600.0, 2)
        except Exception:
            return 8.0 # default reasonable estimate

def _get_current_time_str() -> str:
    # Format e.g. "09:30 AM"
    return datetime.datetime.now().strftime("%I:%M %p")

def _get_current_date_str() -> str:
    return datetime.date.today().strftime("%Y-%m-%d")

# ----------------- FACULTY ENDPOINTS -----------------

@router.post("/punch", response_model=FacultyAttendanceResponse)
def punch_faculty_attendance(
    req: FacultyAttendancePunchRequest,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    target_date = req.date or _get_current_date_str()
    action_time = req.custom_time or _get_current_time_str()

    record = db.query(FacultyAttendance).filter(
        FacultyAttendance.faculty_id == current_user.id,
        FacultyAttendance.date == target_date
    ).first()

    if not record:
        record = FacultyAttendance(
            faculty_id=current_user.id,
            date=target_date,
            status=req.status or "PRESENT",
            work_mode=req.work_mode or "IN_CAMPUS",
            location_or_cabin=req.location_or_cabin or current_user.cabin_room or "Academic Block",
            work_summary=req.work_summary,
            working_hours=0.0
        )
        db.add(record)

    if req.action == "CHECK_IN":
        record.check_in_time = action_time
        if req.status:
            record.status = req.status
        if req.work_mode:
            record.work_mode = req.work_mode
        if req.location_or_cabin:
            record.location_or_cabin = req.location_or_cabin
        if req.work_summary:
            record.work_summary = req.work_summary
        if record.check_out_time:
            record.working_hours = _calculate_hours(record.check_in_time, record.check_out_time)

    elif req.action == "CHECK_OUT":
        record.check_out_time = action_time
        if not record.check_in_time:
            # Default check-in time 09:00 AM if checking out first
            record.check_in_time = "09:00 AM"
        record.working_hours = _calculate_hours(record.check_in_time, record.check_out_time)
        if req.work_summary:
            if record.work_summary:
                record.work_summary = f"{record.work_summary}\nCheckout Notes: {req.work_summary}"
            else:
                record.work_summary = req.work_summary

    elif req.action == "MARK_TODAY":
        if req.status:
            record.status = req.status
        if req.work_mode:
            record.work_mode = req.work_mode
        if req.location_or_cabin:
            record.location_or_cabin = req.location_or_cabin
        if req.work_summary:
            record.work_summary = req.work_summary
        if req.custom_time and not record.check_in_time:
            record.check_in_time = req.custom_time

    record.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


@router.get("/my-summary", response_model=FacultyHRSummaryResponse)
def get_faculty_hr_summary(
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    today_str = _get_current_date_str()
    today_rec = db.query(FacultyAttendance).filter(
        FacultyAttendance.faculty_id == current_user.id,
        FacultyAttendance.date == today_str
    ).first()

    # Query all attendance records for this faculty
    all_recs = db.query(FacultyAttendance).filter(
        FacultyAttendance.faculty_id == current_user.id
    ).order_by(FacultyAttendance.date.desc()).all()

    total_days = len(all_recs)
    present_days = sum(1 for r in all_recs if r.status == "PRESENT")
    half_days = sum(1 for r in all_recs if r.status == "HALF_DAY")
    leaves_taken = sum(1 for r in all_recs if r.status == "ON_LEAVE")
    od_days = sum(1 for r in all_recs if r.status == "ON_DUTY")
    total_hours = sum(r.working_hours or 0.0 for r in all_recs)

    # Effective attendance percentage
    effective_attended = present_days + od_days + (half_days * 0.5)
    pct = round((effective_attended / total_days * 100), 1) if total_days > 0 else 100.0
    avg_hours = round(total_hours / total_days, 1) if total_days > 0 else 8.0

    # Calculate leave balances
    leaves = db.query(FacultyLeave).filter(
        FacultyLeave.faculty_id == current_user.id
    ).order_by(FacultyLeave.applied_at.desc()).all()

    cl_used = sum(l.total_days for l in leaves if l.leave_type == "CASUAL_LEAVE" and l.status == "APPROVED")
    ml_used = sum(l.total_days for l in leaves if l.leave_type == "MEDICAL_LEAVE" and l.status == "APPROVED")
    el_used = sum(l.total_days for l in leaves if l.leave_type == "EARNED_LEAVE" and l.status == "APPROVED")
    od_used = sum(l.total_days for l in leaves if l.leave_type == "DUTY_LEAVE_OD" and l.status == "APPROVED")

    leave_balances = {
        "casual": {"total": 12.0, "used": cl_used, "remaining": max(0.0, 12.0 - cl_used)},
        "medical": {"total": 10.0, "used": ml_used, "remaining": max(0.0, 10.0 - ml_used)},
        "earned": {"total": 15.0, "used": el_used, "remaining": max(0.0, 15.0 - el_used)},
        "duty": {"total": 15.0, "used": od_used, "remaining": max(0.0, 15.0 - od_used)},
    }

    return FacultyHRSummaryResponse(
        today_record=today_rec,
        attendance_percentage=pct,
        total_working_days=total_days,
        present_days=present_days,
        half_days=half_days,
        leaves_taken=leaves_taken,
        od_days=od_days,
        total_hours_worked=round(total_hours, 1),
        avg_daily_hours=avg_hours,
        leave_balances=leave_balances,
        recent_punches=all_recs[:15],
        recent_leaves=leaves[:10]
    )


@router.get("/my-logs", response_model=List[FacultyAttendanceResponse])
def get_faculty_attendance_logs(
    month: Optional[str] = None, # e.g. "2026-09"
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    query = db.query(FacultyAttendance).filter(FacultyAttendance.faculty_id == current_user.id)
    if month:
        query = query.filter(FacultyAttendance.date.startswith(month))
    return query.order_by(FacultyAttendance.date.desc()).all()


@router.post("/leave/apply", response_model=FacultyLeaveResponse)
def apply_faculty_leave(
    req: FacultyLeaveApplyRequest,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    try:
        d1 = datetime.datetime.strptime(req.start_date, "%Y-%m-%d")
        d2 = datetime.datetime.strptime(req.end_date, "%Y-%m-%d")
        days = max(1, (d2 - d1).days + 1)
    except Exception:
        days = 1.0

    leave_entry = FacultyLeave(
        faculty_id=current_user.id,
        leave_type=req.leave_type,
        start_date=req.start_date,
        end_date=req.end_date,
        total_days=float(days),
        reason=req.reason,
        status="PENDING",
        applied_at=datetime.datetime.utcnow()
    )
    db.add(leave_entry)
    db.commit()
    db.refresh(leave_entry)
    return leave_entry


@router.get("/my-leaves", response_model=List[FacultyLeaveResponse])
def get_faculty_leaves(
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    return db.query(FacultyLeave).filter(
        FacultyLeave.faculty_id == current_user.id
    ).order_by(FacultyLeave.applied_at.desc()).all()


@router.post("/leave/{leave_id}/cancel")
def cancel_faculty_leave(
    leave_id: int,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    leave = db.query(FacultyLeave).filter(
        FacultyLeave.id == leave_id,
        FacultyLeave.faculty_id == current_user.id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cannot cancel non-pending leave request")

    leave.status = "CANCELLED"
    db.commit()
    return {"message": "Leave application cancelled successfully"}


# ----------------- ADMIN & HR ENDPOINTS -----------------

@router.get("/admin/overview", response_model=AdminFacultyHROverviewResponse)
def get_admin_faculty_hr_overview(
    date: Optional[str] = None,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    target_date = date or _get_current_date_str()
    faculty_list = db.query(User).filter(User.role == "faculty").order_by(User.name.asc()).all()

    # Attendance records for target date
    day_records = {
        r.faculty_id: r
        for r in db.query(FacultyAttendance).filter(FacultyAttendance.date == target_date).all()
    }

    # Pending leaves
    pending_leaves = db.query(FacultyLeave).filter(
        FacultyLeave.status == "PENDING"
    ).order_by(FacultyLeave.applied_at.desc()).all()

    faculty_items = []
    present_cnt = 0
    half_cnt = 0
    leave_cnt = 0
    od_cnt = 0
    unmarked_cnt = 0

    for fac in faculty_list:
        rec = day_records.get(fac.id)

        # Faculty monthly stats
        all_fac_recs = db.query(FacultyAttendance).filter(FacultyAttendance.faculty_id == fac.id).all()
        fac_total_days = len(all_fac_recs)
        fac_present = sum(1 for r in all_fac_recs if r.status == "PRESENT")
        fac_od = sum(1 for r in all_fac_recs if r.status == "ON_DUTY")
        fac_half = sum(1 for r in all_fac_recs if r.status == "HALF_DAY")
        fac_hours = sum(r.working_hours or 0.0 for r in all_fac_recs)

        effective_att = fac_present + fac_od + (fac_half * 0.5)
        month_pct = round((effective_att / fac_total_days * 100), 1) if fac_total_days > 0 else 100.0

        fac_pending_leaves = sum(1 for pl in pending_leaves if pl.faculty_id == fac.id)

        if rec:
            if rec.status == "PRESENT":
                present_cnt += 1
            elif rec.status == "HALF_DAY":
                half_cnt += 1
            elif rec.status == "ON_LEAVE":
                leave_cnt += 1
            elif rec.status == "ON_DUTY":
                od_cnt += 1
            elif rec.status == "ABSENT":
                pass
        else:
            unmarked_cnt += 1

        faculty_items.append(AdminFacultyAttendanceItem(
            faculty=fac,
            attendance=rec,
            month_percentage=month_pct,
            month_present_days=fac_present,
            month_total_hours=round(fac_hours, 1),
            pending_leaves_count=fac_pending_leaves
        ))

    total_fac = len(faculty_list)
    att_rate = round(((present_cnt + od_cnt + (half_cnt * 0.5)) / total_fac * 100), 1) if total_fac > 0 else 0.0

    return AdminFacultyHROverviewResponse(
        date=target_date,
        total_faculty=total_fac,
        present_today=present_cnt,
        half_day_today=half_cnt,
        on_leave_today=leave_cnt,
        on_duty_today=od_cnt,
        unmarked_today=unmarked_cnt,
        attendance_rate=att_rate,
        faculty_records=faculty_items,
        pending_leaves=pending_leaves
    )


@router.post("/admin/override-attendance", response_model=FacultyAttendanceResponse)
def admin_override_faculty_attendance(
    req: FacultyAttendanceAdminUpdateRequest,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    faculty = db.query(User).filter(User.id == req.faculty_id, User.role == "faculty").first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    record = db.query(FacultyAttendance).filter(
        FacultyAttendance.faculty_id == req.faculty_id,
        FacultyAttendance.date == req.date
    ).first()

    hours = req.working_hours
    if hours is None and req.check_in_time and req.check_out_time:
        hours = _calculate_hours(req.check_in_time, req.check_out_time)
    elif hours is None:
        hours = 8.0 if req.status in ["PRESENT", "ON_DUTY"] else 4.0 if req.status == "HALF_DAY" else 0.0

    if not record:
        record = FacultyAttendance(
            faculty_id=req.faculty_id,
            date=req.date,
            check_in_time=req.check_in_time or ("09:00 AM" if req.status in ["PRESENT", "HALF_DAY"] else None),
            check_out_time=req.check_out_time or ("05:00 PM" if req.status == "PRESENT" else None),
            status=req.status,
            work_mode=req.work_mode or "IN_CAMPUS",
            location_or_cabin=faculty.cabin_room,
            working_hours=hours,
            is_regularized=True,
            marked_by_admin=True,
            remarks=req.remarks or "Admin Attendance Entry",
            work_summary=req.work_summary
        )
        db.add(record)
    else:
        record.status = req.status
        if req.check_in_time is not None:
            record.check_in_time = req.check_in_time
        if req.check_out_time is not None:
            record.check_out_time = req.check_out_time
        if req.work_mode is not None:
            record.work_mode = req.work_mode
        record.working_hours = hours
        record.is_regularized = True
        record.marked_by_admin = True
        if req.remarks:
            record.remarks = req.remarks
        if req.work_summary:
            record.work_summary = req.work_summary
        record.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(record)
    return record


@router.post("/admin/leave/{leave_id}/review", response_model=FacultyLeaveResponse)
def admin_review_faculty_leave(
    leave_id: int,
    req: FacultyLeaveReviewRequest,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    leave = db.query(FacultyLeave).filter(FacultyLeave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Faculty leave record not found")

    leave.status = req.status
    leave.admin_remarks = req.admin_remarks
    leave.reviewed_by = current_user.id
    leave.reviewed_at = datetime.datetime.utcnow()

    # If APPROVED, synchronize with FacultyAttendance table for the dates covered!
    if req.status == "APPROVED":
        try:
            d_start = datetime.datetime.strptime(leave.start_date, "%Y-%m-%d").date()
            d_end = datetime.datetime.strptime(leave.end_date, "%Y-%m-%d").date()
            curr_d = d_start
            leave_status = "ON_DUTY" if leave.leave_type == "DUTY_LEAVE_OD" else "ON_LEAVE"

            while curr_d <= d_end:
                date_str = curr_d.strftime("%Y-%m-%d")
                att = db.query(FacultyAttendance).filter(
                    FacultyAttendance.faculty_id == leave.faculty_id,
                    FacultyAttendance.date == date_str
                ).first()

                if not att:
                    att = FacultyAttendance(
                        faculty_id=leave.faculty_id,
                        date=date_str,
                        status=leave_status,
                        work_mode="FIELD_DUTY" if leave_status == "ON_DUTY" else "IN_CAMPUS",
                        working_hours=8.0 if leave_status == "ON_DUTY" else 0.0,
                        remarks=f"HR Leave Approved: {leave.leave_type}",
                        marked_by_admin=True,
                        is_regularized=True
                    )
                    db.add(att)
                else:
                    att.status = leave_status
                    att.remarks = f"HR Leave Approved: {leave.leave_type}"
                    att.is_regularized = True
                    att.marked_by_admin = True

                curr_d += datetime.timedelta(days=1)
        except Exception as e:
            print(f"Error synchronizing leave to attendance: {e}")

    db.commit()
    db.refresh(leave)
    return leave
