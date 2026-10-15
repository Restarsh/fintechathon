import streamlit as st

from database import init_db, create_user, verify_user, save_plan, get_user_plans
from finance import compare_options, calculate_affordability

st.set_page_config(page_title="StudentPay AI", page_icon="💳", layout="centered")
init_db()

st.title("StudentPay AI")
st.caption("Cross-border & Student Finance Assistant")

st.warning(
    "Demonstration prototype only. It does not connect to banks, execute payments, "
    "or fetch live exchange rates. Use sample values only."
)

if "user_id" not in st.session_state:
    st.session_state.user_id = None
    st.session_state.username = None

if not st.session_state.user_id:
    login_tab, signup_tab = st.tabs(["Log in", "Create account"])

    with login_tab:
        with st.form("login_form"):
            username = st.text_input("Username")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Log in")
        if submitted:
            user = verify_user(username.strip(), password)
            if user:
                st.session_state.user_id, st.session_state.username = user
                st.rerun()
            st.error("Login failed. Check your details or try again later.")

    with signup_tab:
        with st.form("signup_form"):
            username = st.text_input("Choose a username")
            password = st.text_input("Create password (12+ characters)", type="password")
            submitted = st.form_submit_button("Create account")
        if submitted:
            success, message = create_user(username.strip(), password)
            if success:
                st.success(message)
            else:
                st.error(message)
    st.stop()

st.write(f"Signed in as **{st.session_state.username}**")
if st.button("Log out"):
    st.session_state.user_id = None
    st.session_state.username = None
    st.rerun()

st.header("Compare transfer options")
st.caption("Enter sample rates and fees; these are not live quotes.")

with st.form("comparison_form"):
    amount = st.number_input("Amount to send", min_value=1.0, value=500.0)
    currency_from = st.selectbox("Send currency", ["USD", "EUR", "GBP", "AUD", "NPR"])
    currency_to = st.selectbox("Receive currency", ["NPR", "USD", "EUR", "GBP", "AUD"])

    st.subheader("Option A")
    name_a = st.text_input("Provider name A", value="Provider A")
    rate_a = st.number_input("Exchange rate A", min_value=0.0001, value=133.0, format="%.4f")
    fee_a = st.number_input("Transfer fee A", min_value=0.0, value=5.0)

    st.subheader("Option B")
    name_b = st.text_input("Provider name B", value="Provider B")
    rate_b = st.number_input("Exchange rate B", min_value=0.0001, value=132.5, format="%.4f")
    fee_b = st.number_input("Transfer fee B", min_value=0.0, value=2.0)

    compare_clicked = st.form_submit_button("Compare options")

if compare_clicked:
    try:
        results = compare_options(amount, [
            {"name": name_a, "rate": rate_a, "fee": fee_a},
            {"name": name_b, "rate": rate_b, "fee": fee_b},
        ])
        st.subheader("Estimated results")
        for result in results:
            st.metric(
                result["name"],
                f'{result["received"]:.2f} {currency_to}',
                f'Fee: {result["fee"]:.2f} {currency_from}',
            )
        st.success(f'{results[0]["name"]} gives the highest estimated amount using the entered values.')
        if st.button("Save comparison"):
            save_plan(st.session_state.user_id, currency_from, currency_to, amount, results)
            st.success("Comparison saved.")
    except ValueError as exc:
        st.error(str(exc))

st.header("Student budget check")
with st.form("budget_form"):
    budget = st.number_input("Available budget", min_value=0.0, value=1000.0)
    tuition = st.number_input("Tuition fees", min_value=0.0, value=600.0)
    living_costs = st.number_input("Estimated living costs", min_value=0.0, value=250.0)
    budget_clicked = st.form_submit_button("Check budget")

if budget_clicked:
    try:
        result = calculate_affordability(budget, tuition, living_costs)
        if result["affordable"]:
            st.success(f'Remaining budget: {result["remaining"]:.2f}')
        else:
            st.error(f'Budget shortfall: {abs(result["remaining"]):.2f}')
    except ValueError as exc:
        st.error(str(exc))

st.header("Saved comparisons")
plans = get_user_plans(st.session_state.user_id)
if not plans:
    st.info("No saved comparisons yet.")
else:
    for plan in plans:
        st.write(f'**{plan["currency_from"]} → {plan["currency_to"]}**')
        st.write(f'Amount: {plan["amount"]:.2f} | Saved: {plan["created_at"]}')
        st.write(plan["result_summary"])
        st.divider()
