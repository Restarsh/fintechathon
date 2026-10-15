# System Architecture

## Components

- `app.py`: Streamlit user interface, account forms, comparison and budget screens.
- `finance.py`: input validation, transfer estimate calculation, budget calculation.
- `database.py`: SQLite storage, bcrypt password hashing, basic login throttling and audit events.
- `tests/`: basic automated tests for financial calculations.

## Data flow

1. A user creates an account or logs in.
2. Passwords are verified against bcrypt hashes.
3. The user enters sample rates, fees, or budget values.
4. `finance.py` validates inputs and performs deterministic calculations.
5. Saved comparisons are stored against the current user ID.
6. Queries return only saved comparisons associated with that user ID.

## Trust boundaries

User-entered data is untrusted. The prototype does not connect to an AI model, bank, payment gateway, or external FX API.
