# StudentPay AI — prototype

A small Streamlit prototype for **Topic C: Cross-border & Student Finance Assistant**.

## What it does
- Creates accounts and hashes passwords with bcrypt.
- Applies a basic failed-login throttle.
- Compares user-entered sample FX rates and fees.
- Checks whether a student budget covers tuition and living costs.
- Saves simulated comparisons per user.
- Uses parameterized SQL and records basic audit events.

## Important limitations
This is a student-project prototype, **not production financial software**. It does not connect to banks, transfer money, verify remittance providers, or retrieve live exchange rates. Quotes are user-entered examples. Authentication and rate limiting are basic and require a security review before any real deployment. Do not enter real financial credentials or sensitive personal information.

## Requirements
Python 3.10 or newer.

## Run on Windows
1. Extract the ZIP.
2. Open Command Prompt/PowerShell inside the `studentpay_ai` folder.
3. Create and activate a virtual environment:
   ```powershell
   python -m venv .venv
   .venv\Scripts\activate
   ```
4. Install packages:
   ```powershell
   pip install -r requirements.txt
   ```
5. Start the app:
   ```powershell
   streamlit run app.py
   ```
6. Open the local URL printed in the terminal.

## Run tests
```powershell
pytest -q
```

## Suggested demo flow
1. Create a test account with a 12+ character password.
2. Log in.
3. Compare two sample transfer options.
4. Save a comparison and show that it appears under Saved comparisons.
5. Run a student budget check.
6. Explain that all calculations are illustrative and no money moves.

## Security controls in this prototype
- bcrypt password hashing
- basic failed-login throttling
- parameterized SQL
- per-user filtering for saved comparisons
- input validation
- basic security event logging
- no real-payment functionality

## Before real-world deployment
Add reviewed authentication/session controls, MFA, HTTPS, secure secrets management, database encryption and backups, stronger rate limiting, privacy/data-retention controls, dependency scanning, security tests, monitoring, and legal/compliance review. Do not connect payment APIs until authorization, provider verification, user confirmation, and compliance controls have been designed and independently reviewed.
