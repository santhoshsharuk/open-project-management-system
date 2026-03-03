from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PlanType(str, Enum):
    free = "free"
    pro = "pro"
    growth = "growth"


class ProjectStatus(str, Enum):
    active = "active"
    on_hold = "on_hold"
    completed = "completed"
    archived = "archived"


class SprintStatus(str, Enum):
    planned = "planned"
    active = "active"
    completed = "completed"


class TaskStatus(str, Enum):
    backlog = "backlog"
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


# ─── Auth ─────────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    org_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ─── User ─────────────────────────────────────────────────────────────────────
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    discord_user_id: Optional[str] = None
    github_username: Optional[str] = None
    github_avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organization_id: Optional[str]
    discord_user_id: Optional[str] = None
    github_username: Optional[str] = None
    github_avatar_url: Optional[str] = None
    created_at: datetime
    class Config: from_attributes = True

# ─── Organization ─────────────────────────────────────────────────────────────
class OrgResponse(BaseModel):
    id: str
    name: str
    plan_type: PlanType
    subscription_status: str
    created_at: datetime
    class Config: from_attributes = True

# ─── Project ──────────────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    deadline: Optional[datetime] = None
    github_repo: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[ProjectStatus] = None
    github_repo: Optional[str] = None
    discord_webhook_url: Optional[str] = None
    slack_webhook_url: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    deadline: Optional[datetime]
    organization_id: str
    status: ProjectStatus
    github_repo: Optional[str]
    discord_webhook_url: Optional[str] = None
    slack_webhook_url: Optional[str] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    class Config: from_attributes = True

# ─── Task ─────────────────────────────────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: Priority = Priority.medium
    assigned_to: Optional[str] = None
    sprint_id: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    labels: Optional[str] = ""

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    assigned_to: Optional[str] = None
    sprint_id: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    labels: Optional[str] = None
    github_issue_url: Optional[str] = None
    github_branch: Optional[str] = None
    github_pr: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    project_id: str
    sprint_id: Optional[str]
    title: str
    description: str
    status: TaskStatus
    priority: Priority
    assigned_to: Optional[str]
    github_issue_id: Optional[int]
    github_issue_url: Optional[str]
    github_branch: Optional[str]
    github_pr: Optional[str]
    start_date: Optional[datetime]
    due_date: Optional[datetime]
    labels: str
    created_at: datetime
    comments: List["CommentResponse"] = []
    class Config: from_attributes = True

# ─── Comment ──────────────────────────────────────────────────────────────────
class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    task_id: str
    user_id: str
    content: str
    created_at: datetime
    class Config: from_attributes = True

# ─── Sprint ───────────────────────────────────────────────────────────────────
class SprintCreate(BaseModel):
    name: str
    goal: Optional[str] = ""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[SprintStatus] = None

class SprintResponse(BaseModel):
    id: str
    project_id: str
    name: str
    goal: str
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    status: SprintStatus
    created_at: datetime
    class Config: from_attributes = True

# ─── Standup ──────────────────────────────────────────────────────────────────
class StandupCreate(BaseModel):
    yesterday_work: str
    today_plan: str
    blockers: Optional[str] = ""

class StandupResponse(BaseModel):
    id: str
    sprint_id: str
    user_id: str
    date: datetime
    yesterday_work: str
    today_plan: str
    blockers: str
    created_at: datetime
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    class Config: from_attributes = True

# ─── Retrospective ────────────────────────────────────────────────────────────
class RetrospectiveCreate(BaseModel):
    went_well: Optional[str] = ""
    needs_improvement: Optional[str] = ""
    action_items: Optional[str] = ""

class RetrospectiveUpdate(BaseModel):
    went_well: Optional[str] = None
    needs_improvement: Optional[str] = None
    action_items: Optional[str] = None

class RetrospectiveResponse(BaseModel):
    id: str
    sprint_id: str
    went_well: str
    needs_improvement: str
    action_items: str
    created_at: datetime
    class Config: from_attributes = True

# ─── Activity Log ─────────────────────────────────────────────────────────────
class ActivityLogResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: Optional[str]
    message: str
    created_at: datetime
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    class Config: from_attributes = True

# ─── Notifications ────────────────────────────────────────────────────────────
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str]
    message: str
    is_read: bool
    link: Optional[str]
    created_at: datetime
    class Config: from_attributes = True

# ─── Invitations ──────────────────────────────────────────────────────────────
class InvitationCreate(BaseModel):
    email: EmailStr

class InvitationResponse(BaseModel):
    id: str
    email: str
    organization_id: str
    invited_by: str
    status: str
    created_at: datetime
    class Config: from_attributes = True

# ─── Time Entry ───────────────────────────────────────────────────────────────
class TimeEntryCreate(BaseModel):
    task_id: Optional[str] = None
    description: Optional[str] = ""
    duration_minutes: int
    date: Optional[datetime] = None

class TimeEntryResponse(BaseModel):
    id: str
    project_id: str
    task_id: Optional[str]
    user_id: str
    description: str
    duration_minutes: int
    date: datetime
    created_at: datetime
    user_name: Optional[str] = None
    task_title: Optional[str] = None
    class Config: from_attributes = True

# ─── Project Summary ──────────────────────────────────────────────────────────
class ProjectSummaryResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    total_time_minutes: int
    total_time_hours: float
    member_hours: List[dict]
    task_time: List[dict]
    status: str
    created_at: Optional[datetime]
    closed_at: Optional[datetime]
