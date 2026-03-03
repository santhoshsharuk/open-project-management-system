from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from database import Base


def gen_id():
    return str(uuid.uuid4())


class PlanType(str, enum.Enum):
    free = "free"
    pro = "pro"
    growth = "growth"


class ProjectStatus(str, enum.Enum):
    active = "active"
    on_hold = "on_hold"
    completed = "completed"
    archived = "archived"


class SprintStatus(str, enum.Enum):
    planned = "planned"
    active = "active"
    completed = "completed"


class TaskStatus(str, enum.Enum):
    backlog = "backlog"
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class Role(str, enum.Enum):
    admin = "admin"
    member = "member"


# ─── Organization ────────────────────────────────────────────────────────────
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String(200), nullable=False)
    plan_type = Column(Enum(PlanType), default=PlanType.free)
    subscription_status = Column(String(50), default="trial")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")
    projects = relationship("Project", back_populates="organization")
    github_integrations = relationship("GithubIntegration", back_populates="organization")


# ─── User ─────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(500), nullable=False)
    role = Column(Enum(Role), default=Role.member)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    discord_user_id = Column(String(100), nullable=True)
    github_username = Column(String(200), nullable=True)
    github_avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    assigned_tasks = relationship("Task", back_populates="assignee")
    comments = relationship("Comment", back_populates="user")
    standups = relationship("Standup", back_populates="user")


# ─── Project ──────────────────────────────────────────────────────────────────
class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String(300), nullable=False)
    description = Column(Text, default="")
    deadline = Column(DateTime, nullable=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.active)
    github_repo = Column(String(300), nullable=True)
    discord_webhook_url = Column(String(500), nullable=True)
    slack_webhook_url = Column(String(500), nullable=True)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="project", cascade="all, delete-orphan")


# ─── Task ─────────────────────────────────────────────────────────────────────
class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    sprint_id = Column(String, ForeignKey("sprints.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)
    priority = Column(Enum(Priority), default=Priority.medium)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    github_issue_id = Column(Integer, nullable=True)
    github_issue_url = Column(String(500), nullable=True)
    github_branch = Column(String(300), nullable=True)
    github_pr = Column(String(500), nullable=True)
    start_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    labels = Column(Text, default="")  # comma-separated
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    sprint = relationship("Sprint", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")


# ─── Comment ─────────────────────────────────────────────────────────────────
class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=gen_id)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="comments")
    user = relationship("User", back_populates="comments")


# ─── GitHub Integration ───────────────────────────────────────────────────────
class GithubIntegration(Base):
    __tablename__ = "github_integrations"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    access_token = Column(String(500), nullable=False)  # encrypted in production
    repo_name = Column(String(300), nullable=False)
    repo_id = Column(String(100), nullable=False)
    connected = Column(Boolean, default=True)
    synced_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="github_integrations")


# ─── Sprint ───────────────────────────────────────────────────────────────────
class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String(200), nullable=False)
    goal = Column(Text, default="")
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(Enum(SprintStatus), default=SprintStatus.planned)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="sprints")
    tasks = relationship("Task", back_populates="sprint")
    standups = relationship("Standup", back_populates="sprint", cascade="all, delete-orphan")
    retrospectives = relationship("Retrospective", back_populates="sprint", cascade="all, delete-orphan")


# ─── Standup ──────────────────────────────────────────────────────────────────
class Standup(Base):
    __tablename__ = "standups"

    id = Column(String, primary_key=True, default=gen_id)
    sprint_id = Column(String, ForeignKey("sprints.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    yesterday_work = Column(Text, nullable=False)
    today_plan = Column(Text, nullable=False)
    blockers = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    sprint = relationship("Sprint", back_populates="standups")
    user = relationship("User", back_populates="standups")


# ─── Retrospective ────────────────────────────────────────────────────────────
class Retrospective(Base):
    __tablename__ = "retrospectives"

    id = Column(String, primary_key=True, default=gen_id)
    sprint_id = Column(String, ForeignKey("sprints.id"), nullable=False)
    went_well = Column(Text, default="")
    needs_improvement = Column(Text, default="")
    action_items = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    sprint = relationship("Sprint", back_populates="retrospectives")


# ─── Activity Log ──────────────────────────────────────────────────────────────
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)  # e.g. "task_created", "sprint_started"
    entity_type = Column(String(50), nullable=False)  # e.g. "task", "sprint", "standup"
    entity_id = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    user = relationship("User")


# ─── In-App Notification ──────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String(500), nullable=True)  # optional deep link
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# ─── Invitation ────────────────────────────────────────────────────────────────
class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String(200), nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    invited_by = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, expired
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization")
    inviter = relationship("User")


# ─── Time Entry ────────────────────────────────────────────────────────────────
class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    description = Column(Text, default="")
    duration_minutes = Column(Integer, nullable=False)  # logged time in minutes
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="time_entries")
    task = relationship("Task")
    user = relationship("User")
