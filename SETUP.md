# Capstone Project - Complete Setup Guide

This guide walks you through setting up the Capstone project on your local machine after cloning it.

## Prerequisites

Before you start, ensure you have installed:

- **Python 3.10+**: [Download](https://www.python.org/downloads/)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **PostgreSQL 12+**: [Download](https://www.postgresql.org/download/)
- **Git**: [Download](https://git-scm.com/)
- **Tesseract OCR** (optional, for document OCR): [Download](https://github.com/UB-Mannheim/tesseract/wiki)

Verify installations:
```powershell
python --version          # Should be 3.10+
node --version            # Should be 18+
npm --version
psql --version            # Should be 12+
```

---

## Step 1: Clone the Repository

```powershell
cd C:\GitProjects
git clone <your-repo-url>
cd Capstone-test
```

Your folder structure should look like:
```
Capstone-test/
├── backend/               # Django backend
├── frontend/              # React frontend
├── SETUP.md              # This file
└── README.md
```

---

## Step 2: Backend Setup

### 2.1 Create Python Virtual Environment

```powershell
cd backend

# Create virtual environment
python -m venv env

# Activate virtual environment
# On Windows:
.\env\Scripts\activate

# On Mac/Linux:
source env/bin/activate
```

You should see `(env)` at the start of your terminal prompt.

### 2.2 Install Python Dependencies

```powershell
pip install -r requirements.txt
```

This installs:
- Django 5.2
- djangorestframework & JWT authentication
- PostgreSQL driver (psycopg2)
- Django CORS headers
- Pillow (image processing)
- PyTesseract (OCR)
- And other utilities

---

## Step 3: Database Setup

### 3.1 Create PostgreSQL Database

```powershell
# Open PostgreSQL prompt
psql -U postgres -h localhost

# In psql, create the database:
CREATE DATABASE rkms;

# Exit psql
\q
```

If you haven't set a superuser password during PostgreSQL installation, you may be prompted. Default is often password-less.

### 3.2 Run Django Migrations

```powershell
cd backend  # Make sure you're in the backend directory

# Apply migrations to create tables
python manage.py migrate
```

Expected output:
```
Operations to perform:
  Apply all migrations: admin, auth, authenticator, contenttypes, documents, monitoring, sessions, system_config
Running migrations:
  ...
  Applying authenticator.0006_usercreationrequest_claimed_at_and_more... OK
  Applying documents.0010_document_auto_category_confidence_and_more... OK
  ...
```

### 3.3 Create Admin Superuser

```powershell
python manage.py createsuperuser

# Follow the prompts:
# Username: admin
# Email: admin@example.com
# Password: (Choose a strong password)
```

### 3.4 Verify Database Setup

```powershell
python manage.py check

# Should output:
# System check identified no issues (0 silenced).
```

See [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md) for detailed database troubleshooting.

---

## Step 4: Frontend Setup

### 4.1 Install Node Dependencies

```powershell
cd frontend

npm install
```

This installs:
- React 19
- React Router v7
- Axios (HTTP requests)
- Tailwind CSS
- Vite (build tool)
- And other utilities

### 4.2 Verify Frontend is Ready

```powershell
npm run lint

# Should show no major errors
```

---

## Step 5: Start Development Servers

You'll need **two terminal windows** (one for backend, one for frontend).

### Terminal 1: Backend Server

```powershell
cd backend
.\env\Scripts\activate          # Activate venv
python manage.py runserver

# Should output:
# Starting development server at http://127.0.0.1:8000/
```

### Terminal 2: Frontend Server

```powershell
cd frontend
npm run dev

# Should output:
# ➜  Local:   http://localhost:5173/
# ➜  press h + enter to show help
```

---

## Step 6: Verify Everything Works

1. **Backend API**: http://127.0.0.1:8000/
2. **Django Admin Panel**: http://127.0.0.1:8000/admin/
   - Login with your superuser credentials
3. **Frontend App**: http://localhost:5173/
4. **API Documentation** (if configured): http://127.0.0.1:8000/api/

---

## Project Structure

```
Capstone-test/
├── backend/
│   ├── authenticator/          # User authentication & organizations
│   ├── documents/              # Document management & OCR
│   ├── monitoring/             # Audit logs & notifications
│   ├── system_config/          # System themes & configuration
│   ├── backend/                # Main Django settings
│   ├── manage.py               # Django CLI
│   ├── requirements.txt        # Python dependencies
│   └── DATABASE_SETUP.md       # Database troubleshooting
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/           # React Context API
│   │   ├── services/           # API service calls
│   │   ├── admin/              # Admin UI
│   │   ├── user/               # User UI
│   │   ├── system-admin/       # System admin UI
│   │   └── App.jsx             # Main app component
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite build config
│   └── tailwind.config.js      # Tailwind CSS config
│
└── SETUP.md                    # This file

```

---

## Common Commands

### Backend

```powershell
# Navigate to backend
cd backend

# Activate virtual environment
.\env\Scripts\activate

# Run development server
python manage.py runserver

# Run on different port
python manage.py runserver 8001

# Create new migrations after model changes
python manage.py makemigrations <app_name>

# Apply migrations
python manage.py migrate

# Access Django shell
python manage.py shell

# Create superuser
python manage.py createsuperuser
```

### Frontend

```powershell
# Navigate to frontend
cd frontend

# Install/update dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build

# Run linting
npm run lint

# Preview production build locally
npm run preview
```

---

## API Endpoints Reference

All authenticated endpoints require a JWT token:
```
Authorization: Bearer <your_access_token>
```

### Authentication
- `POST /auth/register/` - Register new user
- `POST /auth/login/` - Login & get tokens
- `POST /auth/refresh/` - Refresh access token
- `GET /auth/profile/` - Get current user profile

### Documents
- `GET /api/documents/` - List user's documents
- `POST /api/documents/` - Upload new document
- `GET /api/documents/{id}/` - Get document details
- `DELETE /api/documents/{id}/` - Delete document
- `GET /api/documents/{id}/ocr_data/` - Get OCR results

### Document Sharing
- `GET /api/document-shares/` - List shares
- `POST /api/document-shares/` - Share document

### Notifications
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/{id}/mark_as_read/` - Mark one as read
- `POST /api/notifications/mark_all_as_read/` - Mark all as read

### Admin Features
- `GET /api/audit-logs/` - View audit logs (admin only)
- `GET /api/system-themes/` - List system themes
- `GET /api/system-themes/active_theme/` - Get active theme

---

## Troubleshooting

### Backend Issues

| Problem | Solution |
|---------|----------|
| "ModuleNotFoundError" | Ensure virtual environment is activated and dependencies installed |
| PostgreSQL connection fails | Check PostgreSQL is running: Services app or `psql -U postgres` |
| Database doesn't exist | Create it: `CREATE DATABASE rkms;` in psql |
| Port 8000 in use | Use different port: `python manage.py runserver 8001` |
| Migrations fail | Check database credentials in `backend/settings.py` |

See [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md) for more backend troubleshooting.

### Frontend Issues

| Problem | Solution |
|---------|----------|
| "npm: command not found" | Install Node.js from https://nodejs.org/ |
| Port 5173 in use | Use different port: `npm run dev -- --port 5174` |
| "Module not found" errors | Delete `node_modules` and `package-lock.json`, then run `npm install` |
| Blank page on localhost:5173 | Check browser console for errors, ensure backend is running |

### Database Issues

| Problem | Solution |
|---------|----------|
| "FATAL: Ident authentication failed" | Check PostgreSQL authentication in `pg_hba.conf` or use `-U postgres` |
| Cannot connect to localhost:5432 | PostgreSQL might not be running or listening on wrong port |
| "Table already exists" error | Run: `python manage.py migrate --fake-initial` |

---

## Next Steps

1. ✅ Familiarize yourself with the project structure
2. ✅ Read the [README.md](README.md) for project overview
3. ✅ Explore Django admin panel at http://127.0.0.1:8000/admin/
4. ✅ Test API endpoints with Postman or Insomnia
5. ✅ Review model structure in `backend/authenticator/models.py`, `backend/documents/models.py`, etc.
6. ✅ Start frontend development

---

## Development Tips

- **Hot Reload**: Both frontend (Vite) and backend (Django dev server) automatically reload on file changes
- **Database Changes**: After modifying models, run migrations before restarting
- **API Testing**: Use [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) to test endpoints
- **Debug Mode**: Django debug toolbar can be added for development
- **Environment Variables**: Create `.env` file in backend for sensitive settings (see DATABASE_SETUP.md)

---

## Need Help?

1. Check relevant troubleshooting sections above
2. Review the specific setup guide:
   - Backend: [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)
   - Frontend: Check `frontend/README.md` (if exists)
3. Check Django/React documentation
4. Review logs in browser console and terminal output

---

**Last Updated**: April 2026
**Project**: Capstone - Document Management with OCR
