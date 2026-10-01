from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .seed import seed_database
from .routers import (
    auth, appointments, slots, users, schedule, attendance,
    submissions, communication, faculty_hr, gradebook, notifications,
    calendar, admin_management, insights, agent_meta
)

# Initialize database schema & seed
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    print(f"Database seed notice: {e}")

app = FastAPI(
    title="College ERP Portal - University Academic Operating System API",
    description="""
# College ERP & Academic Operating System API
An enterprise-grade, role-based REST API powering a university academic ecosystem across three hierarchical tiers:
- **ADMIN**: Academic ecosystem oversight, faculty workload balancing, course curriculum & section allocation.
- **FACULTY**: Course gradebook matrix, tests & examinations, schedule-linked attendance requirements, student consultations, faculty HR logs.
- **STUDENT**: Attendance risk recovery calculations, deadline prioritization, academic transcripts with CGPA, appointment bookings.

### AI Agent Resources:
- **LLM Manifest**: [/llms.txt](/llms.txt)
- **Comprehensive Agent Spec**: [/llms-full.txt](/llms-full.txt)
- **JSON Manifest & Selectors**: [/api/agent/manifest](/api/agent/manifest)
- **Robots Directive**: [/robots.txt](/robots.txt)
    """,
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "Academic Affairs & ERP Office",
        "email": "admin@college.edu",
    },
)

# CORS middleware for development and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register AI Agent Meta Router (Must precede generic frontend handlers)
app.include_router(agent_meta.router)

# Register Core Routers
app.include_router(auth.router)
app.include_router(appointments.router)
app.include_router(slots.router)
app.include_router(users.router)
app.include_router(schedule.router)
app.include_router(attendance.router)
app.include_router(submissions.router)
app.include_router(communication.router)
app.include_router(faculty_hr.router)
app.include_router(gradebook.router)
app.include_router(notifications.router)
app.include_router(calendar.router)
app.include_router(admin_management.router)
app.include_router(insights.router)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": "2026-08-27T19:20:00Z"}

# Serve frontend build if dist exists
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
assets_dir = os.path.join(dist_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

if os.path.exists(os.path.join(dist_dir, "index.html")):
    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    def serve_frontend(full_path: str = ""):
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "portal": "College ERP Appointment Booking System",
            "status": "Operational",
            "academic_session": "2026-27 (Odd Semester)",
            "docs_url": "/docs"
        }
