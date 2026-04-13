# Django Capstone Backend - Database Setup Guide

## Project Structure Overview

Your backend is organized into separate Django apps (modular monolithic - not true microservices):

```
backend/
├── authenticator/        # User authentication & organizations
├── documents/           # Document management & OCR
├── monitoring/          # Audit logs & notifications
├── system_config/       # System themes & configuration
└── backend/             # Main Django project settings
```

## Current Database Configuration

```
Database Engine:    PostgreSQL
Database Name:      rkms
Database User:      postgres
Database Password:  capstone1
Host:               localhost
Port:               5432
```

Database tables:
- CustomUser (users)
- Organization
- IDFormat
- Document
- DocumentShare
- OCRData
- AuditLog
- Notification
- SystemTheme

---

## Quick Start: Database Setup

### 1. Verify PostgreSQL is Running
```powershell
# Check if PostgreSQL service is running
psql -U postgres -h localhost

# Should connect without error. If not, start PostgreSQL service
```

### 2. Create Database
```powershell
# Connect to PostgreSQL and create the database
psql -U postgres -h localhost

# In psql prompt:
CREATE DATABASE rkms;
\q
```

### 3. Apply Django Migrations
```powershell
cd backend

# Install dependencies first (if not done)
pip install -r requirements.txt

# Run migrations
python manage.py migrate
```

### 4. Create Superuser (Admin Account)
```powershell
python manage.py createsuperuser

# Follow prompts:
# - Username: admin
# - Email: admin@example.com
# - Password: (your choice)
```

### 5. Verify Setup
```powershell
python manage.py check

# Should output: "System check identified no issues (0 silenced)."
```

---

## Running the Development Server

```powershell
cd backend

# Start backend server
python manage.py runserver

# Should display:
# Starting development server at http://127.0.0.1:8000/
# Access admin panel: http://127.0.0.1:8000/admin/
```

---

## Frontend Development Server

```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Usually runs on http://localhost:5173/
```

---

## API Endpoint Reference

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <your_access_token>
```

### Authentication Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/auth/register/` | POST | Register new user | No |
| `/auth/login/` | POST | Login & get tokens | No |
| `/auth/refresh/` | POST | Refresh access token | No |
| `/auth/profile/` | GET | Get current user profile | Yes |

**Login Request:**
```json
{
  "user_id": "user123",
  "password": "yourpassword"
}
```

**Response with Tokens:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Documents API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/documents/` | GET | List user's documents | Yes |
| `/api/documents/` | POST | Upload new document | Yes |
| `/api/documents/{id}/` | GET | Get document details | Yes |
| `/api/documents/{id}/` | DELETE | Delete document | Yes |
| `/api/documents/{id}/ocr_data/` | GET | Get OCR results | Yes |
| `/api/document-shares/` | GET | List shares sent/received | Yes |
| `/api/document-shares/` | POST | Share document | Yes |

### Notifications API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/notifications/` | GET | List user's notifications | Yes |
| `/api/notifications/{id}/mark_as_read/` | POST | Mark one as read | Yes |
| `/api/notifications/mark_all_as_read/` | POST | Mark all as read | Yes |

### Audit Logs (Admin Only)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/audit-logs/` | GET | View audit logs | Yes (Admin) |

### System Configuration

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/system-themes/` | GET | List all themes | No |
| `/api/system-themes/active_theme/` | GET | Get active theme | No |

---

## Admin Dashboard

Access at: `http://127.0.0.1:8000/admin/`

Log in with your superuser credentials to manage:
- Users
- Organizations
- Documents & Shares
- Audit Logs
- Notifications
- System Themes

---

## Future: After Making Model Changes

Whenever you modify `models.py`:

```powershell
# 1. Create migration file
python manage.py makemigrations <app_name>

# 2. Check what will change
python manage.py sqlmigrate <app_name> <migration_number>

# 3. Apply migration
python manage.py migrate

# 4. Restart development server
python manage.py runserver
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **PostgreSQL connection fails** | Ensure PostgreSQL service is running. Test with: `psql -U postgres -h localhost` |
| **"Database does not exist" error** | Create database: `CREATE DATABASE rkms;` (in psql) |
| **"Table already exists" error** | Database might be initialized. Try: `python manage.py migrate --fake-initial` |
| **Cannot login to admin panel** | Clear browser cookies and try again, or create new superuser |
| **Port 8000 already in use** | Use different port: `python manage.py runserver 8001` |
| **Port 5173 (frontend) already in use** | Use different port: `npm run dev -- --port 5174` |
| **"Module not found" errors** | Install dependencies: `pip install -r requirements.txt` (backend) or `npm install` (frontend) |

---

## Environment Variables

The backend uses `python-dotenv` to load `.env` file (if present). Current `settings.py` uses hardcoded values, but you can create a `.env` file for override:

```
DEBUG=True
SECRET_KEY=your-secret-key
POSTGRES_DB=rkms
POSTGRES_USER=postgres
POSTGRES_PASSWORD=capstone1
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

---

## Making Model Changes

When you modify any `models.py`:

```powershell
# 1. Create migration
python manage.py makemigrations <app_name>

# 2. View what will change
python manage.py sqlmigrate <app_name> <migration_number>

# 3. Apply migration
python manage.py migrate

# 4. Restart server
python manage.py runserver
```
