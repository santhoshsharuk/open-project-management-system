import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import asyncio
from database import engine, Base, SessionLocal
from routers import auth, projects, tasks, github, oauth, orgs, sprints, standups, retrospectives
from routers import activity, notifications as notifications_router, invitations, time_tracking

STATIC_DIR = Path(__file__).parent / "static"

# Create all tables
Base.metadata.create_all(bind=engine)


# ─── Due-date reminder background task ─────────────────────────────────────────
async def due_date_reminder_loop():
    """Check for tasks due tomorrow or overdue and send notifications."""
    from datetime import datetime, timedelta
    from models import Task, Project, User
    from notifications import notify_project_event, create_notification
    while True:
        try:
            db = SessionLocal()
            now = datetime.utcnow()
            tomorrow = now + timedelta(days=1)

            # Tasks due tomorrow (within the next 24 hours)
            upcoming = db.query(Task).filter(
                Task.due_date != None,
                Task.due_date <= tomorrow,
                Task.due_date > now,
                Task.status != "done",
            ).all()
            for task in upcoming:
                project = db.query(Project).filter(Project.id == task.project_id).first()
                if project:
                    msg = f"⏰ Task **{task.title}** is due soon (by {task.due_date.strftime('%Y-%m-%d')})!"
                    await notify_project_event(project, msg)
                if task.assigned_to:
                    create_notification(db, task.assigned_to, f"Task '{task.title}' is due soon!", task.project_id, f"/projects/{task.project_id}")

            # Overdue tasks
            overdue = db.query(Task).filter(
                Task.due_date != None,
                Task.due_date < now,
                Task.status != "done",
            ).all()
            for task in overdue:
                project = db.query(Project).filter(Project.id == task.project_id).first()
                if project:
                    msg = f"🚨 Task **{task.title}** is OVERDUE (was due {task.due_date.strftime('%Y-%m-%d')})!"
                    await notify_project_event(project, msg)
                if task.assigned_to:
                    create_notification(db, task.assigned_to, f"Task '{task.title}' is overdue!", task.project_id, f"/projects/{task.project_id}")

            db.close()
        except Exception as e:
            print(f"Due-date reminder error: {e}")

        await asyncio.sleep(3600 * 6)  # Run every 6 hours


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(due_date_reminder_loop())
    yield
    task.cancel()


app = FastAPI(
    title="DevFlow PM API",
    description="Project Management Dashboard API — GitHub-native, developer-first.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://devflow.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(orgs.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(sprints.router)
app.include_router(standups.router)
app.include_router(retrospectives.router)
app.include_router(github.router)
app.include_router(oauth.router)
app.include_router(activity.router)
app.include_router(notifications_router.router)
app.include_router(invitations.router)
app.include_router(time_tracking.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "app": "DevFlow PM API", "version": "1.0.0"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}


# ─── Serve Frontend (production bundle) ────────────────────────────────────────
if STATIC_DIR.is_dir():
    # Serve JS/CSS/assets at /assets
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(request: Request, full_path: str):
        """Serve frontend SPA — return index.html for any non-API route."""
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
