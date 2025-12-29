# 🔐 Authentication

> JWT-based auth flow for Synergy Platform

---

## Flow Diagram

```
[User] → POST /token (email, password)
            ↓
    [Backend validates credentials]
            ↓
    [JWT created (8hr expiry)]
            ↓
[User] ← { access_token, token_type }
            ↓
    [Token stored in localStorage]
            ↓
[User] → GET /users/me (Bearer token)
            ↓
    [User data stored in localStorage]
            ↓
    [Dashboard rendered based on role]
```

---

## Configuration

| Setting | Value |
|---------|-------|
| Algorithm | HS256 |
| Expiry | 8 hours (480 min) |
| Secret | `SECRET_KEY` env var |
| Token URL | `/token` |

---

## Backend Functions (auth.py)

| Function | Purpose |
|----------|---------|
| `verify_password()` | bcrypt comparison |
| `get_password_hash()` | bcrypt hashing |
| `create_access_token()` | JWT generation |
| `authenticate_user()` | Email/password validation |
| `get_current_user()` | JWT → User dependency |
| `get_current_admin()` | Admin role check |

---

## Frontend Functions (authService.ts)

| Function | Purpose |
|----------|---------|
| `login()` | Full login flow |
| `logout()` | Clear session |
| `getCurrentUser()` | Get from localStorage |
| `isLoggedIn()` | Check auth status |
| `isAdmin()` | Check admin role |

---

## Roles

| Role | Access |
|------|--------|
| `admin` | All /admin/* endpoints, company selection |
| `manager` | /manager/* endpoints, assigned doctors only |

---

*[← Back to README](./README.md)*
