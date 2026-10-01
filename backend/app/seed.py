import datetime
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import (
    User, Slot, Appointment, Notice, Course, CourseEnrollment,
    ScheduleItem, AttendanceRecord, Assignment, Submission, CommunicationMessage,
    FacultyAttendance, FacultyLeave, Assessment, GradeRecord, Notification, AcademicEvent
)
from .auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # If users exist, still check if new features (courses, schedule, attendance, etc.) are seeded
    if db.query(User).count() > 0:
        if db.query(Course).count() == 0:
            print("Users already seeded. Seeding new features (courses, schedule, attendance, assignments, messages)...")
            seed_new_features(db)
        if db.query(FacultyAttendance).count() == 0:
            print("Seeding faculty attendance and HR data...")
            seed_faculty_hr_data(db)
        if db.query(Assessment).count() == 0:
            print("Seeding Course Assessments, Gradebook, and Academic Calendar data...")
            seed_gradebook_and_calendar_data(db)
        else:
            print("Database already contains complete data, skipping seed.")
        db.close()
        return

    print("Seeding initial College ERP Portal data...")
    hashed_pwd = get_password_hash("password123")

    # 1. ADMIN USERS
    admin_users = [
        User(
            identifier="ADMIN-01",
            email="admin@college.edu",
            hashed_password=hashed_pwd,
            name="Dr. Suresh N. Venkat",
            role="admin",
            department="Academic Affairs / Dean Office",
            designation="Dean of Academic Affairs & Chief Warden",
            cabin_room="Admin Block, 1st Floor, Room 102",
            phone="+91 98765 43210",
            specialization="Curriculum Governance, Academic Accreditation",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            cgpa_or_experience="25+ Years in Academia",
        )
    ]
    db.add_all(admin_users)
    db.commit()

    # 2. FACULTY USERS
    faculty_users = [
        User(
            identifier="FAC-CS-042",
            email="rajesh.sharma@college.edu",
            hashed_password=hashed_pwd,
            name="Dr. Rajesh Sharma",
            role="faculty",
            department="Computer Science & Engineering",
            designation="Professor & Head of Department",
            cabin_room="Academic Block-A, Cabin 304",
            phone="+91 94123 55678",
            specialization="Distributed Computing, Cloud Architecture, Operating Systems",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            cgpa_or_experience="18 Years Experience",
        ),
        User(
            identifier="FAC-CS-109",
            email="anita.deshmukh@college.edu",
            hashed_password=hashed_pwd,
            name="Dr. Anita Deshmukh",
            role="faculty",
            department="Computer Science & Engineering",
            designation="Associate Professor",
            cabin_room="Academic Block-A, Cabin 312",
            phone="+91 98220 12345",
            specialization="Artificial Intelligence, Deep Learning, Natural Language Processing",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            cgpa_or_experience="12 Years Experience",
        ),
        User(
            identifier="FAC-EC-028",
            email="vikram.menon@college.edu",
            hashed_password=hashed_pwd,
            name="Dr. Vikram Menon",
            role="faculty",
            department="Electronics & Communication",
            designation="Professor & Lab Director",
            cabin_room="ECE Block, Room 205 (VLSI Lab)",
            phone="+91 98450 99887",
            specialization="VLSI Design, Embedded Systems, IoT Architectures",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
            cgpa_or_experience="16 Years Experience",
        ),
        User(
            identifier="FAC-ME-015",
            email="sunil.kulkarni@college.edu",
            hashed_password=hashed_pwd,
            name="Dr. Sunil Kulkarni",
            role="faculty",
            department="Mechanical Engineering",
            designation="Associate Professor & Workshop Head",
            cabin_room="Mechanical Workshop Block, Cabin M-12",
            phone="+91 93211 44332",
            specialization="Robotics, Mechatronics, Fluid Dynamics",
            avatar_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
            cgpa_or_experience="14 Years Experience",
        ),
        User(
            identifier="FAC-IT-067",
            email="neha.kapoor@college.edu",
            hashed_password=hashed_pwd,
            name="Dr. Neha Kapoor",
            role="faculty",
            department="Information Technology",
            designation="Assistant Professor & Placement Mentor",
            cabin_room="IT Block, Cabin 108",
            phone="+91 97110 88776",
            specialization="Cybersecurity, Cryptography, Blockchain Networks",
            avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
            cgpa_or_experience="8 Years Experience",
        ),
    ]
    db.add_all(faculty_users)
    db.commit()

    # 3. STUDENT USERS
    student_users = [
        User(
            identifier="22CS104",
            email="priyansh@college.edu",
            hashed_password=hashed_pwd,
            name="Priyansh Bansal",
            role="student",
            department="Computer Science & Engineering",
            designation="B.Tech (CSE) - 6th Semester",
            cabin_room=None,
            phone="+91 98111 22334",
            specialization="Major: AI & Systems Track",
            avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
            cgpa_or_experience="8.92 CGPA",
            semester=6,
        ),
        User(
            identifier="22CS108",
            email="ananya.verma@college.edu",
            hashed_password=hashed_pwd,
            name="Ananya Verma",
            role="student",
            department="Computer Science & Engineering",
            designation="B.Tech (CSE) - 6th Semester",
            cabin_room=None,
            phone="+91 98222 33445",
            specialization="Major: Full Stack & Cloud",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            cgpa_or_experience="9.35 CGPA",
            semester=6,
        ),
        User(
            identifier="23EC052",
            email="rohan.gupta@college.edu",
            hashed_password=hashed_pwd,
            name="Rohan Gupta",
            role="student",
            department="Electronics & Communication",
            designation="B.Tech (ECE) - 4th Semester",
            cabin_room=None,
            phone="+91 98333 44556",
            specialization="Major: Embedded Systems",
            avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
            cgpa_or_experience="8.40 CGPA",
            semester=4,
        ),
    ]
    db.add_all(student_users)
    db.commit()

    # Re-fetch users
    f_sharma = db.query(User).filter(User.identifier == "FAC-CS-042").first()
    f_anita = db.query(User).filter(User.identifier == "FAC-CS-109").first()
    f_menon = db.query(User).filter(User.identifier == "FAC-EC-028").first()
    f_kulkarni = db.query(User).filter(User.identifier == "FAC-ME-015").first()
    f_neha = db.query(User).filter(User.identifier == "FAC-IT-067").first()

    s_priyansh = db.query(User).filter(User.identifier == "22CS104").first()
    s_ananya = db.query(User).filter(User.identifier == "22CS108").first()
    s_rohan = db.query(User).filter(User.identifier == "23EC052").first()

    # 4. FACULTY AVAILABILITY SLOTS
    slots = [
        # Dr. Rajesh Sharma (CS HOD)
        Slot(faculty_id=f_sharma.id, day_of_week="Monday", start_time="10:00 AM", end_time="11:30 AM", venue="Cabin 304, Block-A", max_students=3),
        Slot(faculty_id=f_sharma.id, day_of_week="Wednesday", start_time="02:00 PM", end_time="03:30 PM", venue="Cabin 304, Block-A", max_students=3),
        Slot(faculty_id=f_sharma.id, day_of_week="Friday", start_time="11:00 AM", end_time="12:30 PM", venue="Cabin 304 / Google Meet", max_students=2),
        
        # Dr. Anita Deshmukh (AI/ML)
        Slot(faculty_id=f_anita.id, day_of_week="Tuesday", start_time="11:00 AM", end_time="01:00 PM", venue="Cabin 312, Block-A", max_students=4),
        Slot(faculty_id=f_anita.id, day_of_week="Thursday", start_time="03:00 PM", end_time="04:30 PM", venue="AI Research Lab (Room 401)", max_students=3),
        Slot(faculty_id=f_anita.id, day_of_week="Friday", start_time="02:30 PM", end_time="04:00 PM", venue="Cabin 312 / Google Meet", max_students=2),

        # Dr. Vikram Menon (ECE)
        Slot(faculty_id=f_menon.id, day_of_week="Monday", start_time="03:00 PM", end_time="04:30 PM", venue="VLSI Lab, Room 205", max_students=3),
        Slot(faculty_id=f_menon.id, day_of_week="Thursday", start_time="10:00 AM", end_time="11:30 AM", venue="VLSI Lab, Room 205", max_students=2),

        # Dr. Sunil Kulkarni (ME)
        Slot(faculty_id=f_kulkarni.id, day_of_week="Tuesday", start_time="02:00 PM", end_time="04:00 PM", venue="Cabin M-12", max_students=3),
        Slot(faculty_id=f_kulkarni.id, day_of_week="Thursday", start_time="02:00 PM", end_time="04:00 PM", venue="Robotics Workshop", max_students=4),

        # Dr. Neha Kapoor (IT)
        Slot(faculty_id=f_neha.id, day_of_week="Monday", start_time="11:30 AM", end_time="01:00 PM", venue="Cabin 108, IT Block", max_students=3),
        Slot(faculty_id=f_neha.id, day_of_week="Wednesday", start_time="10:00 AM", end_time="11:30 AM", venue="Cyber Lab 1", max_students=3),
    ]
    db.add_all(slots)
    db.commit()

    # 5. SAMPLE APPOINTMENTS
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    tomorrow_str = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    next_week_str = (datetime.date.today() + datetime.timedelta(days=4)).strftime("%Y-%m-%d")

    appointments = [
        Appointment(
            appointment_code="APP-2026-1041",
            student_id=s_priyansh.id,
            faculty_id=f_sharma.id,
            date=today_str,
            time_slot="10:00 AM - 10:30 AM",
            purpose_category="Project Guidance",
            purpose_details="Review of Capstone Project architecture diagram and consensus algorithm benchmark results.",
            urgency="HIGH",
            meeting_mode="CABIN",
            status="APPROVED",
            faculty_remarks="Approved. Please bring the system architecture printed report and prototype code on laptop.",
            cabin_or_link="Academic Block-A, Cabin 304",
        ),
        Appointment(
            appointment_code="APP-2026-1042",
            student_id=s_priyansh.id,
            faculty_id=f_anita.id,
            date=tomorrow_str,
            time_slot="11:00 AM - 11:30 AM",
            purpose_category="Research Discussion",
            purpose_details="Discussing Transformer attention fine-tuning paper submission for upcoming IEEE conference.",
            urgency="NORMAL",
            meeting_mode="LAB",
            status="PENDING",
            faculty_remarks=None,
            cabin_or_link="AI Research Lab (Room 401)",
        ),
        Appointment(
            appointment_code="APP-2026-1081",
            student_id=s_ananya.id,
            faculty_id=f_sharma.id,
            date=tomorrow_str,
            time_slot="02:00 PM - 02:30 PM",
            purpose_category="Recommendation Letter",
            purpose_details="Request for Letter of Recommendation (LoR) for Fall 2027 Masters in Computer Science application.",
            urgency="URGENT",
            meeting_mode="CABIN",
            status="APPROVED",
            faculty_remarks="Slot confirmed. Bring your CV, statement of purpose draft, and grade transcript.",
            cabin_or_link="Academic Block-A, Cabin 304",
        ),
        Appointment(
            appointment_code="APP-2026-0521",
            student_id=s_rohan.id,
            faculty_id=f_menon.id,
            date=next_week_str,
            time_slot="03:00 PM - 03:30 PM",
            purpose_category="Doubt Clarification",
            purpose_details="Clarification on FPGA timing analysis and Verilog state machine synthesis issues in Assignment 3.",
            urgency="NORMAL",
            meeting_mode="CABIN",
            status="PENDING",
            faculty_remarks=None,
            cabin_or_link="VLSI Lab, Room 205",
        ),
        Appointment(
            appointment_code="APP-2026-1040",
            student_id=s_priyansh.id,
            faculty_id=f_neha.id,
            date="2026-08-20",
            time_slot="11:30 AM - 12:00 PM",
            purpose_category="Attendance / Leave",
            purpose_details="Attendance regularization for Hackathon representation at IIT Delhi.",
            urgency="NORMAL",
            meeting_mode="CABIN",
            status="COMPLETED",
            faculty_remarks="Certificate verified. Attendance compensated for 18th-20th August.",
            cabin_or_link="IT Block, Cabin 108",
        ),
    ]
    db.add_all(appointments)
    db.commit()

    # 6. ERP NOTICES
    notices = [
        Notice(
            title="Faculty Office Hours & Appointment Booking Protocol for Odd Semester 2026-27",
            category="ACADEMIC",
            date="2026-08-25",
            content="All undergraduate and postgraduate students are requested to book prior slots via this ERP portal before visiting faculty cabins to avoid queue congestions. For urgent thesis/capstone sign-offs, mark urgency as 'HIGH'.",
            posted_by="Office of Dean (Academics)",
            is_pinned=True,
        ),
        Notice(
            title="Mid-Term Major Project Progress Review Schedule Published",
            category="EXAM",
            date="2026-08-26",
            content="CSE & IT department 6th and 7th semester students must book a 30-minute review slot with their respective project guides between 1st Sept and 10th Sept 2026.",
            posted_by="HOD, Computer Science & Engineering",
            is_pinned=True,
        ),
        Notice(
            title="Guidance for Requesting Letters of Recommendation (LoR)",
            category="FACULTY",
            date="2026-08-24",
            content="Students applying for higher studies abroad must schedule an in-person meeting with faculty at least 3 weeks prior to university application deadlines with relevant academic proofs.",
            posted_by="Faculty Advisory Council",
            is_pinned=False,
        ),
    ]
    db.add_all(notices)
    db.commit()

    # Seed new features
    seed_new_features(db)

    print("Database seeding completed successfully!")
    db.close()


def seed_new_features(db: Session):
    f_sharma = db.query(User).filter(User.identifier == "FAC-CS-042").first()
    f_anita = db.query(User).filter(User.identifier == "FAC-CS-109").first()
    f_menon = db.query(User).filter(User.identifier == "FAC-EC-028").first()

    s_priyansh = db.query(User).filter(User.identifier == "22CS104").first()
    s_ananya = db.query(User).filter(User.identifier == "22CS108").first()
    s_rohan = db.query(User).filter(User.identifier == "23EC052").first()

    if not f_sharma or not s_priyansh:
        print("Required users not found, aborting new features seed.")
        return

    print("Seeding Courses, Enrollments, Schedules, Attendance, Assignments & Communication Bridge...")

    # 1. COURSES
    courses = [
        Course(
            code="CS501",
            name="Advanced Operating Systems & Kernel Internals",
            department="Computer Science & Engineering",
            semester=6,
            credits=4,
            faculty_id=f_sharma.id,
            description="Process synchronization, virtual memory paging algorithms, Linux device drivers, and distributed file systems."
        ),
        Course(
            code="CS502",
            name="Artificial Intelligence & Deep Learning",
            department="Computer Science & Engineering",
            semester=6,
            credits=4,
            faculty_id=f_anita.id,
            description="Search heuristics, game trees, neural network backprop, attention mechanisms, and computer vision transformers."
        ),
        Course(
            code="CS503",
            name="Cloud Computing & Microservice Systems",
            department="Computer Science & Engineering",
            semester=6,
            credits=3,
            faculty_id=f_sharma.id,
            description="Containerization, Docker, Kubernetes orchestrations, serverless pipelines, and distributed consensus."
        ),
        Course(
            code="CS505L",
            name="AI & Deep Learning Systems Laboratory",
            department="Computer Science & Engineering",
            semester=6,
            credits=2,
            faculty_id=f_anita.id,
            description="Hands-on PyTorch modeling, CUDA acceleration, hyperparameter tuning, and LLM fine-tuning pipelines."
        ),
        Course(
            code="EC301",
            name="VLSI Design & Hardware Description Systems",
            department="Electronics & Communication",
            semester=4,
            credits=4,
            faculty_id=f_menon.id,
            description="CMOS logic design, Verilog HDL coding, ASIC synthesis, and FPGA prototyping."
        ),
    ]
    db.add_all(courses)
    db.commit()

    c_os = db.query(Course).filter(Course.code == "CS501").first()
    c_ai = db.query(Course).filter(Course.code == "CS502").first()
    c_cloud = db.query(Course).filter(Course.code == "CS503").first()
    c_lab = db.query(Course).filter(Course.code == "CS505L").first()
    c_vlsi = db.query(Course).filter(Course.code == "EC301").first()

    # 2. ENROLLMENTS
    enrollments = [
        # Priyansh (CSE)
        CourseEnrollment(course_id=c_os.id, student_id=s_priyansh.id),
        CourseEnrollment(course_id=c_ai.id, student_id=s_priyansh.id),
        CourseEnrollment(course_id=c_cloud.id, student_id=s_priyansh.id),
        CourseEnrollment(course_id=c_lab.id, student_id=s_priyansh.id),
        # Ananya (CSE)
        CourseEnrollment(course_id=c_os.id, student_id=s_ananya.id),
        CourseEnrollment(course_id=c_ai.id, student_id=s_ananya.id),
        CourseEnrollment(course_id=c_cloud.id, student_id=s_ananya.id),
        CourseEnrollment(course_id=c_lab.id, student_id=s_ananya.id),
        # Rohan (ECE)
        CourseEnrollment(course_id=c_vlsi.id, student_id=s_rohan.id),
    ]
    db.add_all(enrollments)
    db.commit()

    # 3. WEEKLY SCHEDULE ITEMS
    schedules = [
        # Dr. Rajesh Sharma (Faculty)
        ScheduleItem(user_id=f_sharma.id, day_of_week="Monday", start_time="09:00 AM", end_time="10:00 AM", course_code="CS501", subject_name="Advanced Operating Systems", venue="LH-204, Academic Block-A", session_type="LECTURE", batch="B.Tech CSE - Sec A"),
        ScheduleItem(user_id=f_sharma.id, day_of_week="Monday", start_time="11:30 AM", end_time="01:00 PM", course_code="CS503", subject_name="Cloud Computing & Microservices", venue="LH-205, Academic Block-A", session_type="LECTURE", batch="B.Tech CSE - Sec B"),
        ScheduleItem(user_id=f_sharma.id, day_of_week="Tuesday", start_time="10:00 AM", end_time="11:30 AM", course_code="CS501", subject_name="Advanced Operating Systems", venue="LH-204, Academic Block-A", session_type="LECTURE", batch="B.Tech CSE - Sec A"),
        ScheduleItem(user_id=f_sharma.id, day_of_week="Wednesday", start_time="09:00 AM", end_time="10:00 AM", course_code="CS503", subject_name="Cloud Computing & Microservices", venue="LH-205, Academic Block-A", session_type="LECTURE", batch="B.Tech CSE - Sec B"),
        ScheduleItem(user_id=f_sharma.id, day_of_week="Thursday", start_time="10:00 AM", end_time="11:00 AM", course_code="CS501", subject_name="Advanced Operating Systems", venue="LH-204, Academic Block-A", session_type="LECTURE", batch="B.Tech CSE - Sec A"),
        ScheduleItem(user_id=f_sharma.id, day_of_week="Friday", start_time="09:00 AM", end_time="11:00 AM", course_code="CS501", subject_name="OS Kernel & Device Driver Lab", venue="Systems Lab 2, 3rd Floor", session_type="LAB", batch="B.Tech CSE - Sec A"),

        # Dr. Anita Deshmukh (Faculty)
        ScheduleItem(user_id=f_anita.id, day_of_week="Monday", start_time="10:00 AM", end_time="11:30 AM", course_code="CS502", subject_name="Artificial Intelligence & Deep Learning", venue="LH-301, Block-A", session_type="LECTURE", batch="B.Tech CSE - Sec A"),
        ScheduleItem(user_id=f_anita.id, day_of_week="Tuesday", start_time="02:00 PM", end_time="04:00 PM", course_code="CS505L", subject_name="AI & Deep Learning Systems Lab", venue="AI Research Lab (Room 401)", session_type="LAB", batch="B.Tech CSE - Sec A"),
        ScheduleItem(user_id=f_anita.id, day_of_week="Wednesday", start_time="11:00 AM", end_time="12:30 PM", course_code="CS502", subject_name="Artificial Intelligence & Deep Learning", venue="LH-301, Block-A", session_type="LECTURE", batch="B.Tech CSE - Sec A"),
        ScheduleItem(user_id=f_anita.id, day_of_week="Thursday", start_time="09:00 AM", end_time="10:30 AM", course_code="CS502", subject_name="Artificial Intelligence & Deep Learning", venue="LH-301, Block-A", session_type="LECTURE", batch="B.Tech CSE - Sec A"),
        ScheduleItem(user_id=f_anita.id, day_of_week="Friday", start_time="02:00 PM", end_time="04:00 PM", course_code="CS505L", subject_name="AI & Deep Learning Systems Lab", venue="AI Research Lab (Room 401)", session_type="LAB", batch="B.Tech CSE - Sec B"),

        # Priyansh Bansal (Student Schedule)
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Monday", start_time="09:00 AM", end_time="10:00 AM", course_code="CS501", subject_name="Advanced Operating Systems (Dr. Rajesh Sharma)", venue="LH-204, Block-A", session_type="LECTURE", batch="CSE-6A"),
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Monday", start_time="10:00 AM", end_time="11:30 AM", course_code="CS502", subject_name="Artificial Intelligence (Dr. Anita Deshmukh)", venue="LH-301, Block-A", session_type="LECTURE", batch="CSE-6A"),
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Monday", start_time="11:30 AM", end_time="01:00 PM", course_code="CS503", subject_name="Cloud Computing (Dr. Rajesh Sharma)", venue="LH-205, Block-A", session_type="LECTURE", batch="CSE-6A"),
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Tuesday", start_time="10:00 AM", end_time="11:30 AM", course_code="CS501", subject_name="Advanced Operating Systems (Dr. Rajesh Sharma)", venue="LH-204, Block-A", session_type="LECTURE", batch="CSE-6A"),
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Tuesday", start_time="02:00 PM", end_time="04:00 PM", course_code="CS505L", subject_name="AI Lab (Dr. Anita Deshmukh)", venue="AI Lab 401", session_type="LAB", batch="CSE-6A"),
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Wednesday", start_time="09:00 AM", end_time="10:00 AM", course_code="CS503", subject_name="Cloud Computing (Dr. Rajesh Sharma)", venue="LH-205, Block-A", session_type="LECTURE", batch="CSE-6A"),
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Wednesday", start_time="11:00 AM", end_time="12:30 PM", course_code="CS502", subject_name="Artificial Intelligence (Dr. Anita Deshmukh)", venue="LH-301, Block-A", session_type="LECTURE", batch="CSE-6A"),
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Thursday", start_time="09:00 AM", end_time="10:30 AM", course_code="CS502", subject_name="Artificial Intelligence (Dr. Anita Deshmukh)", venue="LH-301, Block-A", session_type="LECTURE", batch="CSE-6A"),
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Thursday", start_time="10:00 AM", end_time="11:00 AM", course_code="CS501", subject_name="Advanced Operating Systems (Dr. Rajesh Sharma)", venue="LH-204, Block-A", session_type="LECTURE", batch="CSE-6A"),
        ScheduleItem(user_id=s_priyansh.id, day_of_week="Friday", start_time="09:00 AM", end_time="11:00 AM", course_code="CS501", subject_name="OS Kernel Lab (Dr. Rajesh Sharma)", venue="Systems Lab 2", session_type="LAB", batch="CSE-6A"),
    ]
    db.add_all(schedules)
    db.commit()

    # 4. HISTORICAL ATTENDANCE RECORDS (Past ~15 lecture dates)
    attendance_dates = [
        "2026-08-18", "2026-08-20", "2026-08-22", "2026-08-25", "2026-08-27",
        "2026-08-29", "2026-09-01", "2026-09-03", "2026-09-05", "2026-09-08",
        "2026-09-10", "2026-09-12", "2026-09-15", "2026-09-17"
    ]
    
    att_records = []
    # CS501 (OS): Priyansh attends almost all (13/14 = 92.8%)
    for i, d in enumerate(attendance_dates):
        p_status = "ABSENT" if i == 6 else "PRESENT"
        p_rem = "Sick Leave with Slip" if i == 6 else None
        att_records.append(AttendanceRecord(course_id=c_os.id, faculty_id=f_sharma.id, student_id=s_priyansh.id, date=d, session_title=f"OS Lecture #{i+1}", time_slot="09:00 AM - 10:00 AM", status=p_status, remarks=p_rem))
        att_records.append(AttendanceRecord(course_id=c_os.id, faculty_id=f_sharma.id, student_id=s_ananya.id, date=d, session_title=f"OS Lecture #{i+1}", time_slot="09:00 AM - 10:00 AM", status="PRESENT", remarks=None))

    # CS502 (AI): Priyansh attends all (14/14 = 100%)
    for i, d in enumerate(attendance_dates):
        att_records.append(AttendanceRecord(course_id=c_ai.id, faculty_id=f_anita.id, student_id=s_priyansh.id, date=d, session_title=f"AI Lecture #{i+1}", time_slot="10:00 AM - 11:30 AM", status="PRESENT", remarks=None))
        att_records.append(AttendanceRecord(course_id=c_ai.id, faculty_id=f_anita.id, student_id=s_ananya.id, date=d, session_title=f"AI Lecture #{i+1}", time_slot="10:00 AM - 11:30 AM", status="PRESENT", remarks=None))

    # CS503 (Cloud): Priyansh has attendance shortage! (9/14 = 64.3% -> triggers <75% warning!)
    cloud_absent_indices = {2, 4, 7, 9, 11}
    for i, d in enumerate(attendance_dates):
        p_status = "ABSENT" if i in cloud_absent_indices else "PRESENT"
        p_rem = "Unexcused Absence" if i in cloud_absent_indices else None
        att_records.append(AttendanceRecord(course_id=c_cloud.id, faculty_id=f_sharma.id, student_id=s_priyansh.id, date=d, session_title=f"Cloud Systems #{i+1}", time_slot="11:30 AM - 01:00 PM", status=p_status, remarks=p_rem))
        att_records.append(AttendanceRecord(course_id=c_cloud.id, faculty_id=f_sharma.id, student_id=s_ananya.id, date=d, session_title=f"Cloud Systems #{i+1}", time_slot="11:30 AM - 01:00 PM", status="PRESENT", remarks=None))

    # CS505L (Lab): 6 sessions
    for i, d in enumerate(attendance_dates[:6]):
        att_records.append(AttendanceRecord(course_id=c_lab.id, faculty_id=f_anita.id, student_id=s_priyansh.id, date=d, session_title=f"AI Practical Lab #{i+1}", time_slot="02:00 PM - 04:00 PM", status="PRESENT", remarks=None))
        att_records.append(AttendanceRecord(course_id=c_lab.id, faculty_id=f_anita.id, student_id=s_ananya.id, date=d, session_title=f"AI Practical Lab #{i+1}", time_slot="02:00 PM - 04:00 PM", status="PRESENT", remarks=None))

    db.add_all(att_records)
    db.commit()

    # 5. ASSIGNMENTS
    assignments = [
        Assignment(
            course_id=c_os.id,
            faculty_id=f_sharma.id,
            title="Assignment 2: Virtual Memory LRU & FIFO Simulation",
            description="Implement a memory management simulator in C++ or Python demonstrating Belady's Anomaly in FIFO and proving optimal page replacement vs LRU. Include hit/fault ratio graphs across frame sizes 3 to 10.",
            due_date="2026-09-24 23:59",
            total_marks=50,
            submission_format="PDF Report + GitHub Repository URL",
            attachment_hint="problem_spec_os_assign2.pdf"
        ),
        Assignment(
            course_id=c_ai.id,
            faculty_id=f_anita.id,
            title="Lab Task 3: Vision Transformer vs ResNet on CIFAR-100",
            description="Implement a miniature Vision Transformer (ViT) with multi-head self-attention patch embeddings. Compare convergence speed, accuracy, and parameter efficiency against a ResNet-18 baseline.",
            due_date="2026-09-27 23:59",
            total_marks=40,
            submission_format="Jupyter Notebook (.ipynb) or Google Colab Link",
            attachment_hint="vit_cifar_guidelines.pdf"
        ),
        Assignment(
            course_id=c_cloud.id,
            faculty_id=f_sharma.id,
            title="Term Project Milestone 1: Dockerized Microservices & Helm Charts",
            description="Architect a 3-tier microservice application (Auth, Catalog, Order Processing). Package with Docker Compose and produce Kubernetes deployment manifests with ingress controller rules.",
            due_date="2026-10-05 18:00",
            total_marks=100,
            submission_format="Git Repository + Architecture Report PDF",
            attachment_hint="cloud_project_spec.pdf"
        ),
        Assignment(
            course_id=c_os.id,
            faculty_id=f_sharma.id,
            title="Assignment 1: CPU Scheduling Benchmarks (FCFS, SJF, Round Robin)",
            description="Build a process scheduler simulation with context switch overhead and calculate average waiting time and turnaround time for burst sequences.",
            due_date="2026-08-30 23:59",
            total_marks=50,
            submission_format="PDF Report + Source Code",
            attachment_hint="cpu_scheduling_spec.pdf"
        ),
    ]
    db.add_all(assignments)
    db.commit()

    a_os2 = db.query(Assignment).filter(Assignment.title.like("%Virtual Memory%")).first()
    a_ai3 = db.query(Assignment).filter(Assignment.title.like("%Vision Transformer%")).first()
    a_os1 = db.query(Assignment).filter(Assignment.title.like("%CPU Scheduling%")).first()

    # 6. SUBMISSIONS
    submissions = [
        # For Assignment 1 (Graded)
        Submission(
            assignment_id=a_os1.id,
            student_id=s_priyansh.id,
            submission_text="Completed C++ implementation with process control block (PCB) queues. Comparative performance graphs generated with Matplotlib.",
            attachment_name="22CS104_Priyansh_OS_Assign1.pdf",
            attachment_url="https://github.com/priyansh-bansal/os-scheduler-simulation",
            status="GRADED",
            marks_awarded=47,
            faculty_feedback="Excellent work on edge cases and starvation prevention in priority queues. Outstanding Gantt chart visuals.",
            submitted_at=datetime.datetime.utcnow() - datetime.timedelta(days=18),
            graded_at=datetime.datetime.utcnow() - datetime.timedelta(days=14)
        ),
        Submission(
            assignment_id=a_os1.id,
            student_id=s_ananya.id,
            submission_text="Python implementation of multi-level feedback queue with aging mechanism.",
            attachment_name="22CS108_Ananya_Scheduler.pdf",
            attachment_url="https://github.com/ananya-v/mlfq-simulation",
            status="GRADED",
            marks_awarded=49,
            faculty_feedback="Exceptional documentation and asymptotic time complexity proofs.",
            submitted_at=datetime.datetime.utcnow() - datetime.timedelta(days=19),
            graded_at=datetime.datetime.utcnow() - datetime.timedelta(days=14)
        ),
        # For Assignment 2 (Submitted - Pending Faculty Review!)
        Submission(
            assignment_id=a_os2.id,
            student_id=s_priyansh.id,
            submission_text="LRU cache implemented with doubly linked list + hash map (O(1) lookups). Simulation verified across 10,000 synthetic page references.",
            attachment_name="22CS104_OS_Assign2_Submission.pdf",
            attachment_url="https://github.com/priyansh-bansal/os-virtual-memory-lru",
            status="SUBMITTED",
            marks_awarded=None,
            faculty_feedback=None,
            submitted_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5)
        ),
    ]
    db.add_all(submissions)
    db.commit()

    # 7. MULTI-PURPOSE COMMUNICATION BRIDGE MESSAGES
    messages = [
        # Thread 1: Academic Doubt from Priyansh to Dr. Rajesh Sharma
        CommunicationMessage(
            sender_id=s_priyansh.id,
            receiver_id=f_sharma.id,
            course_id=c_os.id,
            subject="Doubt regarding Belady's Anomaly and Stack Algorithms in CS501",
            content="Respected Dr. Sharma,\n\nDuring Monday's lecture on Virtual Memory, you mentioned that Belady's anomaly occurs in FIFO but can never happen in LRU or Optimal because they belong to the class of 'Stack Algorithms'. Could you please provide intuition or reference notes on how the subset property M(t, n) ⊆ M(t, n+1) mathematically prevents anomalies?",
            message_type="DOUBT_CLEARANCE",
            parent_id=None,
            is_read=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=2, hours=3)
        ),
        # Thread 2: Course Announcement broadcast by Dr. Anita Deshmukh
        CommunicationMessage(
            sender_id=f_anita.id,
            receiver_id=None,
            course_id=c_ai.id,
            subject="GPU Cluster Credentials Activated for Deep Learning Lab (CS505L)",
            content="Official Notice to all students of CSE 6th Semester enrolled in CS502 & CS505L:\n\nThe High-Performance GPU Computing Cluster (4x NVIDIA A100 nodes) has been provisioned with your institutional roll number logins. SSH keys have been synchronized. Please utilize this compute quota for Lab Task 3 training runs. Do not run unattended scripts exceeding 3 hours.",
            message_type="ANNOUNCEMENT",
            parent_id=None,
            is_read=False,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1, hours=6)
        ),
        # Thread 3: Direct Project Query from Ananya to Dr. Sharma
        CommunicationMessage(
            sender_id=s_ananya.id,
            receiver_id=f_sharma.id,
            course_id=c_cloud.id,
            subject="Query regarding CS503 Microservice Architecture Protocol",
            content="Dear Professor Sharma, for the Term Project Milestone 1, are we permitted to use gRPC / Protocol Buffers for inter-service RPC communication instead of REST JSON endpoints? We believe gRPC provides superior latency for our order processing pipeline.",
            message_type="DIRECT_QUERY",
            parent_id=None,
            is_read=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
        ),
    ]
    db.add_all(messages)
    db.commit()

    # Reply to Thread 1 from Dr. Sharma
    t1 = db.query(CommunicationMessage).filter(CommunicationMessage.subject.like("%Belady%")).first()
    if t1:
        reply1 = CommunicationMessage(
            sender_id=f_sharma.id,
            receiver_id=s_priyansh.id,
            course_id=c_os.id,
            subject="Re: Doubt regarding Belady's Anomaly and Stack Algorithms in CS501",
            content="Dear Priyansh,\n\nExcellent observation. In a stack algorithm, the set of pages present in memory with n frames is guaranteed to be a strict subset of the pages present if we had n+1 frames at any instant t. Therefore, any page reference that results in a cache hit with n frames will also result in a hit with n+1 frames. Since misses cannot increase when adding memory, Belady's anomaly cannot occur. Review Section 9.4 in Silberschatz. I can walk you through the inductive proof during Thursday office hours.",
            message_type="DOUBT_CLEARANCE",
            parent_id=t1.id,
            is_read=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1, hours=20)
        )
        db.add(reply1)
        db.commit()

    # Reply to Thread 3 from Dr. Sharma
    t3 = db.query(CommunicationMessage).filter(CommunicationMessage.subject.like("%gRPC%")).first()
    if t3:
        reply3 = CommunicationMessage(
            sender_id=f_sharma.id,
            receiver_id=s_ananya.id,
            course_id=c_cloud.id,
            subject="Re: Query regarding CS503 Microservice Architecture Protocol",
            content="Hello Ananya,\n\nYes, using gRPC with Protobuf is strongly encouraged for high-throughput internal RPCs! Ensure your service definitions (.proto files) and generated stubs are committed into the repository.",
            message_type="DIRECT_QUERY",
            parent_id=t3.id,
            is_read=False,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=14)
        )
        db.add(reply3)
        db.commit()

    print("All new feature data seeded successfully!")


def seed_faculty_hr_data(db: Session):
    faculty_users = db.query(User).filter(User.role == "faculty").all()
    if not faculty_users:
        return

    today = datetime.date.today()
    admin = db.query(User).filter(User.role == "admin").first()

    # Generate dates for past 20 days (skip Sundays)
    dates = []
    for i in range(20, 0, -1):
        d = today - datetime.timedelta(days=i)
        if d.weekday() != 6: # skip Sunday
            dates.append(d)

    # Seed past records for each faculty
    for fac in faculty_users:
        for idx, d in enumerate(dates):
            date_str = d.strftime("%Y-%m-%d")
            # Create a realistic variation
            if (fac.id + idx) % 17 == 0:
                # On duty
                rec = FacultyAttendance(
                    faculty_id=fac.id,
                    date=date_str,
                    check_in_time="09:00 AM",
                    check_out_time="05:00 PM",
                    status="ON_DUTY",
                    work_mode="FIELD_DUTY",
                    location_or_cabin="Conference / External Board",
                    working_hours=8.0,
                    remarks="Official Academic Deputation",
                    marked_by_admin=True,
                    is_regularized=True
                )
            elif (fac.id + idx) % 13 == 0:
                # Leave
                rec = FacultyAttendance(
                    faculty_id=fac.id,
                    date=date_str,
                    check_in_time=None,
                    check_out_time=None,
                    status="ON_LEAVE",
                    work_mode="IN_CAMPUS",
                    location_or_cabin=fac.cabin_room,
                    working_hours=0.0,
                    remarks="Casual Leave Approved",
                    marked_by_admin=True,
                    is_regularized=True
                )
            elif (fac.id + idx) % 11 == 0:
                # Half day
                rec = FacultyAttendance(
                    faculty_id=fac.id,
                    date=date_str,
                    check_in_time="09:10 AM",
                    check_out_time="01:15 PM",
                    status="HALF_DAY",
                    work_mode="IN_CAMPUS",
                    location_or_cabin=fac.cabin_room,
                    working_hours=4.1,
                    remarks="Half Day - Medical appointment",
                    marked_by_admin=False,
                    is_regularized=False
                )
            else:
                # Regular present
                in_min = 45 + ((fac.id * 3 + idx) % 25)
                in_hour = 8 if in_min < 60 else 9
                in_min_val = in_min if in_min < 60 else (in_min - 60)
                in_time = f"{in_hour:02d}:{in_min_val:02d} AM"
                out_time = "05:15 PM"
                rec = FacultyAttendance(
                    faculty_id=fac.id,
                    date=date_str,
                    check_in_time=in_time,
                    check_out_time=out_time,
                    status="PRESENT",
                    work_mode="IN_CAMPUS",
                    location_or_cabin=fac.cabin_room,
                    working_hours=8.25,
                    remarks="Regular Department Duty & Lectures",
                    marked_by_admin=False,
                    is_regularized=False
                )
            db.add(rec)

    # Seed today's records
    today_str = today.strftime("%Y-%m-%d")
    f_sharma = next((f for f in faculty_users if "FAC-CS-042" in f.identifier), faculty_users[0])
    f_anita = next((f for f in faculty_users if "FAC-CS-109" in f.identifier), None)
    f_menon = next((f for f in faculty_users if "FAC-EC-028" in f.identifier), None)
    f_sunil = next((f for f in faculty_users if "FAC-ME-015" in f.identifier), None)

    if f_sharma:
        db.add(FacultyAttendance(
            faculty_id=f_sharma.id,
            date=today_str,
            check_in_time="08:50 AM",
            check_out_time=None,
            status="PRESENT",
            work_mode="IN_CAMPUS",
            location_or_cabin=f_sharma.cabin_room,
            work_summary="Conducted CS501 Operating Systems Lecture. Prepared lab rubric for semester project.",
            working_hours=0.0
        ))

    if f_anita:
        db.add(FacultyAttendance(
            faculty_id=f_anita.id,
            date=today_str,
            check_in_time="09:12 AM",
            check_out_time=None,
            status="PRESENT",
            work_mode="IN_CAMPUS",
            location_or_cabin=f_anita.cabin_room,
            work_summary="AI Lab session and student project mentoring in Cabin 312.",
            working_hours=0.0
        ))

    if f_menon:
        db.add(FacultyAttendance(
            faculty_id=f_menon.id,
            date=today_str,
            check_in_time="08:30 AM",
            check_out_time="04:45 PM",
            status="PRESENT",
            work_mode="IN_CAMPUS",
            location_or_cabin="VLSI Lab, Room 205",
            work_summary="FPGA synthesis evaluations and consultation slots completed.",
            working_hours=8.25
        ))

    if f_sunil:
        db.add(FacultyAttendance(
            faculty_id=f_sunil.id,
            date=today_str,
            check_in_time="09:00 AM",
            check_out_time="05:00 PM",
            status="ON_DUTY",
            work_mode="FIELD_DUTY",
            location_or_cabin="Industrial Visit Mentorship - Tata Motors",
            work_summary="Leading 4th Year Mechanical student delegation for manufacturing tour.",
            working_hours=8.0,
            marked_by_admin=True
        ))

    # Leaves
    leaves = [
        FacultyLeave(
            faculty_id=f_sharma.id,
            leave_type="CASUAL_LEAVE",
            start_date=(today - datetime.timedelta(days=7)).strftime("%Y-%m-%d"),
            end_date=(today - datetime.timedelta(days=7)).strftime("%Y-%m-%d"),
            total_days=1.0,
            reason="Family function and personal work.",
            status="APPROVED",
            reviewed_by=admin.id if admin else None,
            admin_remarks="Approved by Dean Office.",
            reviewed_at=datetime.datetime.utcnow() - datetime.timedelta(days=8)
        ),
        FacultyLeave(
            faculty_id=f_anita.id if f_anita else f_sharma.id,
            leave_type="DUTY_LEAVE_OD",
            start_date=(today + datetime.timedelta(days=3)).strftime("%Y-%m-%d"),
            end_date=(today + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            total_days=2.0,
            reason="Keynote speaker invitation at National AI & Machine Learning Symposium at IISc.",
            status="PENDING",
            applied_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
        ),
        FacultyLeave(
            faculty_id=f_sunil.id if f_sunil else f_sharma.id,
            leave_type="MEDICAL_LEAVE",
            start_date=(today + datetime.timedelta(days=5)).strftime("%Y-%m-%d"),
            end_date=(today + datetime.timedelta(days=6)).strftime("%Y-%m-%d"),
            total_days=2.0,
            reason="Post-operative knee physiotherapy routine as recommended by orthopedic doctor.",
            status="PENDING",
            applied_at=datetime.datetime.utcnow() - datetime.timedelta(hours=6)
        ),
    ]
    db.add_all(leaves)
    db.commit()
    print("Faculty HR & Attendance records seeded successfully!")


def seed_gradebook_and_calendar_data(db: Session):
    f_sharma = db.query(User).filter(User.identifier == "FAC-CS-042").first()
    f_anita = db.query(User).filter(User.identifier == "FAC-CS-109").first()
    f_menon = db.query(User).filter(User.identifier == "FAC-EC-028").first()

    s_priyansh = db.query(User).filter(User.identifier == "22CS104").first()
    s_ananya = db.query(User).filter(User.identifier == "22CS108").first()
    s_rohan = db.query(User).filter(User.identifier == "23EC052").first()

    c_os = db.query(Course).filter(Course.code == "CS501").first()
    c_ai = db.query(Course).filter(Course.code == "CS502").first()
    c_cloud = db.query(Course).filter(Course.code == "CS503").first()
    c_lab = db.query(Course).filter(Course.code == "CS505L").first()
    c_vlsi = db.query(Course).filter(Course.code == "EC301").first()

    if not c_os or not s_priyansh:
        return

    today = datetime.date.today()
    d_past_15 = (today - datetime.timedelta(days=15)).strftime("%Y-%m-%d")
    d_past_7 = (today - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
    d_upcoming_5 = (today + datetime.timedelta(days=5)).strftime("%Y-%m-%d")
    d_upcoming_12 = (today + datetime.timedelta(days=12)).strftime("%Y-%m-%d")

    # Assessments
    assessments = [
        # CS501
        Assessment(
            course_id=c_os.id,
            faculty_id=f_sharma.id,
            title="Operating System Concurrency & Mutex Quiz",
            assessment_type="QUIZ",
            max_marks=20.0,
            weightage_percent=10.0,
            date=d_past_15,
            description="Theoretical MCQ and short answer test on Peterson algorithm, Semaphores, and Deadlock Banker's check."
        ),
        Assessment(
            course_id=c_os.id,
            faculty_id=f_sharma.id,
            title="Mid-Term Theory Examination: Kernel Architecture",
            assessment_type="MID_TERM",
            max_marks=50.0,
            weightage_percent=25.0,
            date=d_past_7,
            description="Comprehensive paper covering virtual memory, inverted page tables, multi-level feedback queues, and UNIX fork semantics."
        ),
        Assessment(
            course_id=c_os.id,
            faculty_id=f_sharma.id,
            title="Linux Kernel Device Driver Implementation Project",
            assessment_type="PROJECT",
            max_marks=100.0,
            weightage_percent=30.0,
            date=d_upcoming_12,
            description="Design and implement a character device driver in C that registers a major/minor number and handles ioctl read/write."
        ),

        # CS502
        Assessment(
            course_id=c_ai.id,
            faculty_id=f_anita.id,
            title="A* Heuristics & Adversarial Minimax Quiz",
            assessment_type="QUIZ",
            max_marks=25.0,
            weightage_percent=15.0,
            date=d_past_15,
            description="Search trees, admissible heuristics, alpha-beta pruning calculations, and CSP formulation."
        ),
        Assessment(
            course_id=c_ai.id,
            faculty_id=f_anita.id,
            title="Deep Learning Mid-Semester Assessment",
            assessment_type="MID_TERM",
            max_marks=50.0,
            weightage_percent=25.0,
            date=d_past_7,
            description="Backpropagation derivation, vanishing gradients, Adam optimizer equations, and CNN convolutional math."
        ),
        Assessment(
            course_id=c_ai.id,
            faculty_id=f_anita.id,
            title="Transformer Attention Vision Model Project",
            assessment_type="PROJECT",
            max_marks=100.0,
            weightage_percent=30.0,
            date=d_upcoming_5,
            description="Build a Vision Transformer (ViT) pipeline on CIFAR-100 with multi-head self-attention and report ablation metrics."
        ),

        # CS505L
        Assessment(
            course_id=c_lab.id,
            faculty_id=f_anita.id,
            title="Lab Practical Viva: PyTorch Tensor Operations",
            assessment_type="LAB_VIVA",
            max_marks=30.0,
            weightage_percent=20.0,
            date=d_past_7,
            description="Live coding demonstration of custom autograd functions and PyTorch DataLoader parallel batching."
        ),

        # EC301
        Assessment(
            course_id=c_vlsi.id,
            faculty_id=f_menon.id,
            title="Verilog Finite State Machine Synthesis Quiz",
            assessment_type="QUIZ",
            max_marks=25.0,
            weightage_percent=15.0,
            date=d_past_7,
            description="Mealy vs Moore state machines, timing constraints, setup/hold slack analysis."
        ),
    ]
    db.add_all(assessments)
    db.commit()

    # Re-fetch assessments
    a_os_quiz = db.query(Assessment).filter(Assessment.course_id == c_os.id, Assessment.assessment_type == "QUIZ").first()
    a_os_mid = db.query(Assessment).filter(Assessment.course_id == c_os.id, Assessment.assessment_type == "MID_TERM").first()
    a_ai_quiz = db.query(Assessment).filter(Assessment.course_id == c_ai.id, Assessment.assessment_type == "QUIZ").first()
    a_ai_mid = db.query(Assessment).filter(Assessment.course_id == c_ai.id, Assessment.assessment_type == "MID_TERM").first()
    a_lab_viva = db.query(Assessment).filter(Assessment.course_id == c_lab.id).first()
    a_vlsi_quiz = db.query(Assessment).filter(Assessment.course_id == c_vlsi.id).first()

    grades = [
        # Priyansh (22CS104)
        GradeRecord(
            assessment_id=a_os_quiz.id,
            student_id=s_priyansh.id,
            marks_obtained=18.5,
            letter_grade="A+",
            percentage=92.5,
            feedback="Excellent mastery of deadlock conditions and semaphore synchronization logic.",
            status="GRADED"
        ),
        GradeRecord(
            assessment_id=a_os_mid.id,
            student_id=s_priyansh.id,
            marks_obtained=44.0,
            letter_grade="A",
            percentage=88.0,
            feedback="Strong architectural reasoning on inverted page tables. Very well structured answers.",
            status="GRADED"
        ),
        GradeRecord(
            assessment_id=a_ai_quiz.id,
            student_id=s_priyansh.id,
            marks_obtained=23.0,
            letter_grade="A+",
            percentage=92.0,
            feedback="Flawless alpha-beta pruning trace on the game tree.",
            status="GRADED"
        ),
        GradeRecord(
            assessment_id=a_ai_mid.id,
            student_id=s_priyansh.id,
            marks_obtained=42.5,
            letter_grade="A",
            percentage=85.0,
            feedback="Good mathematical explanation of multi-head attention. Pay attention to softmax normalization constant.",
            status="GRADED"
        ),
        GradeRecord(
            assessment_id=a_lab_viva.id,
            student_id=s_priyansh.id,
            marks_obtained=28.0,
            letter_grade="A+",
            percentage=93.3,
            feedback="Great understanding of PyTorch CUDA memory management and profiling.",
            status="GRADED"
        ),

        # Ananya (22CS108)
        GradeRecord(
            assessment_id=a_os_quiz.id,
            student_id=s_ananya.id,
            marks_obtained=19.5,
            letter_grade="A+",
            percentage=97.5,
            feedback="Top score in class. Outstanding clarity on race conditions.",
            status="GRADED"
        ),
        GradeRecord(
            assessment_id=a_os_mid.id,
            student_id=s_ananya.id,
            marks_obtained=47.0,
            letter_grade="A+",
            percentage=94.0,
            feedback="Exemplary answers throughout the exam. High precision on cache hierarchies.",
            status="GRADED"
        ),
        GradeRecord(
            assessment_id=a_ai_quiz.id,
            student_id=s_ananya.id,
            marks_obtained=24.0,
            letter_grade="A+",
            percentage=96.0,
            feedback="Superb work on heuristic admissibility proof.",
            status="GRADED"
        ),
        GradeRecord(
            assessment_id=a_ai_mid.id,
            student_id=s_ananya.id,
            marks_obtained=46.0,
            letter_grade="A+",
            percentage=92.0,
            feedback="Comprehensive derivation of backprop with Adam second-order moments.",
            status="GRADED"
        ),

        # Rohan (23EC052)
        GradeRecord(
            assessment_id=a_vlsi_quiz.id,
            student_id=s_rohan.id,
            marks_obtained=21.0,
            letter_grade="A",
            percentage=84.0,
            feedback="Solid understanding of Verilog non-blocking assignments and clock domain crossings.",
            status="GRADED"
        ),
    ]
    db.add_all(grades)
    db.commit()
    print("Gradebook and Assessments successfully seeded!")



