import csv
from pathlib import Path

path = Path("data/raw/university_tuition.csv")

new_rows = [
    {
        "university": "The University of Queensland",
        "city": "Brisbane",
        "course": "Bachelor of Computer Science (Honours)",
        "study_level": "undergraduate",
        "student_type": "international",
        "academic_year": "2026",
        "annual_fee_aud": "58056",
        "fee_basis": "indicative annual tuition; 16 units",
        "source_url": "https://study.uq.edu.au/study-options/programs/bachelor-computer-science-honours-2452?year=2026",
        "retrieved_on": "2026-10-15",
    },
    {
        "university": "Australian National University",
        "city": "Canberra",
        "course": "Bachelor of Engineering (Honours) in Software Engineering",
        "study_level": "undergraduate",
        "student_type": "international",
        "academic_year": "2026",
        "annual_fee_aud": "56120",
        "fee_basis": "annual indicative fee; standard full-time load",
        "source_url": "https://programsandcourses.anu.edu.au/2026/program/AENSE",
        "retrieved_on": "2026-10-15",
    },
    {
        "university": "The University of Sydney",
        "city": "Sydney",
        "course": "Engineering and computer science (fee-guide category)",
        "study_level": "undergraduate",
        "student_type": "international",
        "academic_year": "2026",
        "annual_fee_aud": "60600",
        "fee_basis": "2026 full-time entry fee guide; category figure",
        "source_url": "https://www.sydney.edu.au/study/fees-and-loans/international-student-tuition-fees.html",
        "retrieved_on": "2026-10-15",
    },
]

with path.open(newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fields = reader.fieldnames
    rows = list(reader)

if not fields:
    raise SystemExit(f"Missing CSV header: {path}")

existing = {
    (r["university"], r["course"], r["academic_year"])
    for r in rows
}

added = 0
for row in new_rows:
    key = (row["university"], row["course"], row["academic_year"])
    if key not in existing:
        rows.append(row)
        existing.add(key)
        added += 1

with path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)

print(f"Added {added} records; total tuition records: {len(rows)}")
print(f"Updated {path}")
