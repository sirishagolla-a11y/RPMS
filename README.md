# RLW — Railway Parking Management System (RPMS)

[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![MySQL](https://img.shields.io/badge/MySQL-Aiven-4479A1?style=for-the-badge&logo=mysql)](https://aiven.io)
[![WhatsApp](https://img.shields.io/badge/WhatsApp_Cloud_API-Meta-25D366?style=for-the-badge&logo=whatsapp)](https://developers.facebook.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

An enterprise-grade, full-stack digital parking management application engineered for high-volume railway station parking facilities. Operates live with automated check-in ticket generation, duration-based hourly tariff calculation, operator duty shift handovers, analytical reporting dashboards, and automated Meta WhatsApp Cloud API pass expiry warnings.

---

## 📌 Problem Statement

Railway station parking lots experience massive daily vehicular flow comprising both casual commuters and long-term monthly pass subscribers. Traditional paper token systems suffer from:
1. High ticket processing delays and revenue leakage during shift handovers.
2. Inaccurate manual fee calculations for varying vehicle categories.
3. Lack of real-time occupancy visibility for station authorities.
4. Pass expiry confusion, leading to expired vehicles clogging subscriber slots.

---

## 💡 Solution

**RLW** provides a unified, digital solution connecting station operators, parking management, and commuters:
* **Rapid Check-In & Verification**: Instant zero-tariff check-in for active monthly members and thermal ticket generation for casual commuters.
* **Automated Tariff Engine**: Precision hourly fee calculations (Car ₹30/hr, Bike ₹10/hr, Heavy ₹50/hr) with Cash and UPI payment reconciliation.
* **Operator Shift Handover Audit**: Enforces operator shift duty logging and produces printable cash handover receipts upon closing a shift.
* **Meta WhatsApp Cloud API Reminders**: Automated 7-day, 3-day, and 1-day pass expiry notifications sent directly to customer WhatsApp numbers.
* **Executive Analytics & Printable Reports**: Filterable utilization gauges, payment splits, vehicle category distribution, and printable financial reports.

---

## ✨ Key Features (100% Operational)

* 🚗 **Vehicle Entry Check-In**: Automatic detection of active monthly passes vs casual entry with receipt number generation (`REC-YYYYMMDD-XXXX`).
* 💳 **Vehicle Exit & Fee Checkout**: Calculates exact duration (rounded up to hourly increments) and processes Cash or UPI payments.
* 🎫 **Thermal Ticket Printing**: Thermal receipt preview and printing capability for casual entries and exit settlements.
* 👨‍✈️ **Operator Shift Management**: Ensures only one active shift exists at a time; tracks entries, exits, and cash collected during an operator's duty window.
* 📊 **Live Operations Dashboard**: Auto-refreshing metrics showing currently parked count, today's entries/exits, today's revenue, active subscriptions, and 5-day expiry alerts.
* 📈 **Analytics & Reports Dashboard**: Date range filters (*Today*, *Last 7 Days*, *This Month*, *Custom*) with occupancy progress bar, revenue payment splits, daily trend bar charts, and PDF report printing.
* 📱 **WhatsApp Pass Expiry System**: Built on Meta's official WhatsApp Business Cloud API architecture with interval checking (7-day/3-day/1-day), duplicate prevention, single & batch triggers, and delivery audit history.
* 🤖 **AI / ANPR Integration Ready**: Includes standalone camera check-in endpoint (`/api/sessions/ai_check/`) for ANPR automatic license plate recognition integration.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      OPERATOR / ADMIN DASHBOARD                         │
│                    React 18 + Vite (Deploys to Vercel)                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / REST API (JSON)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DJANGO REST FRAMEWORK BACKEND                    │
│                 Python 3.10+ / Gunicorn (Deploys to Render)              │
│                                                                         │
│   ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│   │ Check-In / Exit  │  │ Shift Management │  │ Reports & Analytics │   │
│   │    Engine        │  │     Engine       │  │       Engine        │   │
│   └────────┬─────────┘  └────────┬─────────┘  └──────────┬──────────┘   │
│            │                     │                       │              │
└────────────┼─────────────────────┼───────────────────────┼──────────────┘
             │                     │                       │
             ▼                     ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                │
│                Aiven MySQL (Production) / SQLite3 (Local)               │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      META WHATSAPP CLOUD API                            │
│           Automated Pass Expiry Reminders (7-day / 3-day / 1-day)       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, React Router v6, Vanilla CSS (Glassmorphism design system).
* **Backend**: Django 4.2+, Django REST Framework, WhiteNoise, Gunicorn, PyMySQL.
* **Database**: Managed Aiven MySQL (Production over SSL) / SQLite3 (Local Development).
* **Notifications**: Meta WhatsApp Business Cloud API (Graph API v18.0).
* **Cloud Infrastructure**: Vercel (Frontend SPA) + Render (Backend API Service).

---

## 📁 Project Structure

```
RLW/
├── backend/
│   ├── parking_app/
│   │   ├── migrations/             # Database schema migrations
│   │   ├── models.py               # Vehicle, Session, MonthlyPass, Shift, ReminderLog models
│   │   ├── views.py                # REST API ViewSets (Check-In, Release, Shifts, Reports)
│   │   ├── reminder_service.py     # Meta WhatsApp Cloud API engine
│   │   ├── serializers.py          # DRF Serializers
│   │   ├── urls.py                 # App router paths
│   │   └── tests.py                # Automated backend test suite
│   ├── parking_project/
│   │   ├── settings.py             # Production Django settings (CORS, Whitenoise, DB)
│   │   ├── urls.py                 # Root URL router
│   │   └── wsgi.py                 # WSGI entry point
│   ├── .env.example                # Backend environment configuration template
│   ├── Procfile                    # Render WSGI deployment runner
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/             # Layout and Sidebar components
│   │   ├── pages/                  # Dashboard, VehicleEntry, VehicleRelease, Shift, Reports, MonthlyPass
│   │   ├── services/               # API service integration layer (api.js)
│   │   ├── styles/                 # Glassmorphic CSS and thermal print styles
│   │   ├── App.jsx                 # Client-side routing
│   │   └── main.jsx                # React entry point
│   ├── .env.example                # Frontend environment template
│   ├── vercel.json                 # Vercel SPA route rewrite configuration
│   └── package.json                # Dependencies and build scripts
├── docs/
│   ├── architecture.md             # In-depth architectural data flow
│   ├── api.md                      # Complete API endpoint documentation
│   └── screenshots/                # Visual user interface showcase index
├── .gitignore                      # Git tracking exclusion definitions
├── Procfile                        # Root web process definition
├── LICENSE                         # MIT Open Source License
└── README.md                       # Project documentation
```

---

## ⚙️ Environment Variables Setup

### Backend Environment Variables (`backend/.env`)

```env
DJANGO_SECRET_KEY=your-django-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Database (Production Aiven MySQL)
DATABASE_URL=mysql://user:password@host:port/dbname?ssl-mode=REQUIRED

# Meta WhatsApp Cloud API Credentials
WHATSAPP_ACCESS_TOKEN=your-meta-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-whatsapp-business-account-id
WHATSAPP_API_VERSION=v18.0
WHATSAPP_TEMPLATE_NAME=monthly_pass_expiry_reminder
WHATSAPP_TEMPLATE_LANG=en
```

### Frontend Environment Variables (`frontend/.env`)

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## 🚀 Quickstart — Running Locally

### 1. Clone & Set Up Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```
Backend API will start at `http://127.0.0.1:8000/api/`.

### 2. Set Up Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend Web UI will open at `http://localhost:5173/`.

---

## 🧪 Testing & Verification

Run the automated backend test suite:

```bash
cd backend
python manage.py test
```

Expected Output:
```text
Creating test database for alias 'default'...
...
----------------------------------------------------------------------
Ran 4 tests in 0.18s

OK
Destroying test database for alias 'default'...
```

Verify production frontend build:

```bash
cd frontend
npm run build
```

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

## 👥 Authors & Acknowledgments

Built for the Hackathon by **Sirisha Golla** & Team RLW.
