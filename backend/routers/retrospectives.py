from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Retrospective, Sprint, Project, User
from schemas import RetrospectiveCreate, RetrospectiveUpdate, RetrospectiveResponse
from auth import get_current_user
from notifications import notify_project_event, log_activity, notify_project_members
import uuid

router = APIRouter(prefix="/projects", tags=["retrospectives"])

def _get_project_and_sprint_or_404(project_id: str, sprint_id: str, org_id: str, db: Session):
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id, Sprint.project_id == project_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found in this project.")
    return project, sprint


@router.get("/{project_id}/sprints/{sprint_id}/retrospectives/", response_model=List[RetrospectiveResponse])
def get_retrospectives(project_id: str, sprint_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_project_and_sprint_or_404(project_id, sprint_id, current_user.organization_id, db)
    retrospectives = db.query(Retrospective).filter(Retrospective.sprint_id == sprint_id).all()
    return retrospectives


@router.post("/{project_id}/sprints/{sprint_id}/retrospectives/", response_model=RetrospectiveResponse, status_code=201)
def create_retrospective(project_id: str, sprint_id: str, data: RetrospectiveCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project, sprint = _get_project_and_sprint_or_404(project_id, sprint_id, current_user.organization_id, db)
    
    # Usually one retro per sprint, but we can allow multiple items or one aggregated doc
    retro = Retrospective(
        id=str(uuid.uuid4()),
        sprint_id=sprint_id,
        went_well=data.went_well,
        needs_improvement=data.needs_improvement,
        action_items=data.action_items,
    )
    db.add(retro)
    db.commit()
    db.refresh(retro)

    msg = f"📝 New retrospective added for sprint **{sprint.name}** by {current_user.name}:\n✅ Went well: {data.went_well}\n⚡ Needs improvement: {data.needs_improvement}\n🎯 Action items: {data.action_items}"
    background_tasks.add_task(notify_project_event, project, msg)
    log_activity(db, project_id, current_user.id, "retro_created", "retrospective", retro.id, f"{current_user.name} added a retrospective for sprint '{sprint.name}'")
    notify_project_members(db, project_id, f"{current_user.name} added a retrospective for sprint '{sprint.name}'", exclude_user_id=current_user.id, link=f"/projects/{project_id}/retrospectives")

    return retro


@router.patch("/{project_id}/sprints/{sprint_id}/retrospectives/{retro_id}", response_model=RetrospectiveResponse)
def update_retrospective(project_id: str, sprint_id: str, retro_id: str, data: RetrospectiveUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_project_and_sprint_or_404(project_id, sprint_id, current_user.organization_id, db)
    retro = db.query(Retrospective).filter(Retrospective.id == retro_id, Retrospective.sprint_id == sprint_id).first()
    if not retro:
        raise HTTPException(status_code=404, detail="Retrospective not found.")
        
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(retro, field, value)
        
    db.commit()
    db.refresh(retro)
    return retro
