# Architecture

## Components
- **Streamlit UI (`app.py`)**: account screens, FX comparison, budget check, saved comparisons.
- **Finance logic (`finance.py`)**: deterministic calculations and validation.
- **SQLite data layer (`database.py`)**: users, login attempts, simulated plans, audit events.
- **bcrypt**: password hashing.

## Data flow
1. User signs up or logs in.
2. The server verifies credentials against a bcrypt password hash.
3. User enters sample rates and fees.
4. `finance.py` validates values and calculates estimated received amounts.
5. User may save a simulated comparison; database queries restrict results to that user's ID.

## Trust boundaries
- User-entered values are untrusted.
- The prototype does not call an LLM, bank, payment gateway, or external FX API.
- The app does not execute transfers or store bank credentials.
