# StaySpot Backend

Django REST API backend for StaySpot application.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

4. Create admin superuser:
```bash
python manage.py createsuperuser
```

5. Run server:
```bash
python manage.py runserver
```

The API will run on http://localhost:8000

## API Endpoints

- `POST /api/register/` - Register new user (Owner/Tenant)
  - Body: `{ "full_name": "...", "email": "...", "phone": "...", "password": "...", "role": "Owner" | "Tenant" }`

- `POST /api/login/` - Login user (Owner/Tenant)
  - Body: `{ "email": "...", "password": "...", "role": "Owner" | "Tenant" }`

## Admin

Access Django admin at http://localhost:8000/admin/
