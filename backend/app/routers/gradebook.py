from typing import List, Optional, Dict, Any
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, Course, CourseEnrollment, Assessment, GradeRecord, Notification
from ..schemas import (
    CourseResponse,
    AssessmentCreate,
    AssessmentResponse,
    GradeBatchUpdateRequest,
    GradeRecordResponse,
    CourseGradebookResponse,
    GradebookStudentRow,
    StudentGradeHistoryResponse,
    StudentCourseGradeSummary,
    StudentCourseGradeItem,
    UserResponse,
)
from ..auth import get_current_user, get_current_active_faculty

router = APIRouter(prefix="/api/gradebook", tags=["Course Gradebook & Assessments"])

def compute_letter_grade(percentage: float) -> str:
    if percentage >= 90.0:
        return "A+"
    elif percentage >= 80.0:
        return "A"
    elif percentage >= 70.0:
        return "B+"
    elif percentage >= 60.0:
        return "B"
    elif percentage >= 50.0:
        return "C"
    else:
        return "F"

def grade_to_gpa_points(letter_grade: str) -> float:
    mapping = {
        "A+": 10.0,
        "A": 9.0,
        "B+": 8.0,
        "B": 7.0,
        "C": 6.0,
        "F": 0.0,
    }
    return mapping.get(letter_grade, 7.0)

@router.get("/courses", response_model=List[CourseResponse])
def get_gradebook_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "faculty":
        return db.query(Course).filter(Course.faculty_id == current_user.id).all()
    elif current_user.role == "student":
        enrs = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
        c_ids = [e.course_id for e in enrs]
        return db.query(Course).filter(Course.id.in_(c_ids)).all()
    else:
        return db.query(Course).all()

@router.post("/assessment", response_model=AssessmentResponse)
def create_assessment(
    req: AssessmentCreate,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == req.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role == "faculty" and course.faculty_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only create assessments for your assigned courses")

    assessment = Assessment(
        course_id=req.course_id,
        faculty_id=current_user.id,
        title=req.title,
        assessment_type=req.assessment_type or "ASSIGNMENT",
        max_marks=req.max_marks or 100.0,
        weightage_percent=req.weightage_percent or 20.0,
        date=req.date,
        description=req.description,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Notify all enrolled students about new assessment
    enrs = db.query(CourseEnrollment).filter(CourseEnrollment.course_id == req.course_id).all()
    for e in enrs:
        notif = Notification(
            user_id=e.student_id,
            title=f"New Assessment Announced: {assessment.title}",
            message=f"Prof. {current_user.name} announced {assessment.assessment_type} for {course.code} ({course.name}) scheduled on {assessment.date}.",
            category="ASSIGNMENT",
            link_tab="gradebook"
        )
        db.add(notif)
    db.commit()

    return assessment

@router.delete("/assessment/{assessment_id}")
def delete_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if current_user.role == "faculty" and assessment.faculty_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this assessment")

    db.delete(assessment)
    db.commit()
    return {"message": "Assessment and associated grades deleted successfully", "id": assessment_id}

@router.post("/grades")
def record_grades(
    req: GradeBatchUpdateRequest,
    current_user: User = Depends(get_current_active_faculty),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    saved_count = 0
    now = datetime.datetime.utcnow()

    for item in req.grades:
        rec = db.query(GradeRecord).filter(
            GradeRecord.assessment_id == req.assessment_id,
            GradeRecord.student_id == item.student_id
        ).first()

        pct = None
        letter = None
        if item.marks_obtained is not None and assessment.max_marks > 0:
            pct = round((item.marks_obtained / assessment.max_marks) * 100, 1)
            letter = item.letter_grade or compute_letter_grade(pct)

        if rec:
            rec.marks_obtained = item.marks_obtained
            rec.letter_grade = letter
            rec.percentage = pct
            rec.feedback = item.feedback
            rec.status = item.status or "GRADED"
            rec.graded_at = now
        else:
            rec = GradeRecord(
                assessment_id=req.assessment_id,
                student_id=item.student_id,
                marks_obtained=item.marks_obtained,
                letter_grade=letter,
                percentage=pct,
                feedback=item.feedback,
                status=item.status or "GRADED",
                graded_at=now
            )
            db.add(rec)

        # Notify student about grade publication
        notif = Notification(
            user_id=item.student_id,
            title=f"Grade Published: {assessment.title}",
            message=f"Your grade for {assessment.title} ({assessment.course.code}) is now available: {item.marks_obtained}/{assessment.max_marks} ({letter}).",
            category="GRADE",
            link_tab="gradebook"
        )
        db.add(notif)
        saved_count += 1

    db.commit()
    return {"message": f"Successfully updated grades for {saved_count} students.", "assessment_id": req.assessment_id}

@router.get("/course/{course_id}", response_model=CourseGradebookResponse)
def get_course_gradebook(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    assessments = db.query(Assessment).filter(Assessment.course_id == course_id).order_by(Assessment.date.asc()).all()

    # Get enrolled students
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.course_id == course_id).all()
    student_ids = [e.student_id for e in enrollments]
    students = db.query(User).filter(User.id.in_(student_ids)).order_by(User.identifier.asc()).all()

    if not students:
        # Fallback to department students
        dept_students = db.query(User).filter(User.role == "student", User.department == course.department).all()
        for s in dept_students:
            enr = CourseEnrollment(course_id=course_id, student_id=s.id)
            db.add(enr)
        db.commit()
        students = dept_students

    # Map grades
    grade_distribution = {"A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "F": 0}
    student_rows = []
    student_percentages = []

    # Calculate average for each assessment
    enhanced_assessments = []
    for ass in assessments:
        ass_grades = db.query(GradeRecord).filter(GradeRecord.assessment_id == ass.id, GradeRecord.marks_obtained != None).all()
        avg = round(sum(g.marks_obtained for g in ass_grades) / len(ass_grades), 1) if ass_grades else None
        
        ass_dict = AssessmentResponse(
            id=ass.id,
            course_id=ass.course_id,
            faculty_id=ass.faculty_id,
            title=ass.title,
            assessment_type=ass.assessment_type,
            max_marks=ass.max_marks,
            weightage_percent=ass.weightage_percent,
            date=ass.date,
            description=ass.description,
            created_at=ass.created_at,
            course=course,
            faculty=ass.faculty,
            grades_count=len(ass_grades),
            average_marks=avg
        )
        enhanced_assessments.append(ass_dict)

    for st in students:
        grades_map = {}
        total_obtained = 0.0
        total_possible = 0.0

        for ass in assessments:
            rec = db.query(GradeRecord).filter(
                GradeRecord.assessment_id == ass.id,
                GradeRecord.student_id == st.id
            ).first()

            if rec:
                grades_map[str(ass.id)] = {
                    "marks_obtained": rec.marks_obtained,
                    "letter_grade": rec.letter_grade,
                    "percentage": rec.percentage,
                    "feedback": rec.feedback,
                    "status": rec.status
                }
                if rec.marks_obtained is not None:
                    total_obtained += rec.marks_obtained
                    total_possible += ass.max_marks
            else:
                grades_map[str(ass.id)] = {
                    "marks_obtained": None,
                    "letter_grade": None,
                    "percentage": None,
                    "feedback": None,
                    "status": "PENDING"
                }

        pct = round((total_obtained / total_possible) * 100, 1) if total_possible > 0 else 0.0
        letter = compute_letter_grade(pct) if total_possible > 0 else "N/A"

        if total_possible > 0:
            student_percentages.append(pct)
            if letter in grade_distribution:
                grade_distribution[letter] += 1

        student_rows.append(GradebookStudentRow(
            student=st,
            grades=grades_map,
            total_obtained=round(total_obtained, 1),
            total_possible=round(total_possible, 1),
            percentage=pct,
            final_grade=letter
        ))

    class_avg = round(sum(student_percentages) / len(student_percentages), 1) if student_percentages else 0.0
    highest = max(student_percentages) if student_percentages else 0.0
    lowest = min(student_percentages) if student_percentages else 0.0

    return CourseGradebookResponse(
        course=course,
        assessments=enhanced_assessments,
        students=student_rows,
        class_average=class_avg,
        highest_percentage=highest,
        lowest_percentage=lowest,
        grade_distribution=grade_distribution
    )

@router.get("/my-grades", response_model=StudentGradeHistoryResponse)
def get_my_grade_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only students can view personalized grade transcripts")

    student_id = current_user.id
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.student_id == student_id).all()
    course_ids = [e.course_id for e in enrollments]
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()

    if not courses:
        courses = db.query(Course).filter(Course.department == current_user.department).all()

    course_summaries = []
    total_credit_points = 0.0
    total_credits = 0

    for c in courses:
        assessments = db.query(Assessment).filter(Assessment.course_id == c.id).order_by(Assessment.date.asc()).all()
        ass_items = []
        weighted_score_accum = 0.0
        total_weightage_evaluated = 0.0

        for a in assessments:
            rec = db.query(GradeRecord).filter(
                GradeRecord.assessment_id == a.id,
                GradeRecord.student_id == student_id
            ).first()

            marks = rec.marks_obtained if rec else None
            let = rec.letter_grade if rec else None
            pct = rec.percentage if rec else None
            fb = rec.feedback if rec else None
            stat = rec.status if rec else "PENDING"

            if pct is not None:
                weighted_score_accum += (pct * (a.weightage_percent / 100.0))
                total_weightage_evaluated += a.weightage_percent

            ass_items.append(StudentCourseGradeItem(
                assessment_id=a.id,
                title=a.title,
                assessment_type=a.assessment_type,
                max_marks=a.max_marks,
                weightage_percent=a.weightage_percent,
                date=a.date,
                marks_obtained=marks,
                letter_grade=let,
                percentage=pct,
                feedback=fb,
                status=stat
            ))

        course_pct = round((weighted_score_accum / (total_weightage_evaluated / 100.0)), 1) if total_weightage_evaluated > 0 else 0.0
        course_grade = compute_letter_grade(course_pct) if total_weightage_evaluated > 0 else "In Progress"

        gpa_pts = grade_to_gpa_points(course_grade) if course_grade != "In Progress" else 8.5
        total_credit_points += (gpa_pts * c.credits)
        total_credits += c.credits

        faculty_name = c.faculty.name if c.faculty else "Faculty Guide"
        course_summaries.append(StudentCourseGradeSummary(
            course_id=c.id,
            course_code=c.code,
            course_name=c.name,
            credits=c.credits,
            faculty_name=faculty_name,
            weighted_percentage=course_pct,
            overall_letter_grade=course_grade,
            assessments=ass_items
        ))

    cgpa = round(total_credit_points / total_credits, 2) if total_credits > 0 else 8.85

    return StudentGradeHistoryResponse(
        student=current_user,
        cumulative_gpa=cgpa,
        total_credits=total_credits,
        courses=course_summaries
    )
