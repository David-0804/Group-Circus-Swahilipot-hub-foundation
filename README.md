# Swahilipot hub  — Management System

Full-stack web application built with React 18 (frontend) and Django 6 REST Framework (backend).

## Quick Start

### Backend

```bash
cd backend
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers Pillow python-decouple qrcode reportlab bleach
python manage.py migrate
python seed.py          # loads demo data
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Demo Credentials

| Role    | Email             | Password     |
| ------- | ----------------- | ------------ |
| Admin   | admin@bmi.ac.ke   | Admin@1234   |
| Staff   | staff@bmi.ac.ke   | Staff@1234   |
| IT      | it@bmi.ac.ke      | IT@12345!    |
| Student | student@bmi.ac.ke | Student@1234 |

## Modules

1. Authentication & User Management
2. Equipment & Resource Management
3. Project Submission & Review
4. FM Broadcast & Station Operations
5. News Production & Content Management
6. Infrastructure & Connectivity (Wi-Fi, Subscriptions, File Transfer, Feedback)
7. Videography, Admin Dashboard & Reporting

## Tech Stack

- **Frontend:** React 18, Vite, React Router v6, TanStack Query, Zustand, Axios, Tailwind CSS v4
- **Backend:** Django, Django REST Framework, SimpleJWT
- **Database:** SQLite (dev) → PostgreSQL (production)
- **Auth:** JWT with token blacklisting on logout

## 🚀 Future Enhancements

### 🔐 Security & Authentication
- Role-based access control (RBAC) with granular permissions
- Two-factor authentication (2FA)
- OAuth2 / Social login (Google, Microsoft, GitHub)
- Audit logs for user activity

### 📂 Documentation
- API documentation with Swagger / Postman collections
- Developer onboarding guide
- Contribution guidelines & code of conduct

  
# Group-Circus-Swahilipot-hub-foundation
