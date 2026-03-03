import os
import uuid
import httpx
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Organization
from auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth/github", tags=["github-oauth"])

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


@router.get("/")
def github_login():
    """Redirect user to GitHub OAuth authorization page for repo connection."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured.")
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope=repo,read:user"
        f"&allow_signup=true"
        f"&redirect_uri={BACKEND_URL}/auth/github/callback"
        f"&state=repo"
    )
    return RedirectResponse(url)


@router.get("/login")
def github_sso_login():
    """Redirect user to GitHub OAuth for app login (SSO)."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured.")
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope=user:email"
        f"&allow_signup=true"
        f"&redirect_uri={BACKEND_URL}/auth/github/callback"
        f"&state=sso"
    )
    return RedirectResponse(url)


@router.get("/callback")
async def github_callback(code: str, state: str = "repo", db: Session = Depends(get_db)):
    """Exchange GitHub code. Handles both Repo Connection and SSO Login based on state."""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured.")

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            json={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": f"{BACKEND_URL}/auth/github/callback",
            },
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")

        if not access_token:
            error = token_data.get("error_description", "OAuth failed")
            if state == "sso":
                return RedirectResponse(f"{FRONTEND_URL}/login?error=oauth_failed")
            if state == "connect":
                return RedirectResponse(f"{FRONTEND_URL}/settings?error=oauth_failed")
            return RedirectResponse(f"{FRONTEND_URL}/github?error={error}")

        if state == "connect":
            # Return the GitHub token so frontend can POST it to /auth/github/connect
            return RedirectResponse(f"{FRONTEND_URL}/settings?gh_token={access_token}")

        if state == "repo":
            # Just return the GitHub token for the frontend to connect
            return RedirectResponse(f"{FRONTEND_URL}/github?gh_token={access_token}")

        # --- SSO Flow ---
        # 2. Get GitHub user profile
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        gh_user = user_resp.json()
        
        # 3. Get GitHub email (needs separate call if private)
        emails_resp = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        gh_emails = emails_resp.json()
        primary_email = next((e["email"] for e in gh_emails if e["primary"]), gh_emails[0]["email"])

    # 4. Check if user exists in DB
    user = db.query(User).filter(User.email == primary_email).first()
    
    if not user:
        # Create new organization and user
        org = Organization(id=str(uuid.uuid4()), name=f"{gh_user.get('login')} Workspace")
        db.add(org)
        db.flush()
        
        user = User(
            id=str(uuid.uuid4()),
            name=gh_user.get("name") or gh_user.get("login"),
            email=primary_email,
            password_hash="", # No password for OAuth users
            role="admin",
            organization_id=org.id,
            github_username=gh_user.get("login"),
            github_avatar_url=gh_user.get("avatar_url"),
        )
        db.add(user)
        db.commit()
    else:
        # Update GitHub profile info for existing user
        user.github_username = gh_user.get("login")
        user.github_avatar_url = gh_user.get("avatar_url")
        if not user.name or user.name == user.email:
            user.name = gh_user.get("name") or gh_user.get("login")
        db.commit()

    # 5. Issue DevFlow JWT
    jwt_token = create_access_token({"sub": user.id, "org": user.organization_id})
    return RedirectResponse(f"{FRONTEND_URL}/login?token={jwt_token}")


@router.get("/connect")
def github_connect_redirect():
    """Redirect user to GitHub OAuth to link their account (profile connect flow)."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured.")
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope=read:user,user:email"
        f"&allow_signup=false"
        f"&redirect_uri={BACKEND_URL}/auth/github/callback"
        f"&state=connect"
    )
    return RedirectResponse(url)


@router.post("/connect")
async def github_connect_token(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Connect GitHub profile to the current user using a GitHub access token."""
    gh_token = data.get("github_token")
    if not gh_token:
        raise HTTPException(status_code=400, detail="github_token is required")

    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {gh_token}"},
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid GitHub token")
        gh_user = user_resp.json()

    current_user.github_username = gh_user.get("login")
    current_user.github_avatar_url = gh_user.get("avatar_url")
    db.commit()
    db.refresh(current_user)
    return {
        "github_username": current_user.github_username,
        "github_avatar_url": current_user.github_avatar_url,
    }


@router.delete("/connect")
def github_disconnect(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disconnect GitHub profile from the current user."""
    current_user.github_username = None
    current_user.github_avatar_url = None
    db.commit()
    db.refresh(current_user)
    return {"detail": "GitHub disconnected"}
