#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
START_DATE="$(date -d '29 days ago' +%F)"
END_DATE="$(date +%F)"

export ROOT START_DATE END_DATE

python3 <<'PY'
import csv
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

root = Path(os.environ["ROOT"])
start = os.environ["START_DATE"]
end = os.environ["END_DATE"]

raw_dir = root / "data" / "raw"
processed_dir = root / "data" / "processed"
raw_dir.mkdir(parents=True, exist_ok=True)
processed_dir.mkdir(parents=True, exist_ok=True)

api = "https://www.nrb.org.np/api/forex/v1/rates"

country_map = {
    "AUD": "Australia",
    "CAD": "Canada",
    "NZD": "New Zealand",
    "USD": "United States",
    "GBP": "United Kingdom",
    "EUR": "Euro area",
    "INR": "India",
    "JPY": "Japan",
    "CNY": "China",
    "SGD": "Singapore",
    "KRW": "South Korea",
    "MYR": "Malaysia",
    "AED": "United Arab Emirates",
    "CHF": "Switzerland",
    "THB": "Thailand",
    "HKD": "Hong Kong",
    "SAR": "Saudi Arabia",
}

def fetch_page(page):
    params = urlencode({
        "from": start,
        "to": end,
        "per_page": 100,
        "page": page,
    })
    request = Request(
        f"{api}?{params}",
        headers={"User-Agent": "StudyBridgeAI-StudentResearch/1.0"}
    )
    with urlopen(request, timeout=30) as response:
        return json.load(response)

payloads = []
page = 1
total_pages = 1

while page <= total_pages:
    print(f"Fetching NRB page {page}...")
    response = fetch_page(page)

    if response.get("status", {}).get("code") not in (None, 200):
        raise RuntimeError(f"NRB API error: {response.get('status')}")

    data = response.get("data") or {}
    payload = data.get("payload") or []

    # Accommodate API responses where payload is wrapped in an object.
    if isinstance(payload, dict):
        payload = payload.get("data") or payload.get("payload") or []

    if not isinstance(payload, list):
        raise RuntimeError("Unexpected NRB API payload format.")

    payloads.extend(payload)

    pagination = response.get("pagination") or {}
    total_pages = int(pagination.get("pages") or 1)
    page += 1

raw_path = raw_dir / "nrb_forex_multi.json"
raw_path.write_text(
    json.dumps({
        "source": api,
        "from": start,
        "to": end,
        "retrieved_at_utc": datetime.now(timezone.utc).isoformat(),
        "data": {"payload": payloads},
    }, indent=2),
    encoding="utf-8",
)

exchange_path = processed_dir / "exchange_rates_multi.csv"
columns = [
    "date", "country_or_region", "currency", "unit",
    "buy_npr", "sell_npr", "source_url", "retrieved_at_utc"
]
retrieved = datetime.now(timezone.utc).isoformat()
rows = []

for day in payloads:
    date = day.get("date", "")
    for rate in day.get("rates") or []:
        currency = rate.get("currency") or {}
        code = (
            currency.get("ISO3")
            or currency.get("iso3")
            or currency.get("code")
            or ""
        )
        code = str(code).upper()
        unit = rate.get("unit")
        buy = rate.get("buy")
        sell = rate.get("sell")

        if not code:
            continue

        rows.append({
            "date": date,
            "country_or_region": country_map.get(code, "Other / verify"),
            "currency": code,
            "unit": unit,
            "buy_npr": buy,
            "sell_npr": sell,
            "source_url": api,
            "retrieved_at_utc": retrieved,
        })

with exchange_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=columns)
    writer.writeheader()
    writer.writerows(rows)

# Official student living-cost / financial-capacity benchmarks.
# These are not university tuition fees or predictions of actual spending.
today = datetime.now(timezone.utc).date().isoformat()
benchmarks = [
    {
        "country": "Australia",
        "currency": "AUD",
        "expense_type": "Student living-cost financial-capacity benchmark",
        "amount": "29710",
        "period": "12 months",
        "scope": "One student",
        "includes_tuition": "no",
        "includes_transport": "no",
        "source_url": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500",
        "retrieved_on": today,
        "note": "Government financial-capacity benchmark; actual living costs vary.",
    },
    {
        "country": "Canada",
        "currency": "CAD",
        "expense_type": "Study permit living-expense requirement",
        "amount": "23448",
        "period": "12 months",
        "scope": "One student; most provinces and territories except Quebec",
        "includes_tuition": "no",
        "includes_transport": "no",
        "source_url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html",
        "retrieved_on": today,
        "note": "Applies to applications from 2026-09-01; recheck official rules before use.",
    },
    {
        "country": "New Zealand",
        "currency": "NZD",
        "expense_type": "Student living-cost financial-capacity benchmark",
        "amount": "20000",
        "period": "12 months",
        "scope": "Tertiary / other eligible study",
        "includes_tuition": "no",
        "includes_transport": "verify",
        "source_url": "https://www.studywithnewzealand.govt.nz/en/plan-with-new-zealand/cost-of-living",
        "retrieved_on": today,
        "note": "Official study information; verify the current visa rules for the specific course.",
    },
]

benchmark_path = raw_dir / "student_cost_benchmarks.csv"
with benchmark_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(benchmarks[0].keys()))
    writer.writeheader()
    writer.writerows(benchmarks)

print(f"\nSaved raw NRB data: {raw_path}")
print(f"Saved exchange rates: {exchange_path} ({len(rows)} rows)")
print(f"Saved student benchmarks: {benchmark_path} ({len(benchmarks)} rows)")
print("\nCheck the CSV files and source notes before using figures in your application.")
PY
