# 🗄️ Database Schema

> SQLite database structure for Synergy Platform

**Database File:** `sql_app.db`  
**ORM:** SQLAlchemy  
**Models File:** `backend/models.py`

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│         users           │
├─────────────────────────┤
│ PK  id            INT   │
│     email         STR   │◄── UNIQUE, INDEX
│     hashed_password STR │
│     role          STR   │    "admin" | "manager"
│     company       STR   │    "Synergy" | "Amare" | "Galassiya" | "Perfetto"
│     region        STR   │    Nullable, can be comma-separated
│     group_access  STR   │    Nullable, e.g., "AB", "A2C", "VITA1"
└─────────────────────────┘

                                    │
                                    │ (User manages doctors via company/region/group)
                                    ▼

┌─────────────────────────┐         ┌─────────────────────────┐
│      master_plan        │         │       payments          │
├─────────────────────────┤         ├─────────────────────────┤
│ PK  id            INT   │◄────────│ FK  plan_id       INT   │
│     company       STR   │         │ PK  id            INT   │
│ IDX region        STR   │         │     amount_paid   INT   │
│     district      STR   │         │     proof_image_path STR│
│ IDX group_name    STR   │         │     payment_method STR  │
│     manager_name  STR   │         │     verified_at   DATETIME│
│     doctor_name   STR   │         │     ai_log        STR   │ (JSON)
│     specialty     STR   │         │ IDX transaction_id STR  │◄── UNIQUE
│     workplace     STR   │         └─────────────────────────┘
│     phone         STR   │
│     card_number   STR   │
│     target_amount INT   │
│     planned_type  STR   │         "Card" | "Cash" | "Dollar"
│     month         INT   │         1-12
│     status        STR   │         "Pending" | "✅ Verified" | "⚠️ Underpaid"
└─────────────────────────┘
         │
         │ 1:N relationship
         └─────────────────────► payments
```

---

## Table: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, INDEX | Auto-increment ID |
| `email` | VARCHAR | UNIQUE, NOT NULL, INDEX | User login email |
| `hashed_password` | VARCHAR | NOT NULL | bcrypt hashed password |
| `role` | VARCHAR | NOT NULL | `"admin"` or `"manager"` |
| `company` | VARCHAR | NOT NULL | Company enum value |
| `region` | VARCHAR | NULLABLE | Region(s), comma-separated for multi-region |
| `group_access` | VARCHAR | NULLABLE | Group access code |

### Sample Data
```sql
INSERT INTO users (email, hashed_password, role, company, region, group_access)
VALUES 
  ('admin@hq.com', '$2b$12$...', 'admin', 'Synergy', NULL, NULL),
  ('surx.ab@synergy.com', '$2b$12$...', 'manager', 'Synergy', 'SURXANDARYO', 'AB'),
  ('tash.vita1@amare.com', '$2b$12$...', 'manager', 'Amare', 'TOSHKENT CITY', 'VITA1');
```

---

## Table: `master_plan`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, INDEX | Auto-increment ID |
| `company` | VARCHAR | NOT NULL | Company name |
| `region` | VARCHAR | NOT NULL, INDEX | Normalized uppercase Latin |
| `district` | VARCHAR | NULLABLE | Sub-region/district |
| `group_name` | VARCHAR | NOT NULL, INDEX | Team/group identifier |
| `manager_name` | VARCHAR | NULLABLE | Regional manager name |
| `doctor_name` | VARCHAR | NOT NULL | Doctor's full name |
| `specialty` | VARCHAR | NULLABLE | Medical specialty |
| `workplace` | VARCHAR | NULLABLE | Hospital/clinic name |
| `phone` | VARCHAR | NULLABLE | Contact phone (digits only) |
| `card_number` | VARCHAR | NULLABLE | Payment card number |
| `target_amount` | INTEGER | NOT NULL | Expected payment amount |
| `planned_type` | VARCHAR | NOT NULL | `"Card"`, `"Cash"`, `"Dollar"` |
| `month` | INTEGER | NOT NULL | Target month (1-12) |
| `status` | VARCHAR | DEFAULT "Pending" | Verification status |

### Column Mapping (12-Column Excel)
```
Col A  → doctor_name    (ФИО врача)
Col B  → region         (Регион)
Col C  → district       (Район)
Col D  → group_name     (Группа)
Col E  → manager_name   (МП)
Col F  → specialty      (Специальность)
Col G  → workplace      (Место работы)
Col H  → phone          (Телефон)
Col I  → card_number    (Номер карты)
Col J  → target_amount  (Сумма)
Col K  → planned_type   (Форма оплаты)
Col L  → (ignored)      (Notes/Comments)
```

### Status Values
| Status | Meaning |
|--------|---------|
| `Pending` | Awaiting verification |
| `✅ Verified` | Exact match confirmed |
| `⚠️ Underpaid (Debt: X UZS)` | Partial payment |
| `⚠️ Overpaid (+X UZS)` | Excess payment |

---

## Table: `payments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, INDEX | Auto-increment ID |
| `plan_id` | INTEGER | FOREIGN KEY → master_plan.id | Link to plan |
| `amount_paid` | INTEGER | NOT NULL | Verified payment amount |
| `proof_image_path` | VARCHAR | NULLABLE | Relative path to uploaded image |
| `payment_method` | VARCHAR | NOT NULL | `"Card/Click"`, `"Cash/Paper"`, `"Manual/Admin"` |
| `verified_at` | DATETIME | DEFAULT now() | Verification timestamp |
| `ai_log` | TEXT | NULLABLE | JSON dump of AI analysis result |
| `transaction_id` | VARCHAR | UNIQUE, INDEX, NULLABLE | For duplicate detection |

### AI Log Structure
```json
{
  "extracted_name": "Саидова М.М.",
  "extracted_phone": "909039992",
  "extracted_amount": 500000,
  "extracted_month": 12,
  "extracted_transaction_id": "290022691",
  "has_complete_date": true,
  "has_signature": true,
  "has_stamp": false,
  "is_authentic": true,
  "identity_match": true,
  "phone_matched": true,
  "name_matched": false,
  "confidence": 0.95,
  "reason": "Phone number matched: 909039992"
}
```

---

## Relationships

```python
# SQLAlchemy relationship definitions

class MasterPlan(Base):
    payments = relationship("Payment", back_populates="plan")

class Payment(Base):
    plan = relationship("MasterPlan", back_populates="payments")
```

### One-to-Many
- One `master_plan` record can have **multiple** `payments` records
- Used for tracking payment history and corrections

---

## Indexes

| Table | Column(s) | Purpose |
|-------|-----------|---------|
| users | email | Fast login lookup |
| master_plan | region | Filter by region |
| master_plan | group_name | Filter by group |
| payments | transaction_id | Duplicate detection |
| payments | plan_id | Join optimization |

---

## Region Normalization

The `backend/services.py` contains a `REGION_MAP` dictionary that normalizes various spellings (Cyrillic, Latin, abbreviations) to standardized uppercase Latin:

| Input Variants | Normalized |
|---------------|------------|
| `ТАШКЕНТ (ОБЛ)`, `TASHKENT (OBL)` | `TOSHKENT OBL` |
| `ТАШКЕНТ`, `Г.ТАШКЕНТ` | `TOSHKENT CITY` |
| `СУРХАНДАРЬЯ`, `SURXANDARYA` | `SURXANDARYO` |
| `FARGONA`, `ФЕРГАНА` | `FARG'ONA` |

---

*Next: [Frontend Components →](./frontend-components.md)*
