from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse, JSONResponse
import json

router = APIRouter(tags=["AI Agent Readability & Discovery"])

LLMS_TXT_CONTENT = """# College ERP Portal - University Academic Operating System
> An enterprise-grade, role-based university academic operating system designed for administration, faculty, and students.

## System Overview
The platform organizes higher education academic workflows across three hierarchical roles:
- **ADMIN**: Highest system governance; oversees faculty workloads, courses, sections, student records, and institutional analytics.
- **FACULTY**: Manages course gradebooks, schedule-linked attendance sessions, assignments, student consultations, and HR punches.
- **STUDENT**: Tracks course attendance with smart 75% recovery formulas, prioritizes approaching deadlines, accesses academic transcripts with CGPA recomputations, and books faculty office hours.

## Machine-Readable Resources
- **Full Agent Documentation**: [/llms-full.txt](/llms-full.txt)
- **OpenAPI 3.0 Specification**: [/openapi.json](/openapi.json)
- **Interactive Swagger Documentation**: [/docs](/docs)
- **JSON Agent Manifest & Selectors**: [/api/agent/manifest](/api/agent/manifest)
- **Health Endpoint**: [/api/health](/api/health)

## Authentication Protocol
The API uses OAuth2 JWT Bearer Tokens.
1. Authenticate via `POST /api/auth/login` with JSON payload `{"identifier": "<roll_no_or_emp_id>", "password": "<password>"}`.
2. Receive JSON response: `{"access_token": "<jwt_token>", "token_type": "bearer", "user": {...}}`.
3. Include header on subsequent requests: `Authorization: Bearer <jwt_token>`.

### Quick Demo Personas
- **Student**: `priyansh@college.edu` (Roll No: `22CS104`) | Password: `password123`
- **Faculty**: `rajesh.sharma@college.edu` (Emp ID: `FAC-CS-042`) | Password: `password123`
- **Admin / Dean**: `admin@college.edu` (Admin ID: `ADMIN-01`) | Password: `password123`

## Core API Endpoints for AI Agents

### 1. Smart Insights & Recommendations
- `GET /api/insights/attendance-risk`: Calculates student attendance percentages and returns required recovery classes needed to restore >=75% compliance using formula: max(0, 3*held - 4*attended).
- `GET /api/insights/deadline-prioritization`: Categorizes upcoming student assignments by urgency (<24h Critical, <72h High, Upcoming).
- `GET /api/insights/faculty-recommendations?subject_query={subject}`: Returns matched faculty advisors with open consultation slots and domain specialties.
- `GET /api/insights/faculty-action-center`: Provides faculty with real-time pending grading count, low attendance student alerts, and schedule-linked attendance requirements.

### 2. Course Gradebook & Academic Transcripts
- `GET /api/gradebook/courses`: Lists courses assigned to faculty or enrolled by student.
- `GET /api/gradebook/course/{course_id}`: Returns complete gradebook matrix (assessments, student scores, class average, grade distribution).
- `POST /api/gradebook/assessment`: Creates course assessment (Assignment, Quiz, Exam, Lab, Project).
- `POST /api/gradebook/grades`: Records or updates batch student grades with automated letter grade calculation (A+, A, B+, B, C, F).
- `GET /api/gradebook/my-grades`: Retrieves student transcript history with weighted scores and cumulative CGPA.

### 3. Unified Academic Calendar
- `GET /api/calendar/events?year={YYYY}&month={MM}&view_type={MONTH|WEEK|DAY}`: Aggregates lecture schedules, faculty appointments, assignment deadlines, exams, and institutional events.

### 4. Schedule & Attendance Management
- `GET /api/schedule/my-schedule`: Retrieves weekly timetable sessions.
- `GET /api/attendance/course/{course_id}/roster?date={YYYY-MM-DD}`: Fetches course student roster with attendance history.
- `POST /api/attendance/take`: Records attendance session for Course + Section + Faculty + Date + Time.

### 5. Appointments & Office Hours
- `GET /api/slots/available?faculty_id={id}`: Lists open office-hour slots for a faculty member.
- `POST /api/appointments/request`: Requests consultation appointment (prevents double-booking).
- `POST /api/appointments/{id}/action`: Faculty action (ACCEPT, REJECT, CANCEL, COMPLETE).

### 6. Admin Ecosystem Management
- `GET /api/admin-management/institutional-analytics`: Campus KPIs (compliance rate, grading completion rate, active courses, enrollment counts).
- `GET /api/admin-management/faculty-workloads`: Multi-faculty workload tracking (weekly teaching hours, student headcounts, workload statuses).
- `POST /api/admin-management/courses`: Creates course and assigns faculty.
- `POST /api/admin-management/faculty`: Provisions new faculty profile.

## Browser Automation & DOM Selectors
For browser-based agents (Playwright, Puppeteer, Claude Computer Use):
- **Persona Tabs**: `[data-testid="persona-tab-student"]`, `[data-testid="persona-tab-faculty"]`, `[data-testid="persona-tab-admin"]`
- **Login Inputs**: `[data-testid="login-identifier-input"]`, `[data-testid="login-password-input"]`, `[data-testid="login-submit-button"]`
- **Quick Login Buttons**: `[data-testid="quick-login-student"]`, `[data-testid="quick-login-faculty"]`, `[data-testid="quick-login-admin"]`
- **Navigation Tabs**: `[data-testid="nav-dashboard"]`, `[data-testid="nav-gradebook"]`, `[data-testid="nav-calendar"]`, `[data-testid="nav-daily-schedule"]`, `[data-testid="nav-attendance"]`, `[data-testid="nav-submissions"]`, `[data-testid="nav-communication"]`, `[data-testid="nav-book"]`
- **Header Actions**: `[data-testid="header-notifications-btn"]`, `[data-testid="header-switch-persona-btn"]`, `[data-testid="header-logout-btn"]`
"""

LLMS_FULL_TXT_CONTENT = """# Complete AI Agent Specification - College ERP Operating System
> Exhaustive technical documentation and machine-readable interaction guide for LLMs, autonomous agents, and tool-use clients.

## 1. System Architecture
- **Backend**: FastAPI (Python 3.11+ / 3.13+) with SQLAlchemy ORM and Pydantic v2 schemas.
- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS, and Lucide icons.
- **Database**: SQLite (relational schema: Users, Courses, CourseEnrollments, ScheduleItems, AttendanceRecords, Assessments, GradeRecords, Assignments, Submissions, Appointments, Slots, Notifications, AcademicEvents).
- **Authentication**: JWT Bearer tokens with strict role-based access control.

## 2. Role Hierarchy & Permissions
1. **ADMIN**:
   - Access level: Full system oversight.
   - Guard dependency: `require_admin`.
   - Capabilities: Institutional analytics, faculty workload monitoring, course creation, student enrollment, faculty onboarding.
2. **FACULTY**:
   - Access level: Course-level and authorized student interactions.
   - Guard dependency: `require_faculty_or_admin`.
   - Capabilities: Manage course gradebook matrix, mark schedule-linked attendance, publish assignments, review submissions, manage office-hour slots, punch faculty HR attendance.
3. **STUDENT**:
   - Access level: Personal academic records and authorized communications.
   - Guard dependency: `get_current_user`.
   - Capabilities: View attendance and risk recovery requirements, track prioritized deadlines, view academic transcript and CGPA, submit assignments, book faculty appointments, communicate with instructors.

## 3. Step-by-Step Agent Workflows (Curl & Python Examples)

### Scenario A: Authenticate & Retrieve Token
```bash
curl -X POST http://localhost:8000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"identifier": "priyansh@college.edu", "password": "password123"}'
```
Response:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": 7,
    "identifier": "22CS104",
    "name": "Priyansh Bansal",
    "email": "priyansh@college.edu",
    "role": "student",
    "department": "Computer Science & Engineering"
  }
}
```

### Scenario B: Student Attendance Risk & Recovery Calculation
```bash
curl -X GET http://localhost:8000/api/insights/attendance-risk \\
  -H "Authorization: Bearer <TOKEN>"
```
Response:
```json
[
  {
    "course_id": 3,
    "course_code": "CS503",
    "course_name": "Cloud Computing & Microservice Systems",
    "faculty_name": "Dr. Rajesh Sharma",
    "current_percentage": 64.3,
    "held_classes": 14,
    "attended_classes": 9,
    "classes_needed_for_75": 6,
    "classes_can_miss": 0,
    "risk_level": "CRITICAL_DETENTION"
  }
]
```

### Scenario C: Faculty Action Center & Schedule-Linked Attendance
```bash
curl -X GET http://localhost:8000/api/insights/faculty-action-center \\
  -H "Authorization: Bearer <FACULTY_TOKEN>"
```
Response provides:
- `pending_grading_count`: Number of submitted assignments waiting for grades.
- `students_below_threshold_count`: Students across courses with <75% attendance.
- `attendance_pending_classes_count`: Today's classes requiring attendance marking.
- `workload`: Teaching load in hours, class count, and status (e.g. `OPTIMAL`).

### Scenario D: Querying Course Gradebook Matrix
```bash
curl -X GET http://localhost:8000/api/gradebook/course/1 \\
  -H "Authorization: Bearer <FACULTY_TOKEN>"
```
Response provides course metadata, configured assessments, enrolled student score breakdown, class average, and grade distribution:
```json
{
  "class_average": 92.2,
  "highest_percentage": 95.0,
  "lowest_percentage": 89.3,
  "grade_distribution": {"A+": 1, "A": 1, "B+": 0, "B": 0, "C": 0, "F": 0}
}
```

### Scenario E: Admin Institutional Analytics
```bash
curl -X GET http://localhost:8000/api/admin-management/institutional-analytics \\
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
Response provides high-level institution metrics:
```json
{
  "summary": {
    "total_students": 3,
    "total_faculty": 5,
    "total_courses": 5,
    "system_status": "All Departments Operational"
  },
  "attendance_health": {
    "compliance_rate": 100.0,
    "eligible_healthy_count": 3,
    "critical_risk_count": 0
  },
  "academics_and_grading": {
    "grading_completion_rate": 66.7
  }
}
```

## 4. DOM Automation Guide for Browser Agents
- Every key UI component is decorated with `data-testid` and descriptive `aria-label` attributes.
- Use explicit CSS selectors `[data-testid="..."]` rather than fragile class-based paths.
"""

ROBOTS_TXT_CONTENT = """User-agent: *
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /docs
Allow: /openapi.json
Allow: /sitemap.xml
Allow: /.well-known/ai-plugin.json
Allow: /api/agent/manifest
Allow: /api/agent/context

Sitemap: /sitemap.xml
"""

SITEMAP_XML_CONTENT = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>/llms.txt</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>/llms-full.txt</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>/docs</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>/openapi.json</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>/api/agent/manifest</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
"""

AI_PLUGIN_JSON = {
    "schema_version": "v1",
    "name_for_model": "college_erp_portal",
    "name_for_human": "College ERP Academic Operating System",
    "description_for_model": "University ERP system API to manage role-based academic responsibilities, schedules, attendance risk recovery, gradebooks, assignment grading, and faculty appointments.",
    "description_for_human": "University ERP platform for faculty, students, and administrators.",
    "auth": {
        "type": "oauth",
        "instructions": "Obtain JWT token via POST /api/auth/login and send in Authorization: Bearer <token> header"
    },
    "api": {
        "type": "openapi",
        "url": "/openapi.json"
    },
    "logo_url": "/assets/favicon.ico",
    "contact_email": "admin@college.edu",
    "legal_info_url": "/llms.txt"
}

@router.get("/llms.txt", response_class=PlainTextResponse)
def get_llms_txt():
    return PlainTextResponse(content=LLMS_TXT_CONTENT, media_type="text/plain; charset=utf-8")

@router.get("/llms-full.txt", response_class=PlainTextResponse)
def get_llms_full_txt():
    return PlainTextResponse(content=LLMS_FULL_TXT_CONTENT, media_type="text/plain; charset=utf-8")

@router.get("/robots.txt", response_class=PlainTextResponse)
def get_robots_txt():
    return PlainTextResponse(content=ROBOTS_TXT_CONTENT, media_type="text/plain; charset=utf-8")

@router.get("/sitemap.xml", response_class=Response)
def get_sitemap_xml():
    return Response(content=SITEMAP_XML_CONTENT, media_type="application/xml; charset=utf-8")

@router.get("/.well-known/ai-plugin.json", response_class=JSONResponse)
def get_ai_plugin_json():
    return JSONResponse(content=AI_PLUGIN_JSON)

@router.get("/api/agent/manifest")
def get_agent_manifest():
    return {
        "system_name": "College ERP - University Academic Operating System",
        "version": "2.4.0",
        "status": "Operational",
        "description": "Unified academic operating system connecting Admin, Faculty, and Student responsibilities.",
        "ai_agent_readability": {
            "standards_supported": ["llms.txt", "OpenAPI 3.0", "ai-plugin.json", "sitemap.xml", "Semantic DOM Data-Attributes"],
            "llms_url": "/llms.txt",
            "llms_full_url": "/llms-full.txt",
            "openapi_url": "/openapi.json",
            "swagger_docs_url": "/docs"
        },
        "role_hierarchy": ["ADMIN", "FACULTY", "STUDENT"],
        "demo_credentials": [
            {"role": "student", "identifier": "22CS104", "email": "priyansh@college.edu", "password": "password123", "name": "Priyansh Bansal"},
            {"role": "student", "identifier": "22CS108", "email": "ananya.verma@college.edu", "password": "password123", "name": "Ananya Verma"},
            {"role": "faculty", "identifier": "FAC-CS-042", "email": "rajesh.sharma@college.edu", "password": "password123", "name": "Dr. Rajesh Sharma"},
            {"role": "faculty", "identifier": "FAC-CS-055", "email": "anita.deshmukh@college.edu", "password": "password123", "name": "Dr. Anita Deshmukh"},
            {"role": "admin", "identifier": "ADMIN-01", "email": "admin@college.edu", "password": "password123", "name": "Dr. Suresh N. Venkat"}
        ],
        "endpoints_summary": {
            "authentication": {
                "login": "POST /api/auth/login",
                "current_user": "GET /api/auth/me",
                "demo_users": "GET /api/auth/demo-users"
            },
            "intelligent_insights": {
                "attendance_risk": "GET /api/insights/attendance-risk (Attendance 75% recovery calculator)",
                "deadline_prioritization": "GET /api/insights/deadline-prioritization (<24h, <72h, upcoming)",
                "faculty_recommendation": "GET /api/insights/faculty-recommendations (Advisors with open slots)",
                "faculty_action_center": "GET /api/insights/faculty-action-center (Actionable pending tasks & workload)"
            },
            "gradebook_and_academics": {
                "courses": "GET /api/gradebook/courses",
                "course_matrix": "GET /api/gradebook/course/{id}",
                "create_assessment": "POST /api/gradebook/assessment",
                "record_grades": "POST /api/gradebook/grades",
                "student_transcript": "GET /api/gradebook/my-grades (Cumulative CGPA & course evaluations)"
            },
            "calendar_and_timetable": {
                "unified_calendar": "GET /api/calendar/events?year={Y}&month={M}",
                "weekly_schedule": "GET /api/schedule/my-schedule"
            },
            "attendance_operations": {
                "course_roster": "GET /api/attendance/course/{id}/roster",
                "take_attendance": "POST /api/attendance/take",
                "student_summary": "GET /api/attendance/my-summary"
            },
            "appointments": {
                "faculty_slots": "GET /api/slots/available?faculty_id={id}",
                "request_appointment": "POST /api/appointments/request",
                "faculty_action": "POST /api/appointments/{id}/action"
            },
            "admin_governance": {
                "institutional_analytics": "GET /api/admin-management/institutional-analytics",
                "faculty_workloads": "GET /api/admin-management/faculty-workloads",
                "create_course": "POST /api/admin-management/courses",
                "add_faculty": "POST /api/admin-management/faculty"
            }
        },
        "dom_selectors": {
            "persona_tabs": {
                "student": "[data-testid=\"persona-tab-student\"]",
                "faculty": "[data-testid=\"persona-tab-faculty\"]",
                "admin": "[data-testid=\"persona-tab-admin\"]"
            },
            "login_form": {
                "identifier": "[data-testid=\"login-identifier-input\"]",
                "password": "[data-testid=\"login-password-input\"]",
                "submit": "[data-testid=\"login-submit-button\"]"
            },
            "navigation": {
                "dashboard": "[data-testid=\"nav-dashboard\"]",
                "student_profile": "[data-testid=\"nav-student-profile\"]",
                "calendar": "[data-testid=\"nav-calendar\"]",
                "gradebook": "[data-testid=\"nav-gradebook\"]",
                "timetable": "[data-testid=\"nav-daily-schedule\"]",
                "attendance": "[data-testid=\"nav-attendance\"]",
                "assignments": "[data-testid=\"nav-submissions\"]",
                "communication": "[data-testid=\"nav-communication\"]",
                "book_slot": "[data-testid=\"nav-book\"]",
                "manage_slots": "[data-testid=\"nav-manage-slots\"]",
                "faculty_hr": "[data-testid=\"nav-faculty-hr\"]"
            },
            "header": {
                "notifications": "[data-testid=\"header-notifications-btn\"]",
                "switch_persona": "[data-testid=\"header-switch-persona-btn\"]",
                "logout": "[data-testid=\"header-logout-btn\"]"
            }
        }
    }
