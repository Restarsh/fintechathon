import math


def _validate_nonnegative(value, field_name):
    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a number.")

    if not math.isfinite(number) or number < 0:
        raise ValueError(f"{field_name} must be a finite, non-negative number.")
    return number


def compare_options(amount, options):
    amount = _validate_nonnegative(amount, "Amount")
    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    if not isinstance(options, list) or not options:
        raise ValueError("Provide at least one comparison option.")

    results = []
    for option in options:
        name = str(option.get("name", "")).strip()[:60] or "Unnamed option"
        rate = _validate_nonnegative(option.get("rate"), "Exchange rate")
        fee = _validate_nonnegative(option.get("fee"), "Transfer fee")

        if rate <= 0:
            raise ValueError("Exchange rate must be greater than zero.")
        if fee > amount:
            raise ValueError("Transfer fee cannot exceed the amount sent.")

        results.append({
            "name": name,
            "rate": rate,
            "fee": fee,
            "received": (amount - fee) * rate,
        })

    return sorted(results, key=lambda item: item["received"], reverse=True)


def calculate_affordability(budget, tuition, living_costs):
    budget = _validate_nonnegative(budget, "Budget")
    tuition = _validate_nonnegative(tuition, "Tuition")
    living_costs = _validate_nonnegative(living_costs, "Living costs")
    remaining = budget - tuition - living_costs
    return {"affordable": remaining >= 0, "remaining": remaining}
