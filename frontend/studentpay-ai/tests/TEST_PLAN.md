# Test Plan — StudentPay AI

Manual test cases covering all modules. Run against the deployed URL (or `vercel dev` locally).

**How to fill this in:** for each row, replace `—` in the **Actual Result** column with a one-line description of what you observed, then mark **Status** as `PASS`, `FAIL`, or `BLOCKED`.

Run the full suite on the **deployed URL** and paste results into `docs/Execution_Evidence.docx`.

## Authentication

| # | Action | Expected Result | Actual Result | Status |
|---|--------|-----------------|---------------|--------|
| 1 | Create a new account with valid username, email, password | Account created, success banner shown | | |
| 2 | Attempt to register with an existing username or email | Duplicate registration rejected with error | | |
| 3 | Log in with valid credentials | User logged in, app opens | | |
| 4 | Enter an incorrect password for an existing account | Login error displayed, attempt recorded | | |
| 5 | Perform five failed login attempts in 15 minutes | Temporary account lockout triggered | | |

## Transfers

| # | Action | Expected Result | Actual Result | Status |
|---|--------|-----------------|---------------|--------|
| 6 | Enter amount, provider rates, fees | Comparison displayed, best option identified | | |
| 7 | Enter mid-market rate, provider rate, fee | Hidden cost and % calculated and displayed | | |

## Budget & survival

| # | Action | Expected Result | Actual Result | Status |
|---|--------|-----------------|---------------|--------|
| 8 | Enter monthly income and monthly expenses | Total expenses, remaining, budget status displayed | | |
| 9 | Enter balance, days until income, daily essentials, bills, expected income | Estimated remaining and status displayed | | |

## Transactions

| # | Action | Expected Result | Actual Result | Status |
|---|--------|-----------------|---------------|--------|
| 10 | Add an income or expense transaction | Transaction appears, totals update | | |
| 11 | Click "Export CSV" | CSV file downloads with all entries | | |

## Goals

| # | Action | Expected Result | Actual Result | Status |
|---|--------|-----------------|---------------|--------|
| 12 | Create a savings goal with target, saved, timeframe | Progress bar and monthly saving requirement displayed | | |
| 13 | Add a contribution to an existing goal | Progress bar updates, saved amount increases | | |

## Safety & audit

| # | Action | Expected Result | Actual Result | Status |
|---|--------|-----------------|---------------|--------|
| 14 | Select multiple scam-warning indicators | Risk level and guidance displayed | | |
| 15 | Perform several application actions | Relevant events appear in activity log | | |
| 16 | Save data, reload prototype, revisit module | Previously saved data still available | | |

## AI proxy

| # | Action | Expected Result | Actual Result | Status |
|---|--------|-----------------|---------------|--------|
| 17 | Ask the AI a question on the live URL | Real LLM answer displayed (not offline fallback) | | |
| 18 | Ask a question about hidden transfer costs | Structured, relevant answer referencing real hidden-cost concepts | | |
| 19 | Ask a question after entering budget data | AI references the entered budget figures in its answer | | |
| 20 | Temporarily block network, then ask | Offline advisor answer with note (fallback works) | | |
| 21 | Send a blank or oversized question | Request rejected gracefully, no crash | | |

---

**Full suite last run:** [DATE] — [YES/NO all passed]