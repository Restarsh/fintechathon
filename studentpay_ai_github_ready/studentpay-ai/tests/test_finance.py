import pytest

from finance import compare_options, calculate_affordability


def test_compare_options_sorts_highest_received_first():
    results = compare_options(100, [
        {"name": "Provider A", "rate": 130, "fee": 2},
        {"name": "Provider B", "rate": 131, "fee": 1},
    ])
    assert results[0]["name"] == "Provider B"
    assert results[0]["received"] == pytest.approx(12969)


def test_negative_fee_is_rejected():
    with pytest.raises(ValueError):
        compare_options(100, [{"name": "A", "rate": 130, "fee": -1}])


def test_budget_shortfall():
    result = calculate_affordability(1000, 700, 400)
    assert result["affordable"] is False
    assert result["remaining"] == -100


def test_non_finite_amount_is_rejected():
    with pytest.raises(ValueError):
        compare_options(float("nan"), [{"name": "A", "rate": 130, "fee": 1}])
