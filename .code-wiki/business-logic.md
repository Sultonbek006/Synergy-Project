# 📋 Business Logic

> Multi-company rules and verification logic

---

## Company Access Rules

### Synergy
| Group Access | Visible Groups |
|--------------|----------------|
| ALL | A, B, C, A2, B2 |
| AB | A, B, AB |
| A2C | A2, C, A2C |
| A2CB2 | A2, C, A2C, B2 |
| B2 | B2 only |

### Amare (Tashkent District-Based)
| Access | Districts |
|--------|-----------|
| VITA1/FORTE1 | Бектемир, Қибрай, Мирзо Улуғбек, Миробод, Сирғали, Юнусобод, Янгиҳаёт, Яшнобод |
| VITA2/FORTE2 | Олмазор, Келес, Назарбек, Учтепа, Чилонзор, Шайхонтохур, Эшонгузар, Яккасарой |

### Galassiya & Perfetto
No groups - region-only filtering.

---

## AI Verification Rules

### Gatekeeper Checks (in order)
1. **Date Required** - Month/Year must be present
2. **Authentication** (Cash only) - Signature OR Stamp required
3. **Month Match** - Must match plan month
4. **Identity Match** - Phone OR name must match
5. **Duplicate Check** - Transaction ID must be unique

### Amount Extraction
- **UZS Mode:** Multiply shorthand by 1000 (e.g., "500" → 500,000)
- **Dollar Mode:** Use exact value (e.g., "50" → $50)

---

## Status Flow

```
Pending → [AI Verify] → ✅ Verified
                     → ⚠️ Underpaid (Debt: X UZS)
                     → ⚠️ Overpaid (+X UZS)
                     → ❌ REJECTED (reason)
```

---

*Next: [Authentication →](./authentication.md)*
