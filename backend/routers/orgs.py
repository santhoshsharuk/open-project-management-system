from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Organization
from schemas import OrgResponse
from auth import get_current_user
from models import User

router = APIRouter(prefix="/orgs", tags=["orgs"])


@router.get("/{org_id}", response_model=OrgResponse)
def get_org(org_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")
    return org
