from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Course, CourseEnrollment, Assignment, Submission
from ..schemas import (
    AssignmentCreate,
    AssignmentResponse,
    SubmissionCreate,
    SubmissionGradeRequest,
    SubmissionResponse,
)
from ..auth import get_current_user, get_current_active_faculty, get_current_active_student

router = APIRouter(prefix="/api/submissions", tags=["Assignment & Submission Management"])

@router.get("/assignments", response_model=List[AssignmentResponse])
def get_assignments(
    course_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Assignment)

    if current_user.role == "faculty":
        query = query.filter(Assignment.faculty_id == current_user.id)
    elif current_user.role == "student":
        # Get courses the student is enrolled in
        enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
        enrolled_course_ids = [e.course_id for e in enrollments]
        if enrolled_course_ids:
            query = query.filter(Assignment.course_id.in_(enrolled_course_ids))
    
    if course_id:
        query = query.filter(Assignment.course_id == course_id)

    assignments = query.order_by(Assignment.id.desc()).all()

    results = []
    for a in assignments:
        sub_count = db.query(Submission).filter(Submission.assignment_id == a.id).count()
        my_sub = None
        if current_user.role == "student":
            my_sub = db.query(Submission).filter(
                Submission.assignment_id == a.id,
                Submission.student_id == current_user.id
            ).first()

        resp = AssignmentResponse(
            id=a.id,
            course_id=a.course_id,
            faculty_id=a.faculty_id,
            title=a.title,
            description=a.description,
            due_date=a.due_date,
            total_marks=a.total_marks,
            submission_format=a.submission_format,
            attachment_hint=a.attachment_hint,
            created_at=a.created_at,
            course=a.course,
            faculty=a.faculty,
            submissions_count=sub_count,
            my_submission=my_sub
        )
        results.append(resp)

    return results

@router.post("/assignments", response_model=AssignmentResponse)
def create_assignment(
    data: AssignmentCreate,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    assign = Assignment(
        course_id=data.course_id,
        faculty_id=current_user.id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        total_marks=data.total_marks or 50,
        submission_format=data.submission_format or "PDF / Zip / GitHub Link",
        attachment_hint=data.attachment_hint
    )
    db.add(assign)
    db.commit()
    db.refresh(assign)

    return AssignmentResponse(
        id=assign.id,
        course_id=assign.course_id,
        faculty_id=assign.faculty_id,
        title=assign.title,
        description=assign.description,
        due_date=assign.due_date,
        total_marks=assign.total_marks,
        submission_format=assign.submission_format,
        attachment_hint=assign.attachment_hint,
        created_at=assign.created_at,
        course=assign.course,
        faculty=assign.faculty,
        submissions_count=0,
        my_submission=None
    )

@router.get("/assignments/{assignment_id}/submissions", response_model=List[SubmissionResponse])
def get_assignment_submissions(
    assignment_id: int,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submissions = db.query(Submission).filter(
        Submission.assignment_id == assignment_id
    ).order_by(Submission.submitted_at.desc()).all()

    return submissions

@router.post("/assignments/{assignment_id}/submit", response_model=SubmissionResponse)
def submit_assignment(
    assignment_id: int,
    data: SubmissionCreate,
    current_user: User = Depends(get_current_active_student),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if student already submitted
    existing = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.student_id == current_user.id
    ).first()

    now = datetime.datetime.utcnow()
    # Check if late
    status_str = "SUBMITTED"
    try:
        due_dt = datetime.datetime.strptime(assignment.due_date.replace("T", " "), "%Y-%m-%d %H:%M")
        if now > due_dt:
            status_str = "LATE"
    except Exception:
        pass

    if existing:
        existing.submission_text = data.submission_text
        existing.attachment_name = data.attachment_name or existing.attachment_name
        existing.attachment_url = data.attachment_url or existing.attachment_url
        existing.submitted_at = now
        existing.status = status_str
        db.commit()
        db.refresh(existing)
        return existing

    sub = Submission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        submission_text=data.submission_text,
        attachment_name=data.attachment_name or f"{current_user.identifier}_Submission.pdf",
        attachment_url=data.attachment_url or "https://storage.college.edu/submissions/doc104.pdf",
        status=status_str,
        submitted_at=now
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.post("/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(
    submission_id: int,
    data: SubmissionGradeRequest,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.marks_awarded = data.marks_awarded
    sub.faculty_feedback = data.faculty_feedback
    sub.status = "GRADED"
    sub.graded_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(sub)
    return sub
