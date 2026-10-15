import math

def _nonnegative_number(value, field_name):
    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a number.")
    if not math.isfinite(number) or number < 0:
        raise ValueError(f"{field_name} must be a finite, non-negative number.")
    return number

def compare_options(amount, options):
    amount = _nonnegative_number(amount, "Amount")
    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    if not isinstance(options, list) or not options:
        raise ValueError("Provide at least one comparison option.")
    results = []
    for option in options:
        name = str(option.get("name", "")).strip()[:60] or "Unnamed option"
        rate = _nonnegative_number(option.get("rate"), "Exchange rate")
        fee = _nonnegative_number(option.get("fee"), "Fee")
        if rate <= 0:
            raise ValueError("Exchange rate must be greater than zero.")
        if fee > amount:
            raise ValueError("Fee cannot exceed the amount being sent.")
        results.append({"name": name, "rate": rate, "fee": fee,
                        "received": (amount - fee) * rate})
    return sorted(results, key=lambda item: item["received"], reverse=True)

def calculate_affordability(budget, tuition, living_costs):
    budget = _nonnegative_number(budget, "Budget")
    tuition = _nonnegative_number(tuition, "Tuition")
    living_costs = _nonnegative_number(living_costs, "Living costs")
    remaining = budget - tuition - living_costs
    return {"affordable": remaining >= 0, "remaining": remaining}
