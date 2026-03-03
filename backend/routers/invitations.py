from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Invitation, User, Organization
from schemas import InvitationCreate, InvitationResponse
from auth import get_current_user
import uuid

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.post("/", response_model=InvitationResponse, status_code=201)
def create_invitation(
    data: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invite a user by email to join the current user's organization."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="You must belong to an organization.")

    # Check if user already exists in the org
    existing = db.query(User).filter(
        User.email == data.email,
        User.organization_id == current_user.organization_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of your organization.")

    # Check for existing pending invitation
    pending = db.query(Invitation).filter(
        Invitation.email == data.email,
        Invitation.organization_id == current_user.organization_id,
        Invitation.status == "pending",
    ).first()
    if pending:
        raise HTTPException(status_code=400, detail="An invitation is already pending for this email.")

    invitation = Invitation(
        id=str(uuid.uuid4()),
        email=data.email,
        organization_id=current_user.organization_id,
        invited_by=current_user.id,
        status="pending",
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.get("/", response_model=List[InvitationResponse])
def list_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all invitations for the current user's organization."""
    if not current_user.organization_id:
        return []
    invitations = (
        db.query(Invitation)
        .filter(Invitation.organization_id == current_user.organization_id)
        .order_by(Invitation.created_at.desc())
        .all()
    )
    return invitations


@router.get("/pending")
def get_my_pending_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get pending invitations for the current user's email."""
    invitations = (
        db.query(Invitation)
        .filter(
            Invitation.email == current_user.email,
            Invitation.status == "pending",
        )
        .all()
    )
    results = []
    for inv in invitations:
        org = db.query(Organization).filter(Organization.id == inv.organization_id).first()
        inviter = db.query(User).filter(User.id == inv.invited_by).first()
        results.append({
            "id": inv.id,
            "email": inv.email,
            "organization_id": inv.organization_id,
            "organization_name": org.name if org else "Unknown",
            "invited_by": inv.invited_by,
            "inviter_name": inviter.name if inviter else "Unknown",
            "status": inv.status,
            "created_at": inv.created_at,
        })
    return results


@router.patch("/{invitation_id}/accept")
def accept_invitation(
    invitation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept an invitation to join an organization."""
    invitation = db.query(Invitation).filter(
        Invitation.id == invitation_id,
        Invitation.email == current_user.email,
        Invitation.status == "pending",
    ).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or already processed.")

    # Move user to the new org
    current_user.organization_id = invitation.organization_id
    invitation.status = "accepted"
    db.commit()
    return {"status": "accepted", "organization_id": invitation.organization_id}


@router.delete("/{invitation_id}", status_code=204)
def cancel_invitation(
    invitation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel/delete an invitation (org admin only)."""
    invitation = db.query(Invitation).filter(
        Invitation.id == invitation_id,
        Invitation.organization_id == current_user.organization_id,
    ).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    db.delete(invitation)
    db.commit()
