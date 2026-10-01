# 🏛️ College ERP Portal — University Academic Operating System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-SQLAlchemy-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![AI Agent Ready](https://img.shields.io/badge/AI_Agent-llms.txt_Ready-8A2BE2?style=flat)](/llms.txt)

An enterprise-grade, role-based **University Academic Operating System** connecting administrators, faculty members, and students into a unified academic lifecycle. Designed as a realistic higher-education SaaS platform rather than isolated CRUD pages.

---

## 🌟 Role Hierarchy & Access Matrix

```
       ┌────────────────────────┐
       │         ADMIN          │  Institutional Analytics, Faculty Workloads,
       └───────────┬────────────┘  Curriculum Management & Student Records
                   │
                   ▼
       ┌────────────────────────┐
       │   FACULTY / TEACHER    │  Workload Hub, Schedule-Linked Attendance,
       └───────────┬────────────┘  Course Gradebook Matrix, Assessments & Slots
                   │
                   ▼
       ┌────────────────────────┐
       │        STUDENT         │  Attendance Risk Calculator, Priority Deadlines,
       └────────────────────────┘  Academic Transcript, CGPA & Advisor Appointments
```

---

## 🚀 Key Modules & Capabilities

### 1. 🎓 Student Academic Portal
- **Smart Attendance Risk Recovery**: Automatically identifies courses below 75% attendance and calculates the exact number of consecutive classes required to restore compliance using:
  $$\text{Classes Needed} = \max(0, 3 \times \text{Held} - 4 \times \text{Attended})$$
- **Academic Deadline Prioritization**: Intelligently groups assignments into **Urgent (<24h)**, **Approaching (<72h)**, and **Upcoming** with live countdown timers.
- **Smart Faculty Advisor Recommendations**: Matches students with faculty advisors based on specialization and available weekly office-hour consultation slots.
- **Academic Transcript & CGPA**: Course-by-course breakdown with credit weightings, assessment grades, and real-time CGPA recomputation.
- **Student Academic Profile**: Clear separation between locked institutional records (Roll No, Department, CGPA) and student-editable contact details.

### 2. 👨‍🏫 Faculty Workload Hub & Gradebook
- **Actionable Workload Dashboard**: Live counter of pending assignment submissions, students below the 75% attendance threshold, appointment requests, and unread doubt communications.
- **Schedule-Linked Attendance**: Detects today's scheduled lectures from the central timetable and displays **"Attendance Pending"** or **"Recorded"** indicators with 1-click batch attendance taking.
- **Course Gradebook Matrix**: Comprehensive grading matrix displaying all assessments (Assignments, Quizzes, Mid-Terms, Labs, End-Term exams) alongside enrolled students with automatic letter grades ($A+, A, B+, B, C, F$).
- **Class Performance Analytics**: Automated computation of class averages, highest/lowest scores, and grade distribution charts.
- **Office Hours & Slots Management**: Define weekly recurring consultation slots with double-booking prevention.

### 3. 🏛️ Admin Institutional Ecosystem
- **Institutional Analytics Dashboard**: University-wide KPIs including attendance compliance rate, assignment submission/grading completion rates, active courses, and consultation volumes.
- **Faculty Workload Balancing**: Track weekly teaching hours, total class sessions, enrolled student counts, and workload health badges (`OPTIMAL`, `MODERATE`, `HEAVY`, `OVERLOADED`) across departments.
- **Curriculum & Section Management**: Create new courses, assign faculty instructors, manage sections, and enroll students.

### 4. 📅 Unified Academic Calendar
- Aggregates **5 distinct institutional event streams**: Timetable lectures, approved faculty consultations, assignment deadlines, examination weeks, and campus-wide academic milestones across **Month, Week, and Day** views.

### 5. 🤖 AI Agent Readability & Discovery
- Standards-compliant **[`/llms.txt`](/llms.txt)** and **[`/llms-full.txt`](/llms-full.txt)** specifications.
- Structured **[`/api/agent/manifest`](/api/agent/manifest)** endpoint providing schema definitions, demo credentials, and DOM selector mappings.
- Fully documented **OpenAPI 3.0** specification at **[`/openapi.json`](/openapi.json)** and interactive Swagger UI at **[`/docs`](/docs)**.
- Machine-friendly `data-testid` and `aria-label` DOM attributes across all views for browser-automation tools (Playwright, Puppeteer, Claude Computer Use).

---

## 🔑 Pre-Configured Demo Credentials

For evaluation and testing, the portal includes pre-seeded demo accounts with password `password123`:

| Role | Name | Identifier | Email | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Priyansh Bansal | `22CS104` | `priyansh@college.edu` | Attendance recovery, deadline priority queue, CGPA transcript, slot booking |
| **Student** | Ananya Verma | `22CS108` | `ananya.verma@college.edu` | Honor student profile, course evaluations, lab timetable |
| **Faculty** | Dr. Rajesh Sharma | `FAC-CS-042` | `rajesh.sharma@college.edu` | Action Center, schedule attendance, gradebook matrix, student consultations |
| **Faculty** | Dr. Anita Deshmukh | `FAC-CS-055` | `anita.deshmukh@college.edu` | AI course instructor, exam grading, office-hour slots |
| **Dean / Admin** | Dr. Suresh N. Venkat | `ADMIN-01` | `admin@college.edu` | Institutional analytics, faculty workload hub, course & section allocation |

---

## 💻 Quick Start & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) `cloudflared` for public HTTPS tunneling

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/college-erp-portal.git
cd college-erp-portal
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start FastAPI server (seeds database automatically on first run)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Running with the All-in-One Live Runner
```bash
# Starts backend, frontend, and Cloudflare tunnel with one command:
./run_portal.sh

# To stop all background services:
./stop.sh
```

---

## 📡 API Directory

| Endpoint | Method | Role Required | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/login` | `POST` | Public | Authenticates credentials and returns JWT bearer token |
| `/api/insights/attendance-risk` | `GET` | Student / Admin | Attendance risk analysis with recovery classes needed |
| `/api/insights/deadline-prioritization` | `GET` | Student | Assignments sorted by urgency (<24h, <72h, upcoming) |
| `/api/insights/faculty-recommendations` | `GET` | Student | Recommends faculty advisors based on subject expertise and open slots |
| `/api/insights/faculty-action-center` | `GET` | Faculty | Real-time action center with pending grading and workload score |
| `/api/gradebook/courses` | `GET` | All | Assigned or enrolled courses list |
| `/api/gradebook/course/{id}` | `GET` | Faculty / Admin | Course gradebook matrix with student assessment scores |
| `/api/gradebook/assessment` | `POST` | Faculty / Admin | Creates a new course assessment (exam, quiz, assignment) |
| `/api/gradebook/grades` | `POST` | Faculty / Admin | Batch records student marks with automatic letter grade computation |
| `/api/gradebook/my-grades` | `GET` | Student / Admin | Academic transcript with weighted scores and CGPA |
| `/api/calendar/events` | `GET` | All | Unified academic calendar (lectures, consultations, deadlines, exams) |
| `/api/admin-management/institutional-analytics` | `GET` | Admin | Campus-wide analytics (compliance rate, grading rates) |
| `/api/admin-management/faculty-workloads` | `GET` | Admin | Multi-faculty workload tracking and status scores |
| `/llms.txt` | `GET` | Public | Standard LLM agent manifest |
| `/api/agent/manifest` | `GET` | Public | Structured JSON manifest with credentials and DOM selectors |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
