# 🔌 API Reference

> Complete endpoint documentation for Synergy Platform Backend

**Base URL:** `http://localhost:8000`  
**API Docs:** `http://localhost:8000/docs` (Swagger UI)

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Auth Routes

### POST `/token`
**Login - Get JWT Token**

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | User email (OAuth2 uses 'username') |
| `password` | string | User password |

**Request:** `application/x-www-form-urlencoded`

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Token Expiry:** 8 hours (480 minutes)

---

### GET `/users/me`
**Get Current User Details**

🔒 Requires: Bearer Token

**Response:**
```json
{
  "id": 1,
  "email": "manager@synergy.com",
  "role": "manager",
  "company": "Synergy",
  "region": "SURXANDARYO",
  "group_access": "AB"
}
```

---

## 👔 Manager Routes

### GET `/manager/doctors`
**Get Assigned Doctors**

🔒 Requires: Bearer Token (Manager)

Backend automatically filters by:
- User's company
- User's region(s)
- User's group access (company-specific logic)

| Query Param | Type | Description |
|-------------|------|-------------|
| `month` | int (1-12) | Optional month filter |

**Response:**
```json
[
  {
    "id": 1,
    "company": "Synergy",
    "region": "SURXANDARYO",
    "district": "Термиз",
    "group_name": "A",
    "manager_name": "Иванов А.А.",
    "doctor_name": "Саидова М.М.",
    "specialty": "Терапевт",
    "workplace": "Поликлиника №5",
    "phone": "909039992",
    "card_number": "8600123456789012",
    "target_amount": 500000,
    "planned_type": "Card",
    "month": 12,
    "status": "Pending",
    "proof_image": null,
    "amount_paid": 0
  }
]
```

---

### POST `/manager/verify`
**Verify Payment with AI**

🔒 Requires: Bearer Token (Manager)

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Receipt image (JPEG, PNG, PDF) |
| `plan_id` | int | Master plan item ID |
| `payment_method` | string | `"Card"` or `"Cash"` |

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified: 500,000 UZS",
  "extracted_amount": 500000,
  "new_status": "✅ Verified"
}
```

**Response (Error):**
```json
{
  "detail": "❌ REJECTED: Duplicate Receipt. This transaction ID (290022691) was already used for doctor: Саидова М.М."
}
```

---

## 👑 Admin Routes

### POST `/admin/upload-plan`
**Upload Excel Master Plan**

🔒 Requires: Bearer Token (Admin)

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Excel file (.xlsx) |
| `company_name` | string | Company name |
| `month` | int | Month (1-12), default: 12 |

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 150 records",
  "inserted_count": 150,
  "errors": []
}
```

---

### GET `/admin/stats`
**Get Dashboard Statistics**

🔒 Requires: Bearer Token (Admin)

| Query Param | Type | Description |
|-------------|------|-------------|
| `company` | string | Optional company filter |
| `region` | string | Optional region filter |
| `month` | int | Optional month filter |

**Response:**
```json
{
  "total_doctors": 500,
  "total_budget": 250000000,
  "total_paid": 180000000,
  "total_debt": 70000000,
  "pending_count": 45,
  "verified_count": 455
}
```

---

### GET `/admin/users`
**Get All Users**

🔒 Requires: Bearer Token (Admin)

**Response:**
```json
[
  {
    "id": 1,
    "email": "admin@hq.com",
    "role": "admin",
    "company": "Synergy",
    "region": null,
    "group_access": null
  },
  {
    "id": 2,
    "email": "surx.ab@synergy.com",
    "role": "manager",
    "company": "Synergy",
    "region": "SURXANDARYO",
    "group_access": "AB"
  }
]
```

---

### GET `/admin/data`
**Flexible Search (Audit/Live View)**

🔒 Requires: Bearer Token (Admin)

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `company` | string | ✅ Yes | Company name |
| `region` | string | No | Region filter |
| `group` | string | No | Group filter |
| `doctor_name` | string | No | Partial name match |
| `month` | int | No | Month filter |

**Response:** Same as `/manager/doctors`

---

### GET `/admin/leaderboard`
**Manager Leaderboard**

🔒 Requires: Bearer Token (Admin)

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `company` | string | ✅ Yes | Company name |
| `month` | int | No | Month filter |

**Response:**
```json
[
  {
    "region": "SURXANDARYO",
    "group_name": "AB",
    "target": 50000000,
    "paid": 45000000,
    "debt": 5000000
  },
  {
    "region": "QASHQADARYO",
    "group_name": "A2C",
    "target": 40000000,
    "paid": 30000000,
    "debt": 10000000
  }
]
```

---

### PUT `/admin/update-payment/{plan_id}`
**Admin Payment Override**

🔒 Requires: Bearer Token (Admin)

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount_paid` | int | ✅ Yes | Corrected amount |
| `status` | string | ✅ Yes | New status |
| `admin_comment` | string | No | Admin note |
| `file` | File | No | New proof image |

**Response:**
```json
{
  "success": true,
  "message": "Payment updated",
  "new_status": "✅ Verified"
}
```

---

## 🏥 Health Check

### GET `/`
**Root Health Check**

**Response:**
```json
{
  "status": "online",
  "app": "Synergy Platform API",
  "version": "1.0.0"
}
```

### GET `/health`
**Detailed Health Check**

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "gemini_configured": true
}
```

---

## 📁 Static Files

### GET `/static/{path}`
**Serve Uploaded Files**

Access uploaded proof images via:
```
http://localhost:8000/static/Synergy/SURXANDARYO/AB/2025_12/receipt.jpg
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Bad Request - Validation failed or business rule violation |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

*Next: [Database Schema →](./database-schema.md)*
