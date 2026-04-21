StaySpot – Smart Room Rental & Management Platform
Project Description
StaySpot is a full-stack web application designed to simplify the process of finding and renting rooms/apartments. It connects property owners with tenants through a digital marketplace, promoting an efficient and transparent rental ecosystem.

Project Objective
The main objective of StaySpot is to digitize the manual room-searching process while providing a centralized dashboard for owners to manage tenants, track rental payments via eSewa/Khalti, and handle maintenance requests efficiently.

Key Features
Role-Based System
Separate Dashboards: Dedicated interfaces for Tenants, Owners, and Admins.
Authentication: Secure authentication using Django's built-in Token/Session system.
Property Discovery
Interactive Map: Geolocation-based room searching using APIs like Leaflet.
Smart Filters: Search by location, price, and amenities (WiFi, Parking, etc.).
Rental Lifecycle Management
Workflow: Pending Request → Approved → Confirmed → Occupied → Completed.
Availability Control: Automated stock updates when a room is booked or vacated.
Secure Payments
Multi-Gateway Integration: Built-in support for both eSewa and Khalti payment gateways.
Transaction History: Real-time status updates from payment providers.
Communication & Support
Chat System: Integrated real-time chat between tenants and owners.
Complaint Module: Tenants can submit maintenance issues directly to owners.
Rent Reminders: Automatic system-generated rent reminders via dashboard and email.
Trust & Moderation
Admin Verification: Admins verify user KYC and review room listings before they go public.
Feedback System: Reviews and ratings are allowed only after a completed rental stay.
Technologies Used
Frontend
React.js
Tailwind CSS
React Router DOM
Axios
Backend
Django
Django REST Framework (DRF)
Django Built-in Authentication (Token/Session with CSRF protection)
Database
PostgreSQL (Production)
SQLite (Development)
APIs
eSewa & Khalti Payment APIs
Google Maps API for maps
SMTP for automated email reminders
Deployment
Frontend: Hosted on Netlify
Backend: Hosted on Render
System Workflow
User Registration & Validation Users register using an email OTP system. Owners upload documents for Admin KYC verification.

Room Management Owners post room details and images. Modern moderation system requires Admin approval for listings.

Discovery Tenants search for rooms using the map interface or filtered list view.

Booking & Stay Tenants send booking requests. Owners approve, and payment is processed via eSewa or Khalti.

Maintenance & Closure Users use the chat for daily communication and the complaint system for repairs. Once the stay ends, the tenant can leave a review.

Installation and Setup
Backend (Django)
bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
Frontend (React)
bash
cd frontend
npm install
npm run dev
Live Project
Frontend: https://stayspot1.netlify.app/
Backend API: https://stayspot-vv6c.onrender.com

Project Structure
bash
StaySpot/
│
├── backend/
│   ├── accounts/       # User profiles & auth
│   ├── rooms/          # Listings & search
│   ├── bookings/       # Rental logic
│   ├── complaints/     # Maintenance requests
│   ├── notifications/  # Core alerts & Email
│
├── frontend/
│   ├── src/
│   │   ├── Pages/      # Dashboard and Main views
│   │   ├── Components/ # UI & Layout blocks
│   │   ├── services/   # API logic
│
├── render.yaml
└── README.md
Author
Ashika Nepal
BSc Computing Final Year Project

License
This project is developed for educational purposes as part of a Final Year Project.
