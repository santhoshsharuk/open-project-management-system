from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models import TimeEntry, Project, Task, User
from schemas import TimeEntryCreate, TimeEntryResponse, ProjectSummaryResponse
from auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["time-tracking"])


def _get_project_or_404(project_id: str, org_id: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project


# ─── List time entries for a project ──────────────────────────────────────────
@router.get("/{project_id}/time-entries/", response_model=List[TimeEntryResponse])
def list_time_entries(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_project_or_404(project_id, current_user.organization_id, db)
    entries = db.query(TimeEntry).filter(TimeEntry.project_id == project_id).order_by(TimeEntry.date.desc()).all()
    result = []
    for entry in entries:
        user = db.query(User).filter(User.id == entry.user_id).first()
        task = db.query(Task).filter(Task.id == entry.task_id).first() if entry.task_id else None
        result.append(TimeEntryResponse(
            id=entry.id,
            project_id=entry.project_id,
            task_id=entry.task_id,
            user_id=entry.user_id,
            description=entry.description,
            duration_minutes=entry.duration_minutes,
            date=entry.date,
            created_at=entry.created_at,
            user_name=user.name if user else None,
            task_title=task.title if task else None,
        ))
    return result


# ─── Log time entry ───────────────────────────────────────────────────────────
@router.post("/{project_id}/time-entries/", response_model=TimeEntryResponse, status_code=201)
def create_time_entry(project_id: str, data: TimeEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project_or_404(project_id, current_user.organization_id, db)

    if project.status in ("completed", "archived"):
        raise HTTPException(status_code=400, detail="Cannot log time on a closed/archived project.")

    if data.duration_minutes <= 0:
        raise HTTPException(status_code=400, detail="Duration must be greater than 0.")

    entry = TimeEntry(
        id=str(uuid.uuid4()),
        project_id=project_id,
        task_id=data.task_id,
        user_id=current_user.id,
        description=data.description or "",
        duration_minutes=data.duration_minutes,
        date=data.date or datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    task = db.query(Task).filter(Task.id == entry.task_id).first() if entry.task_id else None
    return TimeEntryResponse(
        id=entry.id,
        project_id=entry.project_id,
        task_id=entry.task_id,
        user_id=entry.user_id,
        description=entry.description,
        duration_minutes=entry.duration_minutes,
        date=entry.date,
        created_at=entry.created_at,
        user_name=current_user.name,
        task_title=task.title if task else None,
    )


# ─── Delete time entry ────────────────────────────────────────────────────────
@router.delete("/{project_id}/time-entries/{entry_id}", status_code=204)
def delete_time_entry(project_id: str, entry_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_project_or_404(project_id, current_user.organization_id, db)
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id, TimeEntry.project_id == project_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found.")
    if entry.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own time entries.")
    db.delete(entry)
    db.commit()


# ─── Project Summary (total hours, member breakdown, close info) ──────────────
@router.get("/{project_id}/summary", response_model=ProjectSummaryResponse)
def get_project_summary(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project_or_404(project_id, current_user.organization_id, db)

    total_tasks = db.query(Task).filter(Task.project_id == project_id).count()
    completed_tasks = db.query(Task).filter(Task.project_id == project_id, Task.status == "done").count()

    # Total time
    total_minutes = db.query(func.coalesce(func.sum(TimeEntry.duration_minutes), 0)).filter(
        TimeEntry.project_id == project_id
    ).scalar()

    # Per-member breakdown
    member_rows = db.query(
        TimeEntry.user_id,
        func.sum(TimeEntry.duration_minutes).label("total_mins")
    ).filter(TimeEntry.project_id == project_id).group_by(TimeEntry.user_id).all()

    member_hours = []
    for row in member_rows:
        user = db.query(User).filter(User.id == row.user_id).first()
        member_hours.append({
            "user_id": row.user_id,
            "name": user.name if user else "Unknown",
            "minutes": int(row.total_mins),
            "hours": round(int(row.total_mins) / 60, 1),
        })

    # Per-task breakdown
    task_rows = db.query(
        TimeEntry.task_id,
        func.sum(TimeEntry.duration_minutes).label("total_mins")
    ).filter(TimeEntry.project_id == project_id, TimeEntry.task_id != None).group_by(TimeEntry.task_id).all()

    task_time = []
    for row in task_rows:
        task = db.query(Task).filter(Task.id == row.task_id).first()
        task_time.append({
            "task_id": row.task_id,
            "title": task.title if task else "Unknown",
            "minutes": int(row.total_mins),
            "hours": round(int(row.total_mins) / 60, 1),
        })

    return ProjectSummaryResponse(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        total_time_minutes=int(total_minutes),
        total_time_hours=round(int(total_minutes) / 60, 1),
        member_hours=member_hours,
        task_time=task_time,
        status=project.status.value if hasattr(project.status, 'value') else project.status,
        created_at=project.created_at,
        closed_at=project.closed_at,
    )


# ─── Close / Complete Project ─────────────────────────────────────────────────
@router.post("/{project_id}/close")
def close_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project_or_404(project_id, current_user.organization_id, db)

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can close a project.")

    if project.status in ("completed", "archived"):
        raise HTTPException(status_code=400, detail="Project is already closed.")

    project.status = "completed"
    project.closed_at = datetime.utcnow()
    db.commit()
    db.refresh(project)

    return {
        "message": f"Project '{project.name}' has been closed.",
        "closed_at": project.closed_at.isoformat(),
        "status": project.status.value if hasattr(project.status, 'value') else project.status,
    }


# ─── Reopen Project ──────────────────────────────────────────────────────────
@router.post("/{project_id}/reopen")
def reopen_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project_or_404(project_id, current_user.organization_id, db)

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can reopen a project.")

    if project.status not in ("completed", "archived"):
        raise HTTPException(status_code=400, detail="Project is not closed.")

    project.status = "active"
    project.closed_at = None
    db.commit()
    db.refresh(project)

    return {
        "message": f"Project '{project.name}' has been reopened.",
        "status": project.status.value if hasattr(project.status, 'value') else project.status,
    }
