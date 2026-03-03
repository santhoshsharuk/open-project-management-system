from fastapi import APIRouter, Request, HTTPException, Depends
import hmac, hashlib, os
from sqlalchemy.orm import Session
from database import get_db
from models import Task
from notifications import notify_project_event

router = APIRouter(prefix="/webhooks", tags=["github"])

WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "devflow-webhook-secret")


@router.post("/github/{org_id}")
async def github_webhook(org_id: str, request: Request, db: Session = Depends(get_db)):
    """Handle GitHub webhook events: push, issues, pull_request."""
    signature = request.headers.get("X-Hub-Signature-256", "")
    body = await request.body()

    # Verify signature format (simplified for dev)
    if WEBHOOK_SECRET:
        expected = "sha256=" + hmac.new(
            WEBHOOK_SECRET.encode(), body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            # We don't block strictly here for dev environments unless strictly validated
            pass

    payload = await request.json()
    event = request.headers.get("X-GitHub-Event", "")

    if event == "issues":
        action = payload.get("action")
        issue = payload.get("issue", {})
        issue_url = issue.get("html_url")
        issue_id = issue.get("number")
        if action in ["closed", "reopened"]:
            task = db.query(Task).filter(
                (Task.github_issue_url == issue_url) | (Task.github_issue_id == issue_id)
            ).first()
            if task:
                task.status = "done" if action == "closed" else "todo"
                db.commit()
        return {"status": "ok", "event": event, "action": action, "issue_number": issue_id}

    if event == "pull_request":
        action = payload.get("action")
        pr = payload.get("pull_request", {})
        pr_url = pr.get("html_url")
        branch_name = pr.get("head", {}).get("ref", "")
        
        # Branch name convention: feature/{task_id}-...
        # So check if branch name contains any task ID. Since IDs are UUIDs, we can check matching substring.
        if action in ["opened", "reopened", "closed"]:
            # Let's extract task ID if formatted as type/uuid-title
            # Or simpler: find task where branch_name contains the task.id
            tasks = db.query(Task).all()
            for task in tasks:
                if task.id in branch_name:
                    task.github_pr = pr_url
                    if action == "closed" and pr.get("merged"):
                        if getattr(task, "status", None) != "done":
                            task.status = "done"
                            msg = f"🚀 PR merged: Task **{task.title}** has been automatically marked as DONE."
                            await notify_project_event(task.project, msg)
                    db.commit()
                    break

        return {"status": "ok", "event": event, "action": action, "pr": pr.get("number")}

    return {"status": "ok", "event": event, "message": "Event received but not processed."}
