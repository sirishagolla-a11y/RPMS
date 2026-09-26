# RLW - Railway Parking Management System API Documentation

Base URL (Local): `http://127.0.0.1:8000/api`  
Base URL (Production): `https://rpms-backend-av4j.onrender.com/api`

---

## 1. Parking Sessions API

### Vehicle Check-In
* **URL**: `POST /sessions/check_entry/`
* **Request Body**:
  ```json
  {
    "vehicle_number": "AP39AB1234",
    "vehicle_type": "Car",
    "driver_name": "Ramesh Kumar",
    "parking_slot": "Slot-A1"
  }
  ```
* **Response (201 Created - Casual)**:
  ```json
  {
    "session": {
      "id": 1,
      "vehicle": 10,
      "vehicle_number": "AP39AB1234",
      "vehicle_type": "Car",
      "receipt_number": "REC-20260926120000-A1B2",
      "entry_time": "2026-09-26T12:00:00Z",
      "exit_time": null,
      "parking_slot": "Slot-A1",
      "parking_fee": "0.00",
      "payment_method": null,
      "payment_status": "unpaid",
      "status": "parked"
    },
    "message": "Casual vehicle entry recorded",
    "is_monthly": false
  }
  ```

### Vehicle Exit Checkout
* **URL**: `POST /sessions/{id}/release/`
* **Request Body**:
  ```json
  {
    "payment_method": "UPI"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "receipt_number": "REC-20260926120000-A1B2",
    "vehicle_number": "AP39AB1234",
    "vehicle_type": "Car",
    "entry_time": "2026-09-26T12:00:00Z",
    "exit_time": "2026-09-26T14:15:00Z",
    "parking_fee": 90.00,
    "payment_method": "UPI",
    "payment_status": "paid",
    "status": "released"
  }
  ```

### Currently Parked Vehicles
* **URL**: `GET /sessions/parked/`
* **Response (200 OK)**: Array of active `ParkingSession` objects with `status="parked"`.

---

## 2. Shift Management API

### Get Active Operator Shift
* **URL**: `GET /shifts/active/`
* **Response (200 OK - Shift Open)**:
  ```json
  {
    "id": 5,
    "operator_name": "Shift Operator 1",
    "start_time": "2026-09-26T08:00:00Z",
    "end_time": null,
    "status": "OPEN"
  }
  ```

### Open New Operator Shift
* **URL**: `POST /shifts/open_shift/`
* **Request Body**:
  ```json
  {
    "operator_name": "Shift Operator 1"
  }
  ```

### Close Operator Shift
* **URL**: `POST /shifts/{id}/close_shift/`
* **Response (200 OK)**: Returns shift summary including `total_entries`, `total_exits`, and `total_revenue`.

---

## 3. Reports & Analytics API

### Get Aggregate Reports
* **URL**: `GET /reports/?period=today|7days|month|custom&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
* **Response (200 OK)**: Returns complete KPI metrics, parking utilization stats, cash/UPI splits, vehicle breakdown, monthly pass counts, active shift status, and daily visual trends.

---

## 4. Monthly Passes & WhatsApp API

* `GET /passes/` — List all monthly passes.
* `POST /passes/` — Create new monthly subscription.
* `POST /passes/{id}/renew/` — Extend subscription expiry date.
* `GET /passes/expiring_summary/` — Get customer passes expiring within 7 days.
* `POST /passes/send_whatsapp_reminder/` — Trigger individual Meta WhatsApp reminder.
* `POST /passes/send_due_reminders/` — Scan and batch send due 7-day, 3-day, and 1-day reminders.
* `GET /passes/reminder_history/` — View audit log of sent reminders.
* `POST /passes/test_whatsapp/` — Test Meta Cloud API connection.
