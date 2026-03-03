from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Sprint, Project, User, SprintStatus, Task
from schemas import SprintCreate, SprintUpdate, SprintResponse
from auth import get_current_user
from notifications import notify_project_event, log_activity, notify_project_members
import uuid
from datetime import datetime, timedelta

router = APIRouter(prefix="/projects", tags=["sprints"])

def _get_project_or_404(project_id: str, org_id: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project

@router.get("/{project_id}/sprints/", response_model=List[SprintResponse])
def list_sprints(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_project_or_404(project_id, current_user.organization_id, db)
    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).all()
    return sprints

@router.post("/{project_id}/sprints/", response_model=SprintResponse, status_code=201)
def create_sprint(project_id: str, data: SprintCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project_or_404(project_id, current_user.organization_id, db)
    sprint = Sprint(
        id=str(uuid.uuid4()), project_id=project_id,
        name=data.name, goal=data.goal,
        start_date=data.start_date, end_date=data.end_date,
        status=SprintStatus.planned
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)

    msg = f"🚀 New sprint **{sprint.name}** created by {current_user.name} ({sprint.start_date} → {sprint.end_date})."
    background_tasks.add_task(notify_project_event, project, msg)
    log_activity(db, project_id, current_user.id, "sprint_created", "sprint", sprint.id, f"{current_user.name} created sprint '{sprint.name}'")
    notify_project_members(db, project_id, f"Sprint '{sprint.name}' created by {current_user.name}", exclude_user_id=current_user.id, link=f"/projects/{project_id}/planning")

    return sprint

@router.patch("/{project_id}/sprints/{sprint_id}", response_model=SprintResponse)
def update_sprint(project_id: str, sprint_id: str, data: SprintUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project_or_404(project_id, current_user.organization_id, db)
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id, Sprint.project_id == project_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found.")
    
    old_status = sprint.status
    
    for field, value in data.model_dump(exclude_none=True).items():
        if field == "status" and hasattr(value, "value"):
            value = value.value
        setattr(sprint, field, value)
        
    db.commit()
    db.refresh(sprint)

    new_status = sprint.status
    if old_status != new_status:
        if new_status == "active":
            msg = f"🏃 Sprint **{sprint.name}** has been STARTED by {current_user.name}!"
        elif new_status == "completed":
            msg = f"🎉 Sprint **{sprint.name}** has been COMPLETED by {current_user.name}!"
        else:
            msg = f"📌 Sprint **{sprint.name}** status changed to **{new_status}** by {current_user.name}."
        background_tasks.add_task(notify_project_event, project, msg)
        log_activity(db, project_id, current_user.id, "sprint_updated", "sprint", sprint.id, f"{current_user.name} changed sprint '{sprint.name}' status to {new_status}")
        notify_project_members(db, project_id, f"Sprint '{sprint.name}' status changed to {new_status} by {current_user.name}", exclude_user_id=current_user.id, link=f"/projects/{project_id}/planning")

    return sprint

@router.delete("/{project_id}/sprints/{sprint_id}", status_code=204)
def delete_sprint(project_id: str, sprint_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project_or_404(project_id, current_user.organization_id, db)
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id, Sprint.project_id == project_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found.")
    sprint_name = sprint.name
    db.delete(sprint)
    db.commit()

    msg = f"🗑️ Sprint **{sprint_name}** has been deleted by {current_user.name}."
    background_tasks.add_task(notify_project_event, project, msg)
    log_activity(db, project_id, current_user.id, "sprint_deleted", "sprint", sprint_id, f"{current_user.name} deleted sprint '{sprint_name}'")
    notify_project_members(db, project_id, f"Sprint '{sprint_name}' deleted by {current_user.name}", exclude_user_id=current_user.id, link=f"/projects/{project_id}/planning")


@router.get("/{project_id}/sprints/{sprint_id}/burndown")
def get_burndown_data(
    project_id: str,
    sprint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return day-by-day burndown data for a sprint."""
    _get_project_or_404(project_id, current_user.organization_id, db)
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id, Sprint.project_id == project_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found.")

    sprint_tasks = db.query(Task).filter(Task.sprint_id == sprint_id).all()
    total = len(sprint_tasks)

    start = sprint.start_date or sprint.created_at
    end = sprint.end_date or (start + timedelta(days=14))
    now = datetime.utcnow()

    days = []
    current = start
    day_num = 0
    total_days = max((end - start).days, 1)

    while current <= end:
        # Count tasks that were completed by this day
        done_by_day = sum(
            1 for t in sprint_tasks
            if t.status == "done" and t.created_at <= current  # approximation
        )
        remaining = total - done_by_day
        ideal = max(0, total - (total * day_num / total_days))

        days.append({
            "day": current.strftime("%b %d"),
            "date": current.isoformat(),
            "remaining": remaining if current <= now else None,
            "ideal": round(ideal, 1),
        })
        current += timedelta(days=1)
        day_num += 1

    return {"total_tasks": total, "days": days}


@router.get("/{project_id}/workload")
def get_team_workload(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return task count per team member for the project."""
    _get_project_or_404(project_id, current_user.organization_id, db)
    tasks = db.query(Task).filter(Task.project_id == project_id, Task.status != "done").all()

    counts: dict = {}
    for t in tasks:
        key = t.assigned_to or "unassigned"
        counts[key] = counts.get(key, 0) + 1

    users = db.query(User).filter(User.organization_id == current_user.organization_id).all()
    user_map = {u.id: u.name for u in users}

    result = []
    for user_id, count in counts.items():
        result.append({
            "user_id": user_id,
            "name": user_map.get(user_id, "Unassigned"),
            "open_tasks": count,
        })
    return sorted(result, key=lambda x: x["open_tasks"], reverse=True)
