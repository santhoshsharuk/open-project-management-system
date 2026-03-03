from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Standup, Sprint, User, Project
from schemas import StandupCreate, StandupResponse
from auth import get_current_user
from notifications import notify_project_event, log_activity, notify_project_members
import uuid

router = APIRouter(prefix="/projects", tags=["standups"])

def _get_project_and_sprint_or_404(project_id: str, sprint_id: str, org_id: str, db: Session):
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id, Sprint.project_id == project_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found in this project.")
    return project, sprint

@router.get("/{project_id}/sprints/{sprint_id}/standups/", response_model=List[StandupResponse])
def list_standups(project_id: str, sprint_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_project_and_sprint_or_404(project_id, sprint_id, current_user.organization_id, db)
    
    standups = db.query(Standup).filter(Standup.sprint_id == sprint_id).order_by(Standup.created_at.desc()).all()
    
    # Attach user info for the response
    for standup in standups:
        standup.user_name = standup.user.name
        standup.user_avatar = standup.user.name[0].upper() if standup.user.name else "U"
        
    return standups

@router.post("/{project_id}/sprints/{sprint_id}/standups/", response_model=StandupResponse, status_code=201)
def create_standup(project_id: str, sprint_id: str, data: StandupCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project, sprint = _get_project_and_sprint_or_404(project_id, sprint_id, current_user.organization_id, db)
    
    standup = Standup(
        id=str(uuid.uuid4()), sprint_id=sprint_id, user_id=current_user.id,
        yesterday_work=data.yesterday_work, today_plan=data.today_plan,
        blockers=data.blockers
    )
    db.add(standup)
    db.commit()
    db.refresh(standup)
    
    standup.user_name = current_user.name
    standup.user_avatar = current_user.name[0].upper()

    blocker_text = f"\n⚠️ Blockers: {data.blockers}" if data.blockers else ""
    msg = f"🧍 **{current_user.name}** posted a standup update:\n• Yesterday: {data.yesterday_work}\n• Today: {data.today_plan}{blocker_text}"
    background_tasks.add_task(notify_project_event, project, msg)
    log_activity(db, project_id, current_user.id, "standup_created", "standup", standup.id, f"{current_user.name} posted a standup update")
    notify_project_members(db, project_id, f"{current_user.name} posted a standup update", exclude_user_id=current_user.id, link=f"/projects/{project_id}/standups")

    return standup
