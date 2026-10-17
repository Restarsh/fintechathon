const $ = (id) => document.getElementById(id);
let DB = { users: {}, saved: {}, audit: [], attempts: {} },
  me = null,
  last = null,
  nOpts = 0;
try {
  const s = localStorage.getItem("sp_v1");
  if (s) DB = JSON.parse(s);
} catch (e) {}
const persist = () => {
  try {
    localStorage.setItem("sp_v1", JSON.stringify(DB));
  } catch (e) {}
};
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const show = (id, t, c) =>
  ($(id).innerHTML = t ? `<div class="msg ${c}">${esc(t)}</div>` : "");
const audit = (ev, user, detail = "") => {
  DB.audit.push({ t: new Date().toLocaleString(), u: user, ev, detail });
  DB.audit = DB.audit.slice(-300);
  persist();
};
const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

async function hash(pw, salt) {
  const b = new TextEncoder().encode(salt + pw);
  const d = await crypto.subtle.digest("SHA-256", b);
  return [...new Uint8Array(d)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
const salt = () =>
  [...crypto.getRandomValues(new Uint8Array(12))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

async function register() {
  const u = $("ru").value.trim(),
    e = $("re").value.trim(),
    p = $("rp").value;
  if (!/^[A-Za-z0-9_]{3,30}$/.test(u))
    return show(
      "rm",
      "Username must be 3–30 letters, numbers or underscores.",
      "err",
    );
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    return show("rm", "Please enter a valid email address.", "err");
  if (p.length < 8 || !/[A-Za-z]/.test(p) || !/\d/.test(p))
    return show(
      "rm",
      "Password needs 8+ characters with a letter and a number.",
      "err",
    );
  const k = u.toLowerCase();
  if (
    DB.users[k] ||
    Object.values(DB.users).some(
      (x) => x.email.toLowerCase() === e.toLowerCase(),
    )
  ) {
    audit("register_failed", k, "duplicate");
    return show("rm", "That username or email is already registered.", "err");
  }
  const s = salt();
  DB.users[k] = { name: u, email: e, salt: s, hash: await hash(p, s) };
  audit("register", k);
  persist();
  show("rm", "Account created! You can now log in.", "ok");
}
async function login() {
  const u = $("lu").value.trim(),
    p = $("lp").value,
    k = u.toLowerCase();
  if (!u || !p) return show("lm", "Enter your username and password.", "err");
  const now = Date.now(),
    a = (DB.attempts[k] || []).filter((t) => now - t < 15 * 60000);
  DB.attempts[k] = a;
  if (a.length >= 5) {
    audit("login_blocked", k);
    const m = Math.ceil((15 * 60000 - (now - a[0])) / 60000);
    return show(
      "lm",
      `Too many failed attempts. Try again in about ${m} minute(s).`,
      "err",
    );
  }
  const x = DB.users[k];
  const ok = x && (await hash(p, x.salt)) === x.hash;
  if (!ok) {
    a.push(now);
    audit("login_failed", k);
    persist();
    return show("lm", "Incorrect username or password.", "err");
  }
  DB.attempts[k] = [];
  audit("login_success", k);
  me = k;
  enter();
}
function logout() {
  audit("logout", me);
  me = null;
  last = null;
  $("app").classList.add("hide");
  $("auth").classList.remove("hide");
  $("who").innerHTML = "";
  $("lp").value = "";
  show("lm", "");
}
function enter() {
  $("auth").classList.add("hide");
  $("app").classList.remove("hide");
  $("who").innerHTML =
    `👤 <b>${esc(DB.users[me].name)}</b> <button class="sec" onclick="logout()">Log out</button>`;
  $("tabs").innerHTML = [
    ["dash", "📊 Dashboard"],
    ["survive", "🧭 Survival plan"],
    ["track", "🧾 Transactions"],
    ["bills", "📅 Bills"],
    ["cmp", "💸 Transfers"],
    ["aff", "🧮 Budget"],
    ["goal", "🎯 Goals"],
    ["ai", "🤖 AI Assistant"],
    ["safe", "🛡️ Scam shield"],
    ["sav", "📁 Saved"],
    ["log", "🧾 Activity"],
  ]
    .map(([i, l]) => `<button id="b-${i}" onclick="tab('${i}')">${l}</button>`)
    .join("");
  if (!nOpts) {
    addOpt("Bank wire", 133, 25, "sending");
    addOpt("Transfer app", 134.5, 8, "sending");
    addOpt("Remittance shop", 132, 5, "recipient");
  }
  renderSafe();
  renderChips();
  if ($("tx-date")) $("tx-date").value = todayISO();
  if ($("bill-date")) $("bill-date").value = todayISO();
  tab("dash");
}
function tab(i) {
  [
    "dash",
    "survive",
    "track",
    "bills",
    "cmp",
    "aff",
    "goal",
    "ai",
    "safe",
    "sav",
    "log",
  ].forEach((t) => {
    $("t-" + t).classList.toggle("hide", t !== i);
    $("b-" + t).classList.toggle("on", t === i);
  });
  if (i === "sav") renderSaved();
  if (i === "log") renderLog();
  if (i === "dash") renderDash();
  if (i === "goal") renderGoals();
  if (i === "ai") renderChat();
  if (i === "track") renderTransactions();
  if (i === "bills") renderBills();
  if (i === "survive") renderSurvivalSummary();
}

function addOpt(n = "", r = "", f = "", c = "sending") {
  if (nOpts >= 5) return;
  nOpts++;
  const d = document.createElement("div");
  d.className = "card";
  d.style.margin = 0;
  d.innerHTML = `<label>Provider</label><input class="on" value="${esc(n || "Option " + nOpts)}"><label>Rate (1 sending = ? recipient)</label><input class="or" type="number" step="any" min="0" value="${r}">
 <label>Fee</label><input class="of" type="number" step="any" min="0" value="${f}"><label>Fee charged in</label><select class="oc"><option value="sending" ${c == "sending" ? "selected" : ""}>Sending currency</option><option value="recipient" ${c == "recipient" ? "selected" : ""}>Recipient currency</option></select>`;
  $("opts").appendChild(d);
}
function calc(amount, rate, fee, fc) {
  if ([amount, rate, fee].some((v) => !isFinite(v)))
    throw "Amount, rate and fee must be numbers.";
  if (amount <= 0) throw "Transfer amount must be greater than zero.";
  if (rate <= 0) throw "Exchange rate must be greater than zero.";
  if (fee < 0) throw "Fee cannot be negative.";
  if (fc === "sending") {
    if (fee >= amount) throw "Fee must be smaller than the amount.";
    return {
      received: r2((amount - fee) * rate),
      method: "(amount − fee) × rate",
    };
  }
  if (fee >= amount * rate)
    throw "Fee must be smaller than the converted amount.";
  return { received: r2(amount * rate - fee), method: "amount × rate − fee" };
}
function compare() {
  const amount = parseFloat($("amt").value),
    rc = $("rc").value.toUpperCase() || "—",
    sc = $("sc").value.toUpperCase() || "—";
  const rows = [...$("opts").children].map((d, i) => ({
    name: d.querySelector(".on").value.trim() || "Option " + (i + 1),
    rate: parseFloat(d.querySelector(".or").value),
    fee: parseFloat(d.querySelector(".of").value),
    fc: d.querySelector(".oc").value,
  }));
  try {
    const out = rows.map((o) => {
      try {
        const c = calc(amount, o.rate, o.fee, o.fc);
        return { ...o, ...c, eff: (c.received / amount).toFixed(4) };
      } catch (e) {
        throw o.name + ": " + e;
      }
    });
    out.sort((a, b) => b.received - a.received);
    out.forEach((o) => (o.diff = r2(o.received - out[0].received)));
    const mid = parseFloat($("mid").value);
    if (mid > 0)
      out.forEach((o) => {
        const ideal = amount * mid;
        o.cost = r2(ideal - o.received);
        o.pct = ((o.cost / ideal) * 100).toFixed(2);
      });
    last = { amount, sc, rc, out };
    show("cm", "");
    renderRes();
  } catch (e) {
    last = null;
    $("res").innerHTML = "";
    show("cm", e, "err");
  }
}
function renderRes() {
  const { amount, sc, rc, out } = last;
  $("res").innerHTML =
    `<div class="card"><h2>Results</h2><div class="msg ok">Best: <b>${esc(out[0].name)}</b> — recipient gets about <b>${out[0].received.toLocaleString()} ${esc(rc)}</b></div>
 <div class="scroll"><table><thead><tr><th>Provider</th><th>Fee</th><th>Rate</th><th>Est. received (${esc(rc)})</th><th>Effective rate</th><th>Hidden cost</th><th>vs best</th><th>Method</th></tr></thead><tbody>
 ${out.map((o, i) => `<tr class="${i ? "" : "best"}"><td>${esc(o.name)}</td><td>${o.fee} ${o.fc == "sending" ? esc(sc) : esc(rc)}</td><td>${o.rate}</td><td>${o.received.toLocaleString()}</td><td>${o.eff}</td><td>${o.pct !== undefined ? o.cost + " (" + o.pct + "%)" : "—"}</td><td>${o.diff}</td><td>${o.method}</td></tr>`).join("")}</tbody></table></div>
 <p class="note">Estimates from manually entered values. Not financial advice.</p>
 <label>Title</label><input id="ttl" value="${esc(amount + " " + sc + " → " + rc)}"><p><button onclick="save()">💾 Save comparison</button></p><div id="sm"></div></div>`;
}
function save() {
  const t = $("ttl").value.trim();
  if (!t) return show("sm", "Please enter a title.", "err");
  (DB.saved[me] = DB.saved[me] || []).unshift({
    id: Date.now(),
    title: t.slice(0, 100),
    at: new Date().toLocaleString(),
    data: last,
  });
  audit("comparison_saved", me, t);
  persist();
  show("sm", "Saved! See the Saved tab.", "ok");
}
function renderSaved() {
  const l = DB.saved[me] || [];
  $("sv").innerHTML = l.length
    ? l
        .map(
          (s) =>
            `<details class="card"><summary><b>${esc(s.title)}</b> <span class="note">· ${esc(s.at)}</span></summary><div class="scroll"><table><thead><tr><th>Provider</th><th>Fee</th><th>Rate</th><th>Received (${esc(s.data.rc)})</th></tr></thead><tbody>${s.data.out.map((o) => `<tr><td>${esc(o.name)}</td><td>${o.fee}</td><td>${o.rate}</td><td>${o.received.toLocaleString()}</td></tr>`).join("")}</tbody></table></div><p><button class="del" onclick="delSaved(${s.id})">Delete</button></p></details>`,
        )
        .join("")
    : '<p class="note">Nothing saved yet. Run a comparison and press Save.</p>';
}
function delSaved(id) {
  const l = DB.saved[me] || [];
  const s = l.find((x) => x.id === id);
  DB.saved[me] = l.filter((x) => x.id !== id);
  if (s) audit("comparison_deleted", me, s.title);
  persist();
  renderSaved();
}
function renderLog() {
  const l = DB.audit
    .filter((a) => a.u === me)
    .reverse()
    .slice(0, 50);
  $("lg").innerHTML =
    l
      .map(
        (a) =>
          `<tr><td>${esc(a.t)}</td><td>${esc(a.ev)}</td><td>${esc(a.detail)}</td></tr>`,
      )
      .join("") || '<tr><td colspan="3">No activity.</td></tr>';
}
function afford() {
  try {
    const inc = parseFloat($("inc").value);
    if (!isFinite(inc) || inc < 0) throw "Income must be a number, 0 or more.";
    const ex = {};
    let tot = 0;
    document.querySelectorAll(".ex").forEach((i) => {
      const v = parseFloat(i.value || 0);
      if (!isFinite(v) || v < 0)
        throw `Expense '${i.dataset.k}' must be 0 or more.`;
      ex[i.dataset.k] = v;
      tot += v;
    });
    const rem = r2(inc - tot),
      pct = inc > 0 ? ((tot / inc) * 100).toFixed(1) : null;
    const [c, m] =
      rem < 0
        ? [
            "err",
            "Expenses exceed your available funds. Consider reducing costs or finding more funds.",
          ]
        : inc > 0 && rem < inc * 0.1
          ? [
              "warn",
              "Within budget, but under 10% remains. A small surprise could cause trouble.",
            ]
          : ["ok", "Your budget looks sustainable with a healthy cushion."];
    (DB.budget = DB.budget || {})[me] = { inc, tot: r2(tot), rem, ex };
    persist();
    const mx = Math.max(...Object.values(ex), 1);
    $("am").innerHTML =
      `<div class="met"><div>Total expenses<b>${r2(tot).toLocaleString()}</b></div><div>Remaining<b>${rem.toLocaleString()}</b></div><div>Funds spent<b>${pct === null ? "n/a" : pct + "%"}</b></div></div><div class="msg ${c}">${m}</div>` +
      Object.entries(ex)
        .map(
          ([k, v]) =>
            `<div>${esc(k)}: ${v}<div class="bar" style="width:${(v / mx) * 100}%"></div></div>`,
        )
        .join("");
  } catch (e) {
    show("am", e, "err");
  }
}

/* ---- Goals ---- */
function addGoal() {
  const n = $("gn").value.trim(),
    t = parseFloat($("gt").value),
    v = parseFloat($("gs").value || 0),
    m = parseInt($("gm").value);
  if (!n || !(t > 0) || !(v >= 0) || !(m > 0))
    return show(
      "gmsg",
      "Enter a name, a target above 0, savings so far, and at least 1 month.",
      "err",
    );
  (DB.goals = DB.goals || {})[me] = [
    { id: Date.now(), name: n.slice(0, 60), target: t, saved: v, months: m },
    ...(DB.goals[me] || []),
  ];
  audit("goal_added", me, n);
  persist();
  show("gmsg", "");
  $("gn").value = "";
  renderGoals();
}
function renderGoals() {
  const l = DB.goals?.[me] || [];
  $("gl").innerHTML =
    l
      .map((g) => {
        const p = Math.min(100, (g.saved / g.target) * 100),
          need = r2(Math.max(0, g.target - g.saved) / g.months);
        return `<div class="card"><b>${esc(g.name)}</b> <span class="note">· ${g.saved.toLocaleString()} of ${g.target.toLocaleString()} (${p.toFixed(0)}%)</span><div class="bar" style="width:${p}%"></div>
 <p>${g.saved >= g.target ? "🎉 Goal reached!" : `Save <b>${need.toLocaleString()}</b> per month for ${g.months} month(s) to get there.`}</p>
 <div class="row"><input id="c${g.id}" type="number" min="0" step="any" placeholder="Add savings"><button onclick="contrib(${g.id})">Add</button><button class="del" onclick="delGoal(${g.id})">Delete</button></div></div>`;
      })
      .join("") || '<p class="note">No goals yet. Add one above.</p>';
}
function contrib(id) {
  const v = parseFloat($("c" + id).value);
  if (!(v > 0)) return;
  const g = DB.goals[me].find((x) => x.id === id);
  g.saved = r2(g.saved + v);
  audit("goal_contribution", me, g.name);
  persist();
  renderGoals();
}
function delGoal(id) {
  DB.goals[me] = DB.goals[me].filter((x) => x.id !== id);
  audit("goal_deleted", me);
  persist();
  renderGoals();
}

/* ---- Student money tools ---- */
const todayISO = () => new Date().toISOString().slice(0, 10);
function addTransaction() {
  const desc = $("tx-desc").value.trim(),
    type = $("tx-type").value,
    category = $("tx-cat").value,
    amount = Number($("tx-amount").value),
    date = $("tx-date").value || todayISO(),
    currency = ($("tx-currency").value.trim() || "USD").toUpperCase();
  if (!desc || !Number.isFinite(amount) || amount <= 0)
    return show(
      "tx-msg",
      "Enter a description and an amount greater than zero.",
      "err",
    );
  const list = (DB.transactions = DB.transactions || {});
  (list[me] = list[me] || []).unshift({
    id: Date.now(),
    desc: desc.slice(0, 80),
    type,
    category,
    amount: r2(amount),
    date,
    currency,
  });
  audit("transaction_added", me, `${type}: ${desc}`);
  persist();
  $("tx-desc").value = "";
  $("tx-amount").value = "";
  show("tx-msg", "Transaction added.", "ok");
  renderTransactions();
  renderDash();
}
function renderTransactions() {
  const l = DB.transactions?.[me] || [],
    income = l
      .filter((x) => x.type === "income")
      .reduce((a, x) => a + x.amount, 0),
    expenses = l
      .filter((x) => x.type === "expense")
      .reduce((a, x) => a + x.amount, 0);
  $("tx-summary").innerHTML =
    `<div class="met"><div>Recorded income<b class="positive">${r2(income).toLocaleString()}</b></div><div>Recorded expenses<b class="negative">${r2(expenses).toLocaleString()}</b></div><div>Net recorded<b>${r2(income - expenses).toLocaleString()}</b></div></div><p class="note">Totals combine entries as entered; use one currency per view for meaningful totals.</p>`;
  $("tx-list").innerHTML =
    l
      .map(
        (x) =>
          `<tr><td>${esc(x.date)}</td><td>${esc(x.desc)}</td><td>${esc(x.type)}</td><td>${esc(x.category)}</td><td class="${x.type === "income" ? "positive" : "negative"}">${x.type === "income" ? "+" : "−"}${x.amount.toLocaleString()} ${esc(x.currency)}</td><td><button class="del smallbtn" onclick="deleteTransaction(${x.id})">Delete</button></td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="6" class="note">No transactions yet. Add your first entry above.</td></tr>';
}
function deleteTransaction(id) {
  const l = DB.transactions?.[me] || [];
  const x = l.find((a) => a.id === id);
  DB.transactions[me] = l.filter((a) => a.id !== id);
  audit("transaction_deleted", me, x?.desc || "");
  persist();
  renderTransactions();
  renderDash();
}
function exportTransactions() {
  const l = DB.transactions?.[me] || [];
  if (!l.length)
    return show("tx-msg", "There are no transactions to export yet.", "warn");
  const rows = [
    ["Date", "Description", "Type", "Category", "Amount", "Currency"],
    ...l.map((x) => [x.date, x.desc, x.type, x.category, x.amount, x.currency]),
  ];
  const csv = rows
    .map((r) =>
      r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "studentpay-transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}
function addBill() {
  const name = $("bill-name").value.trim(),
    amount = Number($("bill-amount").value),
    due = $("bill-date").value,
    category = $("bill-cat").value,
    currency = ($("bill-currency").value.trim() || "USD").toUpperCase();
  if (!name || !Number.isFinite(amount) || amount <= 0 || !due)
    return show(
      "bill-msg",
      "Enter a bill name, a positive amount and a due date.",
      "err",
    );
  DB.bills = DB.bills || {};
  (DB.bills[me] = DB.bills[me] || []).push({
    id: Date.now(),
    name: name.slice(0, 80),
    amount: r2(amount),
    due,
    category,
    currency,
    paid: false,
  });
  audit("bill_added", me, name);
  persist();
  $("bill-name").value = "";
  $("bill-amount").value = "";
  show("bill-msg", "Bill added to your list.", "ok");
  renderBills();
  renderDash();
}
function renderBills() {
  const l = (DB.bills?.[me] || [])
      .slice()
      .sort((a, b) => a.due.localeCompare(b.due)),
    now = todayISO(),
    upcoming = l.filter((x) => !x.paid && x.due >= now),
    overdue = l.filter((x) => !x.paid && x.due < now),
    total = upcoming.reduce((a, x) => a + x.amount, 0);
  $("bill-summary").innerHTML =
    `<div class="met"><div>Upcoming unpaid bills<b>${upcoming.length}</b></div><div>Overdue bills<b class="${overdue.length ? "negative" : "positive"}">${overdue.length}</b></div><div>Upcoming amount<b>${r2(total).toLocaleString()}</b></div></div>`;
  $("bill-list").innerHTML =
    l
      .map((x) => {
        const status = x.paid
          ? "Paid"
          : x.due < now
            ? "Overdue"
            : x.due === now
              ? "Due today"
              : "Upcoming";
        const cls = x.paid
          ? "ok"
          : x.due < now
            ? "err"
            : x.due <=
                new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
              ? "warn"
              : "";
        return `<div class="card"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><b>${esc(x.name)}</b><div class="note">${esc(x.category)} · Due ${esc(x.due)} · ${x.amount.toLocaleString()} ${esc(x.currency)}</div><div class="msg ${cls || ""}">${status}</div></div><div><button class="sec smallbtn" onclick="toggleBill(${x.id})">${x.paid ? "Mark unpaid" : "Mark paid"}</button> <button class="del smallbtn" onclick="deleteBill(${x.id})">Delete</button></div></div></div>`;
      })
      .join("") || '<p class="note">No bills added yet.</p>';
}
function toggleBill(id) {
  const x = (DB.bills?.[me] || []).find((a) => a.id === id);
  if (!x) return;
  x.paid = !x.paid;
  audit(x.paid ? "bill_paid" : "bill_unpaid", me, x.name);
  persist();
  renderBills();
  renderDash();
}
function deleteBill(id) {
  const l = DB.bills?.[me] || [],
    x = l.find((a) => a.id === id);
  DB.bills[me] = l.filter((a) => a.id !== id);
  audit("bill_deleted", me, x?.name || "");
  persist();
  renderBills();
  renderDash();
}
function planSurvival() {
  const balance = Number($("sp-balance").value),
    days = Number($("sp-days").value),
    income = Number($("sp-income").value || 0),
    daily = Number($("sp-daily").value),
    bills = Number($("sp-bills").value || 0),
    cur = ($("sp-currency").value.trim() || "USD").toUpperCase();
  if (
    $("sp-balance").value === "" ||
    !Number.isFinite(balance) ||
    balance < 0 ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > 365 ||
    !Number.isFinite(income) ||
    income < 0 ||
    $("sp-daily").value === "" ||
    !Number.isFinite(daily) ||
    daily < 0 ||
    !Number.isFinite(bills) ||
    bills < 0
  )
    return show(
      "sp-result",
      "Enter a valid balance, 1–365 days, daily essentials, expected income and bills.",
      "err",
    );
  const available = balance + income - bills,
    need = daily * days,
    remaining = r2(available - need),
    safe = days ? Math.max(0, r2(available / days)) : 0,
    cls =
      remaining < 0
        ? "err"
        : remaining < Math.max(need * 0.1, 1)
          ? "warn"
          : "ok",
    headline =
      remaining < 0
        ? `Potential shortfall of ${Math.abs(remaining).toLocaleString()} ${cur}`
        : remaining < Math.max(need * 0.1, 1)
          ? "Tight budget: very little buffer remains"
          : "Your estimate covers the period with a buffer";
  DB.survival = DB.survival || {};
  DB.survival[me] = {
    balance,
    days,
    income,
    daily,
    bills,
    cur,
    at: Date.now(),
  };
  persist();
  $("sp-result").innerHTML =
    `<div class="msg ${cls}"><b>${headline}</b><br>${remaining < 0 ? "Based on these inputs, essentials may cost more than your available funds." : "Based on these inputs, essentials appear covered; unexpected costs can change the result."}</div><div class="met"><div>Available after bills<b>${r2(available).toLocaleString()} ${esc(cur)}</b></div><div>Essentials forecast<b>${r2(need).toLocaleString()} ${esc(cur)}</b></div><div>Estimated remaining<b>${remaining.toLocaleString()} ${esc(cur)}</b></div><div>Daily spending ceiling<b>${safe.toLocaleString()} ${esc(cur)}</b></div></div><h3>Suggested next steps</h3><ul>${remaining < 0 ? `<li>Reduce non-essential spending and recalculate using only necessary costs.</li><li>Check whether a confirmed income source can arrive before the deadline.</li><li>Contact your university student-support or financial-aid office early if tuition or housing is at risk.</li>` : `<li>Try to keep a portion of the remaining amount for emergencies.</li><li>Separate bill money from everyday spending.</li><li>Revisit this estimate when your actual spending or income changes.</li>`}</ul><p class="note">This is arithmetic based only on the values you entered. It does not include unknown expenses or guarantee future income.</p>`;
  audit("survival_plan_run", me, `${days} days; projected ${remaining} ${cur}`);
  renderDash();
}
function loadSurvivalFromBudget() {
  const b = DB.budget?.[me];
  if (!b)
    return show(
      "sp-result",
      "Calculate and save your budget first, or enter the values manually.",
      "warn",
    );
  $("sp-balance").value = Math.max(0, b.rem);
  $("sp-daily").value = r2(b.tot / 30);
  show(
    "sp-result",
    "Loaded remaining budget and estimated daily spending from your saved monthly budget. Adjust them to match your current situation.",
    "ok",
  );
}
function renderSurvivalSummary() {
  const s = DB.survival?.[me];
  if (s) {
    $("sp-balance").value = s.balance;
    $("sp-days").value = s.days;
    $("sp-income").value = s.income;
    $("sp-daily").value = s.daily;
    $("sp-bills").value = s.bills;
    $("sp-currency").value = s.cur;
    planSurvival();
  } else {
    const b = DB.budget?.[me];
    if (b) {
      $("sp-balance").value = Math.max(0, b.rem);
      $("sp-daily").value = r2(b.tot / 30);
    }
    $("sp-result").innerHTML =
      '<p class="note">Enter your current money, next-income timing and essential costs to generate a forecast.</p>';
  }
}

/* ---- Dashboard ---- */
function renderDash() {
  const b = (DB.budget || {})[me],
    sv = DB.saved?.[me] || [],
    g = DB.goals?.[me] || [],
    tx = DB.transactions?.[me] || [],
    bills = DB.bills?.[me] || [],
    unpaid = bills.filter((x) => !x.paid),
    overdue = unpaid.filter((x) => x.due < todayISO());
  let sc = b
    ? b.rem < 0
      ? 25
      : Math.min(80, Math.round(40 + (b.inc ? b.rem / b.inc : 0) * 200))
    : 30;
  if (sv.length) sc += 10;
  if (g.length) sc += 10;
  sc = Math.min(100, sc);
  const cls = sc >= 70 ? "ok" : sc >= 45 ? "warn" : "err",
    best = sv.length
      ? Math.max(
          ...sv.map((x) =>
            r2(
              x.data.out[0].received -
                x.data.out[x.data.out.length - 1].received,
            ),
          ),
        )
      : 0,
    tips = [];
  if (!b) tips.push("Run the Budget calculator to unlock budget insights.");
  else {
    const top = Object.entries(b.ex).sort((x, y) => y[1] - x[1])[0];
    tips.push(`Your biggest expense is ${top[0]} (${top[1]}).`);
    tips.push(
      b.rem < 0
        ? "You are over budget: trim flexible categories first."
        : b.rem < b.inc * 0.1
          ? "Under 10% of funds remain: build a small buffer."
          : "Healthy cushion: consider putting part of it into a savings goal.",
    );
  }
  if (!sv.length)
    tips.push(
      "Compare and save a transfer to track how much the best option saves you.",
    );
  if (!g.length)
    tips.push("Create a savings goal to plan for tuition or emergencies.");
  if (!tx.length)
    tips.push(
      "Record income and expenses to make future forecasts more useful.",
    );
  if (overdue.length)
    tips.push(
      `${overdue.length} bill(s) are overdue. Review the Bills tab and confirm their status.`,
    );
  else if (unpaid.length)
    tips.push(
      `${unpaid.length} unpaid bill(s) are on your list. Check the due dates before spending discretionary money.`,
    );
  tips.push(
    "Always compare the total received, not just the fee, and check the hidden cost against the mid-market rate.",
  );
  $("dash").innerHTML =
    `<div class="card"><h2>Welcome, ${esc(DB.users[me].name)}</h2><div class="met"><div>Financial health score<div class="big msg ${cls}" style="margin:6px 0;padding:8px">${sc}</div></div><div>Remaining budget<b>${b ? b.rem.toLocaleString() : "—"}</b></div><div>Saved comparisons<b>${sv.length}</b></div><div>Active goals<b>${g.length}</b></div><div>Best-vs-worst gap found<b>${best.toLocaleString()}</b></div><div>Transactions recorded<b>${tx.length}</b></div><div>Unpaid bills<b>${unpaid.length}</b></div></div></div>
 <div class="card"><h2>Smart tips</h2>${tips.map((t) => `<div class="chk">💡 ${esc(t)}</div>`).join("")}<p><button onclick="tab('ai')">Ask the AI assistant →</button></p></div>`;
}

/* ---- Scam shield ---- */
const FLAGS = [
  "I am being pressured to send money urgently",
  "The promised rate is far better than the market rate",
  "The provider cannot show a valid licence",
  "They ask for gift cards, crypto or a personal account",
  "Fees are not clearly shown before I pay",
  "They contacted me first (social media, call, message)",
];
function renderSafe() {
  $("flags").innerHTML = FLAGS.map(
    (f, i) =>
      `<label class="chk"><input type="checkbox" class="fl" onchange="risk()"> ${esc(f)}</label>`,
  ).join("");
  risk();
}
function risk() {
  const n = document.querySelectorAll(".fl:checked").length;
  const [c, m] =
    n === 0
      ? [
          "ok",
          "No red flags ticked. Still verify the provider is licensed before sending.",
        ]
      : n <= 2
        ? [
            "warn",
            `${n} red flag(s). Proceed with caution and verify the provider independently.`,
          ]
        : ["err", `${n} red flags. High scam risk: do not send money.`];
  $("risk").innerHTML = `<div class="msg ${c}">${m}</div>`;
}

/* ---- AI assistant ---- */
let chat = [];
const QS = [
  "Which transfer option is best for me?",
  "Is my budget healthy?",
  "How can I save more each month?",
  "What are hidden transfer costs?",
];
function renderChips() {
  $("chips").innerHTML = QS.map(
    (q) =>
      `<button class="chip" onclick="ask(this.textContent)">${esc(q)}</button>`,
  ).join("");
}
function renderChat() {
  const c = $("chat");
  c.innerHTML =
    chat
      .map((m) => `<div class="bub ${m.role}">${esc(m.content || "…")}</div>`)
      .join("") || '<p class="note">Try one of the quick questions above.</p>';
  c.scrollTop = c.scrollHeight;
}
function ctx() {
  const b = (DB.budget || {})[me],
    g = DB.goals?.[me] || [],
    tx = DB.transactions?.[me] || [],
    bills = DB.bills?.[me] || [],
    sp = DB.survival?.[me];
  let t = "";
  if (b)
    t += `Budget: income ${b.inc}, expenses ${b.tot}, remaining ${b.rem}. Categories: ${JSON.stringify(b.ex)}.\n`;
  if (g.length)
    t +=
      "Goals: " +
      g
        .map(
          (x) =>
            `${x.name}: target ${x.target}, saved ${x.saved}, ${x.months} months`,
        )
        .join("; ") +
      "\n";
  if (tx.length) {
    const income = tx
        .filter((x) => x.type === "income")
        .reduce((a, x) => a + x.amount, 0),
      expense = tx
        .filter((x) => x.type === "expense")
        .reduce((a, x) => a + x.amount, 0);
    t += `Recorded transactions: ${tx.length}; recorded income ${r2(income)}; recorded expenses ${r2(expense)} (mixed currencies may be present).\n`;
  }
  if (bills.length)
    t += `Bills: ${bills.filter((x) => !x.paid).length} unpaid, ${bills.filter((x) => !x.paid && x.due < todayISO()).length} overdue.\n`;
  if (sp)
    t += `Latest survival estimate: balance ${sp.balance} ${sp.cur}, ${sp.days} days to income, expected income ${sp.income}, daily essentials ${sp.daily}, bills ${sp.bills}.\n`;
  if (last)
    t +=
      `Latest transfer comparison (${last.sc} to ${last.rc}, amount ${last.amount}, mid-market ${$("mid").value}): ` +
      last.out
        .map(
          (o) =>
            `${o.name} recipient gets ${o.received}, fee ${o.fee} charged in ${o.fc} currency`,
        )
        .join("; ");
  return t || "No data entered yet.";
}
function localAI(q) {
  q = q.toLowerCase();
  const b = (DB.budget || {})[me];
  if (/hidden/.test(q))
    return "Hidden costs are the gap between the provider's rate and the mid-market rate, plus fees. A low advertised fee with a weak rate can cost more than a higher fee with a good rate.";
  if (/best|cheap|transfer|send|fee|rate/.test(q)) {
    if (!last)
      return "Run a comparison in the Transfers tab first, then ask again. Compare the total received, not just the fee.";
    const o = last.out,
      w = o[o.length - 1];
    return `${o[0].name} gives the most: ${o[0].received} ${last.rc}, which is ${r2(o[0].received - w.received)} more than ${w.name}.`;
  }
  if (/budget|afford|spend|expense|healthy/.test(q)) {
    if (!b) return "Fill in the Budget tab so I can review it.";
    const t = Object.entries(b.ex).sort((x, y) => y[1] - x[1])[0];
    return `You have ${b.rem} left after ${b.tot} of expenses. Biggest cost: ${t[0]} (${t[1]}). ${b.rem < 0 ? "You are over budget: trim flexible categories first." : "Aim to keep at least 10% of income as a buffer."}`;
  }
  if (/surviv|last until|payday|run out|shortfall|daily spend/.test(q)) {
    const sp = DB.survival?.[me];
    if (!sp)
      return "Open the Survival plan tab and enter your available balance, days until income, daily essentials and bills. I can then explain the calculated forecast.";
    const remaining = r2(
      sp.balance + sp.income - sp.bills - sp.daily * sp.days,
    );
    return remaining < 0
      ? `Your saved survival estimate shows a possible shortfall of ${Math.abs(remaining)} ${sp.cur} over ${sp.days} days. Recheck essential costs, reduce discretionary spending and seek student-support help early if needed.`
      : `Your saved estimate leaves about ${remaining} ${sp.cur} after essentials over ${sp.days} days. Keep a buffer for unexpected costs and update the figures as circumstances change.`;
  }
  if (/bill|tuition|rent due|overdue/.test(q)) {
    const bills = DB.bills?.[me] || [],
      u = bills.filter((x) => !x.paid),
      o = u.filter((x) => x.due < todayISO());
    return `You have ${u.length} unpaid bill(s), including ${o.length} overdue. Review the Bills tab for dates and amounts; I cannot pay bills or send reminders outside this browser.`;
  }
  if (/transaction|spending history|recorded expense/.test(q)) {
    const tx = DB.transactions?.[me] || [],
      ex = tx
        .filter((x) => x.type === "expense")
        .reduce((a, x) => a + x.amount, 0),
      inc = tx
        .filter((x) => x.type === "income")
        .reduce((a, x) => a + x.amount, 0);
    return `You have ${tx.length} recorded transaction(s): ${r2(inc)} income and ${r2(ex)} expenses across the entered entries. Make sure you do not mix currencies when comparing totals.`;
  }
  if (/goal|save|saving/.test(q))
    return "Set a goal in the Goals tab, then automate saving the monthly amount right after your income arrives.";
  return "I can help with comparing transfers, hidden costs, your budget and savings goals.";
}
async function ask(q){
  q=(q||$("q").value).trim();
  if(!q)return;
  $("q").value="";
  chat.push({role:"user",content:q},{role:"assistant",content:""});
  const i=chat.length-1;
  renderChat();

  let answer = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({q, ctx: ctx()})
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (j.text) { answer = j.text; break; }
      throw new Error("Empty");
    } catch (e) {
      if (attempt === 2) {
        answer = localAI(q) + "\n\n(Offline advisor — AI service unavailable after retry. Answers derived from your saved data.)";
      } else {
        await new Promise(r => setTimeout(r, 800));
      }
    }
  }
  chat[i].content = answer;
  renderChat();
}
