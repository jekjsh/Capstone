# Django Capstone Backend - Setup Guide

## Project Structure Overview

Your backend is organized into separate Django apps (not true microservices, but modular monolithic):

```
backend/
├── authenticator/        # User authentication & organizations
├── documents/           # Document management
├── monitoring/          # Audit logs & notifications
├── system_config/       # System themes & configuration
└── backend/             # Main Django project
```

**This is all one database with 9 main tables:**
- users (CustomUser)
- organizations
- id_format
- documents
- document_shares
- ocr_data
- audit_logs
- notifications
- system_themes

---

## Database Initialization Commands

### 1. Create Migrations (First Time Only)
```powershell
cd C:\Capstone\backend

# Create migrations for all apps
python manage.py makemigrations authenticator
python manage.py makemigrations documents
python manage.py makemigrations monitoring
python manage.py makemigrations system_config
```

### 2. Apply Migrations (Create Tables)
```powershell
# Apply all migrations to PostgreSQL database
python manage.py migrate
```

### 3. Create Superuser (Admin)
```powershell
# This will be your admin account to access /admin/ dashboard
python manage.py createsuperuser

# Follow prompts:
# - User ID: admin1
# - Email: admin@system.com
# - Password: (your choice)
```

### 4. Verify Database
```powershell
# Check if database is set up correctly
python manage.py check

# Should output: "System check identified no issues (0 silenced)."
```

---

## Running the Development Server

```powershell
cd C:\Capstone\backend

# Start development server
python manage.py runserver

# Should display:
# Starting development server at http://127.0.0.1:8000/
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

**Database won't connect:**
- Check PostgreSQL is running
- Verify credentials in `backend/settings.py`
- Run: `psql -U postgres -h localhost`

**"Table already exists" error:**
- Your database might already be initialized. Run: `python manage.py migrate --fake-initial`

**Cannot login with superuser:**
- Clear browser cookies
- Try creating another superuser: `python manage.py createsuperuser`

**Port 8000 already in use:**
- Use different port: `python manage.py runserver 8001`

---

## Next Steps

1. ✅ Run migrations
2. ✅ Create superuser
3. ✅ Test API endpoints with Postman/Insomnia
4. 📝 Create admin users with different roles
5. 🔗 Connect frontend to these API endpoints
6. 🔐 Implement organization hierarchy logic (as needed)
7. 📊 Set up audit logging triggers in views
