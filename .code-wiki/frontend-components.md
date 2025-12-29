# 🎨 Frontend Components

> React component documentation for Synergy Platform

**Framework:** React 19 + TypeScript  
**Build Tool:** Vite 6

---

## Component Tree

```
App.tsx
├── LanguageProvider (context)
└── AppContent
    ├── [Not Authenticated] → LoginPage.tsx
    └── [Authenticated]
        ├── Sidebar.tsx (LanguageSwitcher)
        ├── AdminDashboard.tsx (admin)
        └── ManagerDashboard.tsx (manager)
```

---

## Core Components

### App.tsx
Main router. Checks auth on mount, renders LoginPage or dashboard based on role.

### LoginPage.tsx
Email/password form with glassmorphism design. Shows demo credentials.

### Sidebar.tsx
Navigation with user info, company badge, context display, and logout.

### AdminDashboard.tsx (~987 lines)
**Tabs:** Dashboard, Setup, Live, Correction, Audit

**Key features:**
- Stats overview + leaderboard
- Excel upload
- Payment correction modal
- Audit search/filter

### ManagerDashboard.tsx (~433 lines)
**Features:**
- Doctor target list table
- Month selector
- Payment verification modal
- AI receipt upload

### StatsCard.tsx
Reusable metric card component.

### LanguageSwitcher.tsx
EN/RU/UZ language toggle.

---

## Services

| File | Purpose |
|------|---------|
| `api.ts` | HTTP client with auth |
| `authService.ts` | Login/logout/session |
| `dataService.ts` | Data operations |
| `i18n.ts` | Translations (EN/RU/UZ) |

---

*Next: [Business Logic →](./business-logic.md)*
