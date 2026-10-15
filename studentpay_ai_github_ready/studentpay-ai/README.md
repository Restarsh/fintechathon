# StudentPay AI

**Cross-border & Student Finance Assistant** — a FinTechathon Topic C prototype.

StudentPay AI demonstrates how students could compare sample cross-border transfer options and plan tuition and living expenses.

## Features

- Account registration and login
- bcrypt password hashing
- Basic failed-login throttling
- Sample transfer-option comparison
- Student budget and affordability calculator
- User-specific saved comparisons
- Parameterized SQL queries
- Basic security event logging
- Basic finance calculation tests

## Technology

- Python
- Streamlit
- SQLite
- bcrypt
- pytest

## Setup

Requires Python 3.10 or newer.

### Windows

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

Open the local URL shown in the terminal.

## Run tests

```bash
pytest -q
```

## Project structure

```text
studentpay-ai/
├── app.py
├── database.py
├── finance.py
├── requirements.txt
├── README.md
├── SECURITY.md
├── .gitignore
├── docs/
│   ├── architecture.md
│   └── security-self-assessment.md
└── tests/
    └── test_finance.py
```

## Security

See [SECURITY.md](SECURITY.md) and [the security self-assessment](docs/security-self-assessment.md).

## Important limitations

This is an educational prototype, not production-ready financial software. It does not connect to banks, execute payments, verify remittance providers, or fetch live exchange rates. Exchange rates and fees are entered manually for demonstration. It does not currently integrate an AI model. Do not enter real bank credentials or sensitive personal information.

Before any real-world deployment, add professionally reviewed authentication and session controls, MFA, HTTPS, secure secrets management, encryption and backups, stronger rate limiting, privacy controls, monitoring, security testing, and legal/compliance review.
