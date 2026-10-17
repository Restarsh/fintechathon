import csv
from pathlib import Path

tuition_path = Path("data/raw/university_tuition.csv")
rates_path = Path("data/processed/exchange_rates.csv")
output_path = Path("data/processed/student_budgets.csv")

with tuition_path.open(newline="", encoding="utf-8") as f:
    tuition_rows = list(csv.DictReader(f))

with rates_path.open(newline="", encoding="utf-8") as f:
    rates = list(csv.DictReader(f))

if not tuition_rows:
    raise SystemExit("No tuition rows found.")
if not rates:
    raise SystemExit("No exchange rates found.")

# Select the latest date available in the downloaded NRB dataset.
latest_date = max(r["date"] for r in rates)
rate_rows = [r for r in rates if r["date"] == latest_date and r["currency"] == "AUD"]

if not rate_rows:
    raise SystemExit(f"No AUD rate found for {latest_date}.")

rate = rate_rows[0]
unit = float(rate["unit"])
sell_rate = float(rate["sell_npr"])
if unit <= 0:
    raise SystemExit("Invalid exchange-rate unit.")

living_aud = 29710.0
living_source = (
    "https://immi.homeaffairs.gov.au/visas/getting-a-visa/"
    "visa-listing/student-500"
)

fields = [
    "university", "city", "course", "academic_year",
    "annual_tuition_aud", "living_cost_benchmark_aud",
    "combined_budget_aud", "aud_sell_rate_npr",
    "rate_unit", "rate_date", "annual_tuition_npr",
    "living_cost_benchmark_npr", "combined_budget_npr",
    "tuition_fee_basis", "living_cost_basis",
    "tuition_source_url", "living_cost_source_url",
    "exchange_rate_source_url",
]

with output_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()

    for row in tuition_rows:
        tuition = float(row["annual_fee_aud"])
        total = tuition + living_aud
        writer.writerow({
            "university": row["university"],
            "city": row["city"],
            "course": row["course"],
            "academic_year": row["academic_year"],
            "annual_tuition_aud": f"{tuition:.2f}",
            "living_cost_benchmark_aud": f"{living_aud:.2f}",
            "combined_budget_aud": f"{total:.2f}",
            "aud_sell_rate_npr": f"{sell_rate:.4f}",
            "rate_unit": f"{unit:g}",
            "rate_date": latest_date,
            "annual_tuition_npr": f"{tuition * sell_rate / unit:.2f}",
            "living_cost_benchmark_npr": f"{living_aud * sell_rate / unit:.2f}",
            "combined_budget_npr": f"{total * sell_rate / unit:.2f}",
            "tuition_fee_basis": row["fee_basis"],
            "living_cost_basis": "12-month student visa financial-capacity benchmark; not actual spending",
            "tuition_source_url": row["source_url"],
            "living_cost_source_url": living_source,
            "exchange_rate_source_url": rate["source_url"],
        })

print(f"Created {output_path} with {len(tuition_rows)} budget scenarios.")
print(f"Using NRB AUD sell rate for {latest_date}: {sell_rate} NPR per AUD unit {unit:g}")
