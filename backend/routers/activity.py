from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ActivityLog, Project, User
from schemas import ActivityLogResponse
from auth import get_current_user

router = APIRouter(prefix="/projects", tags=["activity"])


@router.get("/{project_id}/activity/", response_model=List[ActivityLogResponse])
def get_activity_feed(
    project_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id,
    ).first()
    if not project:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found.")

    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.project_id == project_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )

    # Attach user info
    for log in logs:
        if log.user:
            log.user_name = log.user.name
            log.user_avatar = log.user.name[0].upper() if log.user.name else "U"
        else:
            log.user_name = "Unknown"
            log.user_avatar = "U"

    return logs
