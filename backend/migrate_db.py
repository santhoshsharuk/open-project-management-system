"""One-time migration script to add missing columns/tables to existing devflow.db"""
import sqlite3

conn = sqlite3.connect("devflow.db")
c = conn.cursor()

# List existing tables
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in c.fetchall()]
print("Existing tables:", tables)

# Show columns for each table
for t in tables:
    c.execute(f"PRAGMA table_info({t})")
    cols = [col[1] for col in c.fetchall()]
    print(f"  {t}: {cols}")

# --- Add missing columns to users table ---
c.execute("PRAGMA table_info(users)")
user_cols = [col[1] for col in c.fetchall()]
print("\nUser columns:", user_cols)

if "discord_user_id" not in user_cols:
    print("Adding discord_user_id to users...")
    c.execute("ALTER TABLE users ADD COLUMN discord_user_id VARCHAR")

if "github_username" not in user_cols:
    print("Adding github_username to users...")
    c.execute("ALTER TABLE users ADD COLUMN github_username VARCHAR")

if "github_avatar_url" not in user_cols:
    print("Adding github_avatar_url to users...")
    c.execute("ALTER TABLE users ADD COLUMN github_avatar_url VARCHAR")

# --- Create missing tables ---

if "activity_logs" not in tables:
    print("Creating activity_logs table...")
    c.execute("""
        CREATE TABLE activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL REFERENCES projects(id),
            user_id INTEGER NOT NULL REFERENCES users(id),
            action VARCHAR NOT NULL,
            entity_type VARCHAR NOT NULL,
            entity_id INTEGER,
            message VARCHAR NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

if "notifications" not in tables:
    print("Creating notifications table...")
    c.execute("""
        CREATE TABLE notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            project_id INTEGER REFERENCES projects(id),
            message VARCHAR NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            link VARCHAR,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

if "invitations" not in tables:
    print("Creating invitations table...")
    c.execute("""
        CREATE TABLE invitations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR NOT NULL,
            organization_id INTEGER NOT NULL REFERENCES organizations(id),
            invited_by INTEGER NOT NULL REFERENCES users(id),
            status VARCHAR DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

if "time_entries" not in tables:
    print("Creating time_entries table...")
    c.execute("""
        CREATE TABLE time_entries (
            id VARCHAR PRIMARY KEY,
            project_id VARCHAR NOT NULL REFERENCES projects(id),
            task_id VARCHAR REFERENCES tasks(id),
            user_id VARCHAR NOT NULL REFERENCES users(id),
            description TEXT DEFAULT '',
            duration_minutes INTEGER NOT NULL,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

# --- Add closed_at to projects table if missing ---
c.execute("PRAGMA table_info(projects)")
project_cols = [col[1] for col in c.fetchall()]
if "closed_at" not in project_cols:
    print("Adding closed_at to projects...")
    c.execute("ALTER TABLE projects ADD COLUMN closed_at DATETIME")

conn.commit()

# Verify
print("\n=== After migration ===")
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in c.fetchall()]
for t in tables:
    c.execute(f"PRAGMA table_info({t})")
    cols = [col[1] for col in c.fetchall()]
    print(f"  {t}: {cols}")

# Check existing data
c.execute("SELECT COUNT(*) FROM organizations")
print(f"\nOrganizations: {c.fetchone()[0]}")
c.execute("SELECT COUNT(*) FROM users")
print(f"Users: {c.fetchone()[0]}")
c.execute("SELECT COUNT(*) FROM projects")
print(f"Projects: {c.fetchone()[0]}")
c.execute("SELECT id, name, organization_id FROM projects")
for row in c.fetchall():
    print(f"  Project #{row[0]}: {row[1]} (org_id={row[2]})")
c.execute("SELECT id, email, organization_id FROM users")
for row in c.fetchall():
    print(f"  User #{row[0]}: {row[1]} (org_id={row[2]})")

conn.close()
print("\nMigration complete!")
