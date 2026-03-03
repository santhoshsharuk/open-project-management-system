from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Task, Project, User, Sprint
from schemas import TaskCreate, TaskUpdate, TaskResponse
from auth import get_current_user
import uuid
from notifications import notify_project_event, log_activity, notify_project_members

router = APIRouter(prefix="/projects", tags=["tasks"])


def _get_project_or_404(project_id: str, org_id: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project


@router.get("/{project_id}/tasks/", response_model=List[TaskResponse])
def list_tasks(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_project_or_404(project_id, current_user.organization_id, db)
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    return tasks


@router.post("/{project_id}/tasks/", response_model=TaskResponse, status_code=201)
def create_task(project_id: str, data: TaskCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project_or_404(project_id, current_user.organization_id, db)
    task = Task(
        id=str(uuid.uuid4()), project_id=project_id,
        title=data.title, description=data.description or "",
        priority=data.priority.value, assigned_to=data.assigned_to,
        due_date=data.due_date, labels=data.labels or "",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    msg = f"📋 New task **{task.title}** created by {current_user.name} (Priority: {task.priority})."
    if task.assigned_to:
        assignee = db.query(User).filter(User.id == task.assigned_to).first()
        if assignee:
            mention = f"<@{assignee.discord_user_id}>" if assignee.discord_user_id else assignee.name
            msg += f"\n👤 Assigned to {mention}"
    background_tasks.add_task(notify_project_event, project, msg)

    # Activity log & in-app notification
    log_activity(db, project_id, current_user.id, "task_created", "task", task.id, f"{current_user.name} created task '{task.title}'")
    notify_project_members(db, project_id, f"New task '{task.title}' created by {current_user.name}", exclude_user_id=current_user.id, link=f"/projects/{project_id}")

    return task


@router.patch("/{project_id}/tasks/{task_id}", response_model=TaskResponse)
def update_task(project_id: str, task_id: str, data: TaskUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_project_or_404(project_id, current_user.organization_id, db)
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    # Prevent moving tasks out of completed sprints
    update_data = data.model_dump(exclude_none=True)
    if 'sprint_id' in update_data and task.sprint_id:
        current_sprint = db.query(Sprint).filter(Sprint.id == task.sprint_id).first()
        if current_sprint and current_sprint.status == 'completed':
            raise HTTPException(status_code=400, detail="Cannot move tasks out of a completed sprint.")

    old_status = getattr(task, "status", None)
    old_assigned_to = task.assigned_to
                     
    for field, value in update_data.items():
        if field == "status" and hasattr(value, "value"):
            value = value.value
        if field == "priority" and hasattr(value, "value"):
            value = value.value
        setattr(task, field, value)
        
    db.commit()
    db.refresh(task)
    
    new_status = getattr(task, "status", None)
    if new_status != old_status and old_status is not None:
        if new_status == "done":
            msg = f"✅ Task **{task.title}** has been marked as DONE by {current_user.name}."
        elif new_status == "in_progress":
            msg = f"🔄 Task **{task.title}** moved to IN PROGRESS by {current_user.name}."
        elif new_status == "review":
            msg = f"🔍 Task **{task.title}** moved to REVIEW by {current_user.name}."
        else:
            msg = f"📝 Task **{task.title}** status changed to **{new_status}** by {current_user.name}."
        background_tasks.add_task(notify_project_event, task.project, msg)

    # Notify when task is reassigned to a different user
    if task.assigned_to and task.assigned_to != old_assigned_to:
        assignee = db.query(User).filter(User.id == task.assigned_to).first()
        if assignee:
            mention = f"<@{assignee.discord_user_id}>" if assignee.discord_user_id else assignee.name
            msg = f"👤 Task **{task.title}** has been assigned to {mention} by {current_user.name}."
            background_tasks.add_task(notify_project_event, task.project, msg)

    # Activity log & in-app notification
    log_activity(db, project_id, current_user.id, "task_updated", "task", task.id, f"{current_user.name} updated task '{task.title}'")
    if new_status != old_status and old_status is not None:
        notify_project_members(db, project_id, f"Task '{task.title}' moved to {new_status} by {current_user.name}", exclude_user_id=current_user.id, link=f"/projects/{project_id}")

    return task


@router.delete("/{project_id}/tasks/{task_id}", status_code=204)
def delete_task(project_id: str, task_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project_or_404(project_id, current_user.organization_id, db)
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(404, "Task not found.")
    task_title = task.title
    db.delete(task)
    db.commit()

    msg = f"🗑️ Task **{task_title}** has been deleted by {current_user.name}."
    background_tasks.add_task(notify_project_event, project, msg)

    log_activity(db, project_id, current_user.id, "task_deleted", "task", task_id, f"{current_user.name} deleted task '{task_title}'")
    notify_project_members(db, project_id, f"Task '{task_title}' deleted by {current_user.name}", exclude_user_id=current_user.id, link=f"/projects/{project_id}")
