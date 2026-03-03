import httpx
import asyncio
import uuid
from datetime import datetime


async def send_discord_webhook(url: str, content: str):
    if not url:
        return
    payload = {"content": content}
    try:
        async with httpx.AsyncClient() as client:
            await client.post(url, json=payload, timeout=5.0)
    except Exception as e:
        print(f"Error sending Discord webhook: {e}")

async def send_slack_webhook(url: str, text: str):
    if not url:
        return
    payload = {"text": text}
    try:
        async with httpx.AsyncClient() as client:
            await client.post(url, json=payload, timeout=5.0)
    except Exception as e:
        print(f"Error sending Slack webhook: {e}")

async def notify_project_event(project, message: str):
    """Send notification to both Slack and Discord if configured for the project."""
    tasks = []
    if project.discord_webhook_url:
        tasks.append(send_discord_webhook(project.discord_webhook_url, message))
    if project.slack_webhook_url:
        tasks.append(send_slack_webhook(project.slack_webhook_url, message))
    
    if tasks:
        await asyncio.gather(*tasks)


def log_activity(db, project_id: str, user_id: str, action: str, entity_type: str, entity_id: str, message: str):
    """Create an activity log entry in the database."""
    from models import ActivityLog
    log = ActivityLog(
        id=str(uuid.uuid4()),
        project_id=project_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        message=message,
    )
    db.add(log)
    db.commit()
    return log


def create_notification(db, user_id: str, message: str, project_id: str = None, link: str = None):
    """Create an in-app notification for a specific user."""
    from models import Notification
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        project_id=project_id,
        message=message,
        link=link,
    )
    db.add(notif)
    db.commit()
    return notif


def notify_project_members(db, project_id: str, message: str, exclude_user_id: str = None, link: str = None):
    """Send in-app notification to all org members (except the actor)."""
    from models import Project, User
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return
    users = db.query(User).filter(User.organization_id == project.organization_id).all()
    for u in users:
        if u.id != exclude_user_id:
            create_notification(db, u.id, message, project_id, link)

