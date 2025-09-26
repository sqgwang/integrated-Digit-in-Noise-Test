// public/admin.js

const API_BASE = 'https://din-app.onrender.com';

// ---- tiny fetch helper ----
async function api(path, opts = {}) {
  const res = await fetch(
    path,
    Object.assign({ headers: { "Content-Type": "application/json" } }, opts)
  );
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { msg = await res.text(); } catch {}
    throw new Error(msg);
  }
  return res.json();
}
function $(id) { return document.getElementById(id); }

// ---- auth helpers ----
async function checkMe() {
  try {
    const me = await api("/api/me");
    return me.user;
  } catch {
    return null;
  }
}
function showLogin(show) {
  $("loginPane").style.display = show ? "" : "none";
  $("dashPane").style.display = show ? "none" : "";
}

// ---- results list ----
async function loadList() {
  const isAdmin = window.__ME_ROLE === "admin";
  const q = $("q").value.trim();
  const data = await api(`/api/results?limit=200&search=${encodeURIComponent(q)}`);

  $("count").textContent = `${data.total} records`;

  const el = $("list");
  if (!data.items.length) {
    el.innerHTML = '<p class="note">No records.</p>';
    return;
  }

  el.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Time</th>
          <th>PID</th>
          <th>StimLang</th>
          <th>Conditions</th>
          <th>SRTs</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(r => {
          const pid = (r.participantId || r.userInfo?.pid || "—");
          const lang = r.meta?.stimLang || r.stimLang || r.userInfo?.stimLang || "—";
          const conds = (r.meta?.conditionOrder || r.conditionOrder || r.userInfo?.testConditions || []).join(",");
          const srtStr = Array.isArray(r.perCondition)
            ? r.perCondition.map(x => `${x.condition}:${(x.SRT ?? "—")}`).join(" ")
            : "—";
          const actions = `
            <button data-id="${r._id}" class="secondary small view">View</button>
            ${isAdmin ? `<button data-id="${r._id}" class="secondary small del">Delete</button>` : ""}
          `;
          return `
            <tr>
              <td>${new Date(r.createdAt).toLocaleString()}</td>
              <td>${pid}</td>
              <td>${lang}</td>
              <td>${conds}</td>
              <td>${srtStr}</td>
              <td>${actions}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  // bind view
  el.querySelectorAll("button.view").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        const rec = await api("/api/results/" + btn.dataset.id);
        showDetail(rec);
      } catch (e) {
        alert("Load failed: " + e.message);
      }
    });
  });

  // bind delete (admin only)
  if (isAdmin) {
    el.querySelectorAll("button.del").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this record?")) return;
        try {
          await api("/api/results/" + btn.dataset.id, { method: "DELETE" });
          loadList();
        } catch (e) {
          alert("Delete failed: " + e.message);
        }
      });
    });
  }
}

// ---- users (admin only) ----
async function loadUsers() {
  try {
    const users = await api("/api/users");
    $("userList").innerHTML = users
      .map(u => `${u.username} (${u.role})`)
      .join(" · ");
  } catch {
    $("userList").textContent = "—";
  }
}

// ---- boot ----
window.addEventListener("DOMContentLoaded", async () => {
  $("btnLogin").addEventListener("click", async () => {
    $("loginMsg").textContent = "";
    try {
      const body = JSON.stringify({
        username: $("loginUser").value.trim(),
        password: $("loginPass").value
      });
      await api("/api/auth/login", { method: "POST", body });
      boot();
    } catch (e) {
      $("loginMsg").textContent = "Login failed.";
    }
  });

  $("btnLogout").addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" });
    showLogin(true);
  });

  $("btnReload").addEventListener("click", loadList);
  $("q").addEventListener("keydown", e => { if (e.key === "Enter") loadList(); });

  $("btnAddUser").addEventListener("click", async () => {
    $("userMsg").textContent = "";
    try {
      const body = JSON.stringify({
        username: $("newUser").value.trim(),
        password: $("newPass").value,
        role: $("newRole").value
      });
      await api("/api/users", { method: "POST", body });
      $("newUser").value = "";
      $("newPass").value = "";
      await loadUsers();
      $("userMsg").textContent = "User created.";
    } catch (e) {
      $("userMsg").textContent = "Create failed: " + e.message;
    }
  });

  await boot();
});

async function boot() {
  const me = await checkMe();
  if (!me) { showLogin(true); return; }
  showLogin(false);
  window.__ME_ROLE = me.role;
  $("meBadge").textContent = `Signed in as ${me.username} (${me.role})`;
  $("userAdmin").style.display = (me.role === "admin") ? "" : "none";
  await loadList();
  if (me.role === "admin") await loadUsers();
}

// ---- detail modal ----
function showDetail(rec) {
  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.inset = "0";
  wrap.style.background = "rgba(0,0,0,.35)";
  wrap.style.zIndex = "9999";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";

  const card = document.createElement("div");
  card.className = "container";
  card.style.maxWidth = "960px";
  card.style.maxHeight = "80vh";
  card.style.overflow = "auto";

  const title = document.createElement("h2");
  title.textContent = `Record ${rec._id}`;
  card.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "note";
  meta.textContent =
    `PID: ${rec.participantId || rec.userInfo?.pid || "—"} ` +
    `· Lang: ${rec.meta?.stimLang || rec.userInfo?.stimLang || "—"} ` +
    `· Trials: ${(rec.trials || []).length}`;
  card.appendChild(meta);

  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.fontSize = "12px";
  pre.textContent = JSON.stringify(rec, null, 2);
  card.appendChild(pre);

  const bar = document.createElement("div");
  bar.style.display = "flex";
  bar.style.gap = "8px";
  bar.style.marginTop = "8px";

  const btnJSON = document.createElement("button");
  btnJSON.className = "secondary";
  btnJSON.textContent = "Download JSON";
  btnJSON.onclick = () => {
    const blob = new Blob([JSON.stringify(rec, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `din_record_${rec._id}.json`;
    a.click();
  };

  const btnCSV = document.createElement("button");
  btnCSV.className = "secondary";
  btnCSV.textContent = "Download CSV (trials)";
  btnCSV.onclick = () => {
    const trials = rec.trials || [];
    const headers = [
      "participantId","condition","nDigits","digitsPresented",
      "presentedSNR","effectiveSNR","response","correct","rt_ms","timestamp"
    ];
    const rows = [headers.join(",")].concat(
      trials.map(t => headers.map(h => JSON.stringify(t[h] ?? "")).join(","))
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `din_trials_${rec._id}.csv`;
    a.click();
  };

  const btnClose = document.createElement("button");
  btnClose.className = "primary";
  btnClose.textContent = "Close";
  btnClose.onclick = () => document.body.removeChild(wrap);

  bar.appendChild(btnJSON);
  bar.appendChild(btnCSV);
  bar.appendChild(btnClose);
  card.appendChild(bar);

  wrap.appendChild(card);
  document.body.appendChild(wrap);
}

