# RLW - Railway Parking Management System Architecture

## System Overview

RLW (Railway Parking Management System) is an enterprise-grade, end-to-end digital parking management application built for high-throughput railway station parking facilities.

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

## Core Modules & Data Flow

### 1. Check-In & Ticket Receipt Engine
* **Endpoint**: `POST /api/sessions/check_entry/`
* **Flow**:
  1. Operator inputs vehicle registration number (e.g. `AP39AB1234`).
  2. System checks `MonthlyPass` model for an active pass (`status='ACTIVE'`, `start_date <= today <= expiry_date`).
  3. **If Active Monthly Pass Found**:
     * Creates `ParkingSession` with `payment_method='FREE_MONTHLY'`, `parking_fee=0.00`, and `status='parked'`.
     * Emits zero-tariff monthly check-in receipt.
  4. **If Casual Visitor**:
     * Creates `ParkingSession` with `payment_status='unpaid'`, `status='parked'`, and a unique thermal ticket receipt number (e.g. `REC-20260926-A1B2`).

### 2. Exit Checkout & Fee Calculation Engine
* **Endpoint**: `POST /api/sessions/{id}/release/`
* **Flow**:
  1. Operator selects vehicle from live "Currently Parked" table.
  2. System computes parked duration: `duration = exit_time - entry_time`.
  3. Applies hourly tariff structure based on vehicle type:
     * **Car / SUV**: ₹30 / hour (rounded up)
     * **Bike / Two-Wheeler**: ₹10 / hour (rounded up)
     * **Truck / Bus**: ₹50 / hour (rounded up)
  4. Accepts Cash or UPI payment, updates session status to `released`, and generates a thermal receipt printable via `@media print`.

### 3. Operator Duty Shift Handover Engine
* **Endpoint**: `POST /api/shifts/open_shift/`, `POST /api/shifts/{id}/close_shift/`
* **Flow**:
  1. Only one operator shift can be active (`status='OPEN'`) at any given time.
  2. Closing a shift calculates total entries, total exits, and total cash/UPI revenue collected during the exact window `[start_time, end_time]`.
  3. Generates a printable Shift Handover Summary for station cash audit.

### 4. Meta WhatsApp Business Cloud API Integration
* **Service**: `parking_app/reminder_service.py`
* **Flow**:
  1. Periodically scans active passes expiring in 7 days, 3 days, or 1 day.
  2. Sanitizes mobile number into international E.164 format (e.g. `919876543210`).
  3. Verifies `ReminderLog` to prevent duplicate reminders for the same pass and interval on the same date.
  4. Dispatches official Meta WhatsApp Cloud API POST request using pre-approved message templates.

---

## Deployment Architecture

* **Frontend**: React 18 + Vite SPA hosted on **Vercel**. Configured with `vercel.json` SPA rewrites to ensure seamless routing.
* **Backend**: Django REST Framework + WhiteNoise + Gunicorn hosted on **Render Web Services**.
* **Database**: Managed **Aiven MySQL** connecting over SSL (`ssl-mode=REQUIRED`) in production, with fallback to SQLite3 for local development.
