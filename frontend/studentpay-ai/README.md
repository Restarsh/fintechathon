# StudentPay AI

An AI-powered educational finance assistant for international students.
Built for the **2026 FinTechathon International Track — Topic C: Cross-border & Student Finance Assistant**.

🌐 **Live demo:** `[PASTE YOUR DEPLOYED URL HERE]`
📦 **Repo:** `https://github.com/Restarsh/fintechathon/tree/main/frontend/studentpay-ai`

---

## The problem

International students face three linked money problems:

1. **Cross-border transfers** — hidden fees and rate markups make the "best" provider hard to identify
2. **Tuition & bill timing** — large bills arrive before income does
3. **Survival budgeting** — day-to-day essential spending isn't planned against the next money inflow

**StudentPay AI** addresses all three in one app, with an AI assistant that answers questions grounded in the student's own entered data.

---

## What it does

| Module | Purpose |
|---|---|
| 🔐 **Authentication** | Local prototype account (salted SHA-256, 5-attempt lockout) |
| 💸 **Transfer comparison** | Compare remittance providers by rate, fee, and estimated recipient amount; calculate hidden cost vs. mid-market rate |
| 🧮 **Affordability calculator** | Monthly income vs. expenses with budget-status warnings |
| 🧭 **Money Survival Planner** | Forecast whether essentials are covered until next income |
| 🧾 **Transaction tracker** | Record income/expenses, export CSV |
| 📅 **Bill & tuition guardian** | Track due/overdue/paid bills |
| 🎯 **Savings goals** | Target amount, current savings, monthly required saving |
| 📊 **Dashboard** | Financial health score + smart tips |
| 🤖 **AI assistant** | Server-side LLM proxy answers questions using the student's session data |
| 🛡️ **Scam shield** | Checklist-based risk heuristic for suspicious offers |
| 🧾 **Activity log** | Selected security-relevant events per user |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│  Browser (frontend/studentpay-ai/)           │
│  ├─ index.html       — markup                │
│  ├─ styles.css       — styles                │
│  └─ app.js           — application logic     │
│                                              │
│  Data: localStorage (key: sp_v1)             │
└──────────────────────────────────────────────┘
                    │
                    │ POST /api/chat {q, ctx}
                    ▼
┌──────────────────────────────────────────────┐
│  Vercel Serverless Function                  │
│  api/chat.js                                 │
│  ├─ Validates request                        │
│  ├─ Adds system prompt + student context     │
│  └─ Calls OpenRouter with OPENROUTER_KEY     │
│       (server-side env var, NOT in client)   │
└──────────────────────────────────────────────┘
                    │
                    ▼
             OpenRouter LLM
             (model: openrouter/free)
```

**Key design decisions:**

- **No framework, no build step.** Three static files + one serverless function. Deploys to Vercel with zero configuration.
- **API key is server-side only.** The frontend never sees `OPENROUTER_KEY`.
- **Deterministic fallback.** If the AI endpoint is unreachable, `localAI()` answers from the same data so the prototype remains usable offline.
- **Data stays in the browser.** All user data lives in `localStorage` — this is a prototype, not a production service.

---

## Run locally

Requires Node.js 18+.

```bash
git clone https://github.com/Restarsh/fintechathon.git
cd fintechathon/frontend/studentpay-ai

# Create local env file
cp .env.local.example .env.local
# Edit .env.local and paste your OpenRouter key:
#   OPENROUTER_KEY=sk-or-v1-...
# Get a free key at https://openrouter.ai/keys (no credit card)

# Install Vercel CLI (once)
npm install -g vercel

# Run
vercel dev
```

Open `http://localhost:3000`.

**Important:** when `vercel dev` asks *"Pull development environment variables into .env.local?"*, **answer `no`** — otherwise it overwrites your local key with an empty value.

---

## Deploy

**Option A — Vercel Dashboard (recommended):**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import this repository
3. **Root Directory** → `frontend/studentpay-ai`
4. **Environment Variables** → add `OPENROUTER_KEY` = your key
5. Deploy

**Option B — CLI:**

```bash
cd frontend/studentpay-ai
vercel --prod
```

Then add `OPENROUTER_KEY` in Vercel Dashboard → Settings → Environment Variables, and redeploy.

---

## Test cases

See [`tests/TEST_PLAN.md`](tests/TEST_PLAN.md) for 21 manual test cases covering all modules (including 3 AI-proxy-specific tests).

---

## Security notes

- **Passwords:** random per-user salt + SHA-256 digest in `localStorage` — **prototype only**, see [`docs/Security_Self_Assessment.pdf`](docs/Security_Self_Assessment.pdf) §7 for the production upgrade path (Argon2id/bcrypt, server sessions, MFA)
- **Failed logins:** locked after 5 attempts in 15 minutes
- **Output encoding:** all user-controlled text escaped via `esc()` before HTML insertion
- **AI requests:** proxied through a Vercel serverless function; API key never reaches the browser; requests validated by type and length
- **No real payments.** This is an educational prototype — do not enter real credentials or payment information.

---

## Documentation

| Document | Location |
|---|---|
| Technical Documentation | [`docs/Technical_Documentation.pdf`](docs/Technical_Documentation.pdf) |
| Algorithm Description | [`docs/Algorithm_Description.pdf`](docs/Algorithm_Description.pdf) |
| Security Self-Assessment | [`docs/Security_Self_Assessment.pdf`](docs/Security_Self_Assessment.pdf) |
| Execution Evidence | [`docs/StudentPay_AI_Execution_Evidence_Large_Blank_Screenshot_Area.docx`](docs/StudentPay_AI_Execution_Evidence_Large_Blank_Screenshot_Area.docx) |

---

## Team

- **[Your Name]** — [Institution] — [Nationality]
- **[Teammate Name]** — [Institution] — [Nationality]
- **[Teammate Name]** — [Institution] — [Nationality]

*(Competition requires ≥60% non-Chinese nationals — update this section accordingly.)*

---

## License

Educational prototype. Submitted for the 2026 FinTechathon International Track.