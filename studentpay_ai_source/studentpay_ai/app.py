import streamlit as st
from database import init_db, create_user, verify_user, save_plan, get_user_plans
from finance import compare_options, calculate_affordability, validate_amount

st.set_page_config(page_title="StudentPay AI", page_icon="💳", layout="centered")
init_db()

st.title("StudentPay AI")
st.caption("Cross-border and student finance assistant — prototype")

st.warning(
    "Prototype only: this app does not connect to banks, transfer real money, "
    "or fetch live exchange rates. Entered rates and fees are illustrative."
)

if "user_id" not in st.session_state:
    st.session_state.user_id = None
    st.session_state.username = None

if not st.session_state.user_id:
    tab_login, tab_signup = st.tabs(["Log in", "Create account"])
    with tab_login:
        with st.form("login_form"):
            username = st.text_input("Username")
            password = st.text_input("Password", type="password")
            login = st.form_submit_button("Log in")
        if login:
            user = verify_user(username.strip(), password)
            if user:
                st.session_state.user_id, st.session_state.username = user
                st.rerun()
            else:
                st.error("Login failed. Check your details or try again later.")
    with tab_signup:
        with st.form("signup_form"):
            new_username = st.text_input("Choose username")
            new_password = st.text_input("Create password (12+ characters)", type="password")
            signup = st.form_submit_button("Create account")
        if signup:
            ok, message = create_user(new_username.strip(), new_password)
            (st.success if ok else st.error)(message)
    st.stop()

st.write(f"Signed in as **{st.session_state.username}**")
if st.button("Log out"):
    st.session_state.user_id = None
    st.session_state.username = None
    st.rerun()

st.header("Compare transfer options")
st.write("Enter sample provider rates and fees to compare the estimated amount received.")
with st.form("compare_form"):
    amount = st.number_input("Amount to send (source currency)", min_value=1.0, value=500.0, step=25.0)
    currency_from = st.selectbox("Send currency", ["USD", "EUR", "GBP", "AUD", "NPR"])
    currency_to = st.selectbox("Receive currency", ["NPR", "USD", "EUR", "GBP", "AUD"])
    st.caption("Use sample figures for a demo; these are not live provider quotes.")
    a_name = st.text_input("Option A name", value="Provider A")
    a_rate = st.number_input("Option A exchange rate", min_value=0.0001, value=133.0, format="%.4f")
    a_fee = st.number_input("Option A fee", min_value=0.0, value=5.0)
    b_name = st.text_input("Option B name", value="Provider B")
    b_rate = st.number_input("Option B exchange rate", min_value=0.0001, value=132.5, format="%.4f")
    b_fee = st.number_input("Option B fee", min_value=0.0, value=2.0)
    compare = st.form_submit_button("Compare options")

if compare:
    try:
        results = compare_options(amount, [
            {"name": a_name, "rate": a_rate, "fee": a_fee},
            {"name": b_name, "rate": b_rate, "fee": b_fee},
        ])
        st.subheader("Estimated comparison")
        for result in results:
            st.metric(result["name"], f"{result['received']:.2f} {currency_to}",
                      f"Fee: {result['fee']:.2f} {currency_from}")
        best = max(results, key=lambda x: x["received"])
        st.success(f"Based on the figures entered, {best['name']} gives the highest estimated amount received.")
        if st.button("Save this comparison"):
            save_plan(st.session_state.user_id, currency_from, currency_to, amount, results)
            st.success("Comparison saved to your account.")
    except ValueError as exc:
        st.error(str(exc))

st.header("Student budget check")
with st.form("budget_form"):
    budget = st.number_input("Available budget", min_value=0.0, value=1000.0, step=50.0)
    tuition = st.number_input("Tuition due", min_value=0.0, value=600.0, step=50.0)
    living = st.number_input("Estimated living costs", min_value=0.0, value=250.0, step=25.0)
    budget_submit = st.form_submit_button("Check budget")
if budget_submit:
    try:
        result = calculate_affordability(budget, tuition, living)
        if result["affordable"]:
            st.success(f"Estimated remaining budget: {result['remaining']:.2f}")
        else:
            st.error(f"Estimated shortfall: {abs(result['remaining']):.2f}")
    except ValueError as exc:
        st.error(str(exc))

st.header("Saved comparisons")
plans = get_user_plans(st.session_state.user_id)
if not plans:
    st.info("No saved comparisons yet.")
else:
    for plan in plans:
        st.write(f"**{plan['currency_from']} → {plan['currency_to']}** | "
                 f"Amount: {plan['amount']:.2f} | Saved: {plan['created_at']}")
        st.code(plan["result_summary"])
