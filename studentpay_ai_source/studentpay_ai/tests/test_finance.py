import pytest
from finance import compare_options, calculate_affordability

def test_compare_options_sorted_by_received():
    result = compare_options(100, [
        {"name": "A", "rate": 130, "fee": 2},
        {"name": "B", "rate": 131, "fee": 1},
    ])
    assert result[0]["name"] == "B"
    assert result[0]["received"] == 12969

def test_reject_negative_fee():
    with pytest.raises(ValueError):
        compare_options(100, [{"name": "A", "rate": 130, "fee": -1}])

def test_budget_shortfall():
    result = calculate_affordability(1000, 700, 400)
    assert result["affordable"] is False
    assert result["remaining"] == -100
