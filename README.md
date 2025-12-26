# StaySpot - Full-Stack Property Management Application

StaySpot is a full-stack web application with role-based authentication for property owners and tenants.

## Tech Stack

- **Frontend**: React.js (Plain JSX) with Tailwind CSS
- **Backend**: Django REST Framework with SQLite
- **Authentication**: Session-based with role-based access control

## Features

- User Registration (Owner/Tenant)
- User Login with role verification
- Forgot Password UI (Email/Phone reset options)
- Role-based Dashboards:
  - **Owner Dashboard**: Manage properties, bookings, analytics
  - **Tenant Dashboard**: Browse properties, manage bookings, favorites
- Form validation with visual feedback
- Responsive design with Tailwind CSS
- Clean, organized code structure with separation of concerns

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Mac/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create admin superuser (optional):
```bash
python manage.py createsuperuser
```

6. Start Django server:
```bash
python manage.py runserver
```

Backend runs on http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start React development server:
```bash
npm start
```

Frontend runs on http://localhost:3000

## API Endpoints

- `POST /api/register/` - Register new user (Owner/Tenant)
- `POST /api/login/` - Login user (Owner/Tenant)
- `POST /api/logout/` - Logout user
- `GET /api/user/` - Get current user info
- `GET /api/csrf/` - Get CSRF token for authenticated requests

## User Roles

- **Owner**: Can manage properties, view bookings, and analytics
- **Tenant**: Can browse properties, make bookings, and manage favorites
- **Admin**: Access Django admin panel (created via createsuperuser)

## Project Structure

```
.
├── backend/              # Django backend
│   ├── accounts/         # User authentication app
│   │   ├── models.py     # User model
│   │   ├── views.py      # API views
│   │   ├── urls.py       # API routes
│   │   └── admin.py      # Admin configuration
│   ├── stayspot/         # Django project settings
│   │   ├── settings.py   # Project configuration
│   │   └── urls.py       # Root URL configuration
│   └── manage.py
├── frontend/             # React frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   └── TenantDashboard.jsx
│   │   ├── components/   # Reusable components
│   │   │   └── Navigation.jsx
│   │   ├── utils/        # Utility functions
│   │   │   └── api.js     # API helper functions
│   │   ├── constants/    # Constants and configuration
│   │   │   └── api.js     # API endpoints and routes
│   │   ├── App.jsx       # Main app component
│   │   └── index.js      # Entry point
│   └── package.json
└── README.md
```

## Notes

- Make sure both backend and frontend servers are running
- Backend must be running before frontend can make API calls
- CORS is configured for localhost:3000
- User sessions are stored in browser localStorage



