/* ============================================================
   Ledger — Personal Diary
   Plain JavaScript application logic (no frameworks).
   UI theme is cached locally; diary data is stored persistently in MySQL by Spring Boot.
   ============================================================ */

/* ---------------------------- Constants --------------------------- */

var STORAGE_KEY = "ledger.ui.theme";

var MOODS = ["Happy", "Sad", "Angry", "Excited", "Calm", "Stressed"];

var CATEGORIES = ["Journal", "Work", "Study", "Travel", "Gratitude", "Dreams"];

var QUOTES = [
  { text: "We write to taste life twice, in the moment and in retrospect.", by: "Anais Nin" },
  { text: "Fill your paper with the breathings of your heart.", by: "William Wordsworth" },
  { text: "A journal is a friend that never interrupts.", by: "Unknown" },
  { text: "Write it on your heart that every day is the best day in the year.", by: "R. W. Emerson" },
  { text: "The life of every person is a diary in which they mean to write one story.", by: "J. M. Barrie" },
  { text: "Keep a notebook. Travel with it, sleep with it.", by: "Jack London" },
  { text: "How can I know what I think till I see what I say?", by: "E. M. Forster" }
];

var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ------------------------------ Store ----------------------------- */

var store = {
  users: [],
  entries: [],
  session: null,
  theme: "light",
  reminders: true,
  reminderTime: "21:00"
};

function loadStore() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.theme) store.theme = parsed.theme;
    }
  } catch (err) {
    console.warn("Could not read UI settings", err);
  }
}

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: store.theme }));
  } catch (err) {
    console.warn("Could not save UI settings", err);
  }
  applyTheme();
}

/* --------------------------- API Client --------------------------- */

async function apiFetch(url, options) {
  options = options || {};
  options.credentials = "same-origin";
  options.headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  var response = await fetch(url, options);
  var text = await response.text();
  var data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    var message = data && data.message ? data.message : "Request failed (" + response.status + ")";
    throw new Error(message);
  }
  return data;
}

async function refreshRemote() {
  var user = await apiFetch("/api/auth/me");
  var settings = await apiFetch("/api/settings");
  var entries = await apiFetch("/api/entries");
  store.users = [user];
  store.session = user.username;
  store.entries = entries || [];
  store.theme = settings.theme || "light";
  store.reminders = settings.reminders;
  store.reminderTime = settings.reminderTime || "21:00";
  saveStore();
}

async function bootstrap() {
  loadStore();
  applyTheme();
  try {
    await refreshRemote();
  } catch (err) {
    store.users = [];
    store.entries = [];
    store.session = null;
  }
  render();
}

function applyTheme() {
  var root = document.documentElement;
  root.classList.remove("dark", "vintage");
  if (store.theme !== "light") root.classList.add(store.theme);
}

/* ---------------------------- Helpers ----------------------------- */

function toISO(d) {
  var m = String(d.getMonth() + 1);
  var day = String(d.getDate());
  if (m.length < 2) m = "0" + m;
  if (day.length < 2) day = "0" + day;
  return d.getFullYear() + "-" + m + "-" + day;
}

function todayISO() {
  return toISO(new Date());
}

function dateFromISO(iso) {
  var p = iso.split("-");
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function formatLong(iso) {
  return dateFromISO(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatShort(iso) {
  return dateFromISO(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function quoteOfTheDay() {
  var day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

function escapeHtml(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function currentUser() {
  return store.users.length ? store.users[0] : null;
}

function myEntries() {
  return store.entries.slice().sort(function (a, b) {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}

function entryById(id) {
  for (var i = 0; i < store.entries.length; i++) {
    if (String(store.entries[i].id) === String(id)) return store.entries[i];
  }
  return null;
}

function computeStreak(entries) {
  var days = {};
  for (var i = 0; i < entries.length; i++) days[entries[i].date] = true;
  var streak = 0;
  var cursor = new Date();
  if (!days[toISO(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (days[toISO(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function longestStreak(entries) {
  var dates = [];
  for (var i = 0; i < entries.length; i++) {
    if (dates.indexOf(entries[i].date) === -1) dates.push(entries[i].date);
  }
  dates.sort();
  var best = 0;
  var run = 0;
  var prev = null;
  for (var j = 0; j < dates.length; j++) {
    var d = dateFromISO(dates[j]);
    if (prev && (d - prev) / 86400000 === 1) run++;
    else run = 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

function wroteToday() {
  var list = myEntries();
  for (var i = 0; i < list.length; i++) if (list[i].date === todayISO()) return true;
  return false;
}

/* ------------------------- Auth screen logic ---------------------- */

var authScreen = document.getElementById("auth-screen");
var appShell = document.getElementById("app-shell");
var loginForm = document.getElementById("login-form");
var registerForm = document.getElementById("register-form");

document.getElementById("go-register").addEventListener("click", function (e) {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
});

document.getElementById("go-login").addEventListener("click", function (e) {
  e.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  var username = document.getElementById("login-username").value.trim();
  var password = document.getElementById("login-password").value;
  var err = document.getElementById("login-error");
  err.textContent = "";

  try {
    await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: username, password: password })
    });
    await refreshRemote();
    location.hash = "#/dashboard";
    render();
  } catch (ex) {
    err.textContent = ex.message || "Username or password is incorrect.";
  }
});

registerForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  var name = document.getElementById("reg-name").value.trim();
  var username = document.getElementById("reg-username").value.trim();
  var password = document.getElementById("reg-password").value;
  var confirm = document.getElementById("reg-confirm").value;
  var err = document.getElementById("register-error");
  err.textContent = "";

  if (password.length < 4) {
    err.textContent = "Use a password of at least 4 characters.";
    return;
  }
  if (password !== confirm) {
    err.textContent = "The two passwords do not match.";
    return;
  }

  try {
    await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: name, username: username, password: password })
    });
    await refreshRemote();
    location.hash = "#/dashboard";
    render();
  } catch (ex) {
    err.textContent = ex.message || "Could not create account.";
  }
});

document.getElementById("sign-out").addEventListener("click", async function () {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch (e) {
    console.warn("Logout error", e);
  }
  store.session = null;
  store.users = [];
  store.entries = [];
  location.hash = "";
  render();
});

/* ----------------------------- Routing ---------------------------- */

var view = document.getElementById("view");

function parseHash() {
  var raw = location.hash.replace(/^#\/?/, "");
  var parts = raw.split("?");
  var path = parts[0] || "dashboard";
  var query = {};
  if (parts[1]) {
    var pairs = parts[1].split("&");
    for (var i = 0; i < pairs.length; i++) {
      var kv = pairs[i].split("=");
      query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
    }
  }
  return { path: path, query: query };
}

function render() {
  applyTheme();
  var user = currentUser();

  if (!user) {
    authScreen.classList.remove("hidden");
    appShell.classList.add("hidden");
    return;
  }

  authScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
  document.getElementById("side-user").textContent = user.name || user.username;

  var route = parseHash();
  var segments = route.path.split("/");
  var page = segments[0] || "dashboard";

  // Highlight the active navigation link
  var links = document.querySelectorAll("#side-nav a");
  for (var i = 0; i < links.length; i++) {
    links[i].classList.toggle("active", links[i].getAttribute("data-route") === page);
  }

  // Reminder banner
  var banner = document.getElementById("reminder-banner");
  banner.classList.toggle("hidden", !(store.reminders && !wroteToday()));

  switch (page) {
    case "new":
      renderComposer(route.query);
      break;
    case "entries":
      renderEntries();
      break;
    case "entry":
      renderEntryView(segments[1]);
      break;
    case "calendar":
      renderCalendar(route.query);
      break;
    case "favourites":
      renderFavourites();
      break;
    case "moods":
      renderMoods();
      break;
    case "on-this-day":
      renderOnThisDay();
      break;
    case "streaks":
      renderStreaks();
      break;
    case "settings":
      renderSettings();
      break;
    case "help":
      renderHelp();
      break;
    default:
      renderDashboard();
  }
}

window.addEventListener("hashchange", render);

/* --------------------------- Shared parts -------------------------- */

function pageHead(title, subtitle) {
  return (
    '<div class="page-head"><h1>' +
    escapeHtml(title) +
    "</h1><p>" +
    escapeHtml(subtitle) +
    "</p></div>"
  );
}

function moodChip(mood) {
  return (
    '<span class="chip mood-' + escapeHtml(mood) + '"><span class="dot"></span>' +
    escapeHtml(mood) +
    "</span>"
  );
}

function entryCardHtml(entry) {
  var body = entry.locked ? "This entry is private. Open it to unlock." : entry.content;
  return (
    '<article class="entry-card">' +
    '<div class="spread"><div>' +
    "<h3>" + escapeHtml(entry.title || "Untitled") + "</h3>" +
    '<div class="label-mono">' + escapeHtml(formatLong(entry.date)) + "</div>" +
    "</div>" +
    '<button class="star ' + (entry.favourite ? "on" : "") + '" data-fav="' + entry.id +
    '" title="Favourite">' + (entry.favourite ? "\u2605" : "\u2606") + "</button>" +
    "</div>" +
    '<div class="entry-meta">' + moodChip(entry.mood) +
    '<span class="chip">' + escapeHtml(entry.category) + "</span>" +
    (entry.locked ? '<span class="chip">Private</span>' : "") +
    (entry.image ? '<span class="chip">Photo</span>' : "") +
    "</div>" +
    '<p class="entry-excerpt">' + escapeHtml(body) + "</p>" +
    '<div class="entry-actions">' +
    '<a class="btn btn-sm" href="#/entry/' + entry.id + '">Read</a>' +
    '<a class="btn btn-sm" href="#/new?edit=' + entry.id + '">Edit</a>' +
    '<button class="btn btn-sm btn-danger" data-del="' + entry.id + '">Delete</button>' +
    "</div></article>"
  );
}

// Handle clicks on favourite / delete buttons anywhere in the app
document.addEventListener("click", async function (e) {
  var favBtn = e.target.closest ? e.target.closest("[data-fav]") : null;
  if (favBtn) {
    var favId = favBtn.getAttribute("data-fav");
    try {
      var updated = await apiFetch("/api/entries/" + favId + "/favorite", { method: "PATCH" });
      for (var i = 0; i < store.entries.length; i++) {
        if (String(store.entries[i].id) === String(favId)) {
          store.entries[i] = updated;
          break;
        }
      }
      render();
    } catch (err) {
      alert("Could not update favourite status: " + err.message);
    }
    return;
  }

  var delBtn = e.target.closest ? e.target.closest("[data-del]") : null;
  if (delBtn) {
    var id = delBtn.getAttribute("data-del");
    if (confirm("Delete this entry? This cannot be undone.")) {
      try {
        await apiFetch("/api/entries/" + id, { method: "DELETE" });
        store.entries = store.entries.filter(function (item) {
          return String(item.id) !== String(id);
        });
        if (parseHash().path.indexOf("entry/") === 0) location.hash = "#/entries";
        else render();
      } catch (err) {
        alert("Could not delete entry: " + err.message);
      }
    }
  }
});

/* ---------------------------- Dashboard ---------------------------- */

function renderDashboard() {
  var user = currentUser();
  var entries = myEntries();
  var quote = quoteOfTheDay();
  var favs = entries.filter(function (e) {
    return e.favourite;
  });
  var recent = entries.slice(0, 3);

  var html =
    pageHead("Good day, " + (user.name || user.username), formatLong(todayISO())) +
    '<div class="grid-3">' +
    '<div class="card"><div class="label-mono">Current streak</div><div class="stat-value">' +
    computeStreak(entries) +
    '</div><div class="label-mono">days in a row</div></div>' +
    '<div class="card"><div class="label-mono">Total entries</div><div class="stat-value">' +
    entries.length +
    '</div><div class="label-mono">pages written</div></div>' +
    '<div class="card"><div class="label-mono">Favourites</div><div class="stat-value">' +
    favs.length +
    '</div><div class="label-mono">saved pages</div></div>' +
    "</div>" +
    '<div class="card mt"><div class="label-mono">Quote of the day</div><p class="quote">&ldquo;' +
    escapeHtml(quote.text) +
    '&rdquo;</p><div class="quote-by">&mdash; ' +
    escapeHtml(quote.by) +
    "</div></div>" +
    '<div class="row mt"><a class="btn btn-primary" href="#/new">Write today\'s page</a>' +
    '<a class="btn" href="#/entries">Browse all entries</a></div>' +
    '<div class="mt"><div class="spread"><h2>Recent entries</h2><a href="#/entries">See all</a></div>' +
    '<div class="stack" style="margin-top:14px">';

  if (recent.length === 0) html += '<p class="empty">No entries yet. Your first page is waiting.</p>';
  for (var i = 0; i < recent.length; i++) html += entryCardHtml(recent[i]);
  html += "</div></div>";

  view.innerHTML = html;
}

/* ----------------------------- Composer ---------------------------- */

function renderComposer(query) {
  var editing = query.edit ? entryById(query.edit) : null;
  var date = editing ? editing.date : query.date || todayISO();

  var moodOptions = "";
  for (var i = 0; i < MOODS.length; i++) {
    var selected = editing && editing.mood === MOODS[i] ? " selected" : "";
    moodOptions += '<option value="' + MOODS[i] + '"' + selected + ">" + MOODS[i] + "</option>";
  }
  var catOptions = "";
  for (var j = 0; j < CATEGORIES.length; j++) {
    var sel = editing && editing.category === CATEGORIES[j] ? " selected" : "";
    catOptions += '<option value="' + CATEGORIES[j] + '"' + sel + ">" + CATEGORIES[j] + "</option>";
  }

  view.innerHTML =
    pageHead(editing ? "Edit entry" : "New entry", "Take your time. Nobody else can read this.") +
    '<form id="entry-form" class="card">' +
    '<div class="grid-2">' +
    '<label class="field"><span class="label-mono">Date</span>' +
    '<input type="date" id="f-date" value="' + date + '" required /></label>' +
    '<label class="field"><span class="label-mono">Title</span>' +
    '<input type="text" id="f-title" value="' + escapeHtml(editing ? editing.title : "") +
    '" placeholder="Give this day a name" required /></label>' +
    '<label class="field"><span class="label-mono">Mood</span><select id="f-mood">' + moodOptions + "</select></label>" +
    '<label class="field"><span class="label-mono">Category</span><select id="f-cat">' + catOptions + "</select></label>" +
    "</div>" +
    '<label class="field"><span class="label-mono">Your page</span>' +
    '<textarea id="f-content" placeholder="Today..." required>' +
    escapeHtml(editing ? (editing.content || "") : "") +
    "</textarea></label>" +
    '<label class="field"><span class="label-mono">Photo (optional)</span>' +
    '<input type="file" id="f-photo" accept="image/*" /></label>' +
    '<div id="photo-preview">' +
    (editing && editing.image
      ? '<img class="photo" src="' + editing.image + '" style="max-width:260px;border-radius:8px" />'
      : "") +
    "</div>" +
    '<div class="row" style="margin-top:14px">' +
    '<label class="row" style="gap:8px"><input type="checkbox" id="f-fav" ' +
    (editing && editing.favourite ? "checked" : "") +
    " /> Mark as favourite</label>" +
    '<label class="row" style="gap:8px"><input type="checkbox" id="f-lock" ' +
    (editing && editing.locked ? "checked" : "") +
    " /> Keep private (ask for password)</label>" +
    "</div>" +
    '<div class="row" style="margin-top:20px">' +
    '<button class="btn btn-primary" type="submit">' +
    (editing ? "Save changes" : "Save entry") +
    "</button>" +
    '<a class="btn" href="#/entries">Cancel</a>' +
    "</div></form>";

  var photoData = editing && editing.image ? editing.image : "";

  document.getElementById("f-photo").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      photoData = reader.result;
      document.getElementById("photo-preview").innerHTML =
        '<img class="photo" src="' + photoData + '" style="max-width:260px;border-radius:8px" />';
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("entry-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var payload = {
      date: document.getElementById("f-date").value,
      title: document.getElementById("f-title").value.trim(),
      mood: document.getElementById("f-mood").value,
      category: document.getElementById("f-cat").value,
      content: document.getElementById("f-content").value,
      image: photoData || null,
      favourite: document.getElementById("f-fav").checked,
      locked: document.getElementById("f-lock").checked
    };

    try {
      var saved;
      if (editing) {
        saved = await apiFetch("/api/entries/" + editing.id, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        for (var i = 0; i < store.entries.length; i++) {
          if (String(store.entries[i].id) === String(editing.id)) {
            store.entries[i] = saved;
            break;
          }
        }
      } else {
        saved = await apiFetch("/api/entries", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        store.entries.unshift(saved);
      }
      location.hash = payload.locked ? "#/dashboard" : ("#/entry/" + saved.id);
    } catch (err) {
      alert("Could not save entry: " + err.message);
    }
  });
}

/* ---------------------------- Entries list -------------------------- */

var entryFilters = { text: "", mood: "All", category: "All", date: "" };

function renderEntries() {
  var moodOpts = '<option value="All">All moods</option>';
  for (var i = 0; i < MOODS.length; i++) {
    moodOpts +=
      '<option value="' + MOODS[i] + '"' + (entryFilters.mood === MOODS[i] ? " selected" : "") + ">" +
      MOODS[i] + "</option>";
  }
  var catOpts = '<option value="All">All categories</option>';
  for (var j = 0; j < CATEGORIES.length; j++) {
    catOpts +=
      '<option value="' + CATEGORIES[j] + '"' + (entryFilters.category === CATEGORIES[j] ? " selected" : "") +
      ">" + CATEGORIES[j] + "</option>";
  }

  view.innerHTML =
    pageHead("All entries", "Search your diary, or filter by mood, category or date.") +
    '<div class="card no-print"><div class="row">' +
    '<input type="text" id="q" placeholder="Search titles and text..." value="' +
    escapeHtml(entryFilters.text) + '" style="flex:2;min-width:240px" />' +
    '<select id="q-mood" style="flex:1;min-width:150px">' + moodOpts + "</select>" +
    '<select id="q-cat" style="flex:1;min-width:150px">' + catOpts + "</select>" +
    '<input type="date" id="q-date" value="' + entryFilters.date + '" style="flex:1;min-width:150px" />' +
    '<button class="btn" id="q-clear">Clear</button>' +
    "</div></div>" +
    '<div class="stack mt" id="entry-list"></div>';

  function apply() {
    var list = myEntries();
    var text = entryFilters.text.toLowerCase();
    var out = [];
    for (var k = 0; k < list.length; k++) {
      var e = list[k];
      var searchTarget = (e.title || "") + " " + (e.content || "");
      if (text && searchTarget.toLowerCase().indexOf(text) === -1) continue;
      if (entryFilters.mood !== "All" && e.mood !== entryFilters.mood) continue;
      if (entryFilters.category !== "All" && e.category !== entryFilters.category) continue;
      if (entryFilters.date && e.date !== entryFilters.date) continue;
      out.push(e);
    }
    var html = "";
    if (out.length === 0) html = '<p class="empty">No entries match what you are looking for.</p>';
    for (var m = 0; m < out.length; m++) html += entryCardHtml(out[m]);
    document.getElementById("entry-list").innerHTML = html;
  }

  document.getElementById("q").addEventListener("input", function (e) {
    entryFilters.text = e.target.value;
    apply();
  });
  document.getElementById("q-mood").addEventListener("change", function (e) {
    entryFilters.mood = e.target.value;
    apply();
  });
  document.getElementById("q-cat").addEventListener("change", function (e) {
    entryFilters.category = e.target.value;
    apply();
  });
  document.getElementById("q-date").addEventListener("change", function (e) {
    entryFilters.date = e.target.value;
    apply();
  });
  document.getElementById("q-clear").addEventListener("click", function () {
    entryFilters = { text: "", mood: "All", category: "All", date: "" };
    renderEntries();
  });

  apply();
}

/* ---------------------------- Entry reader -------------------------- */

function renderReader(entry) {
  view.innerHTML =
    '<div class="row no-print" style="margin-bottom:18px">' +
    '<a class="btn" href="#/entries">&larr; Back</a>' +
    '<a class="btn" href="#/new?edit=' + entry.id + '">Edit</a>' +
    '<button class="btn" id="pdf-btn">Export as PDF</button>' +
    '<button class="btn" id="img-btn">Export as image</button>' +
    '<button class="star ' + (entry.favourite ? "on" : "") + '" data-fav="' + entry.id + '">' +
    (entry.favourite ? "\u2605" : "\u2606") + "</button>" +
    '<button class="btn btn-danger" data-del="' + entry.id + '">Delete</button>' +
    "</div>" +
    '<article class="reader" id="reader">' +
    '<div class="label-mono">' + escapeHtml(formatLong(entry.date)) + "</div>" +
    '<h1 style="font-size:40px;margin:6px 0 12px">' + escapeHtml(entry.title || "Untitled") + "</h1>" +
    '<div class="entry-meta" style="margin-bottom:24px">' + moodChip(entry.mood) +
    '<span class="chip">' + escapeHtml(entry.category) + "</span>" +
    (entry.locked ? '<span class="chip">Private</span>' : "") +
    (entry.image ? '<span class="chip">Photo</span>' : "") +
    "</div>" +
    '<div class="reader-body">' + escapeHtml(entry.content || "") + "</div>" +
    (entry.image ? '<img class="photo" src="' + entry.image + '" alt="Entry photo" />' : "") +
    "</article>";

  document.getElementById("pdf-btn").addEventListener("click", function () {
    window.print();
  });

  document.getElementById("img-btn").addEventListener("click", function () {
    exportEntryAsImage(entry);
  });
}

async function renderEntryView(id) {
  var entry = entryById(id);
  if (!entry) {
    try {
      entry = await apiFetch("/api/entries/" + id);
      store.entries.push(entry);
    } catch (err) {
      view.innerHTML = pageHead("Not found", "That entry no longer exists.") +
        '<a class="btn" href="#/entries">Back to entries</a>';
      return;
    }
  }

  // Always require password for locked entries every time they are opened
  if (entry.locked) {
    view.innerHTML =
      pageHead("Private entry", formatLong(entry.date)) +
      '<div class="card" style="max-width:420px">' +
      '<p class="auth-sub">Enter your account password to read this page.</p>' +
      '<label class="field"><span class="label-mono">Password</span><input type="password" id="unlock-pw" autocomplete="current-password" /></label>' +
      '<p class="form-error" id="unlock-error"></p>' +
      '<div class="row">' +
      '<button class="btn btn-primary" id="unlock-btn">Unlock</button>' +
      '<a class="btn" href="#/dashboard">Back to Dashboard</a>' +
      "</div></div>";

    var doUnlock = async function () {
      var pw = document.getElementById("unlock-pw").value;
      var err = document.getElementById("unlock-error");
      err.textContent = "";
      if (!pw) {
        err.textContent = "Please enter your password.";
        return;
      }
      try {
        var unlockedEntry = await apiFetch("/api/entries/" + id + "/unlock", {
          method: "POST",
          body: JSON.stringify({ password: pw })
        });
        // Render the unlocked reader directly for this view only, without caching it as permanently unlocked in store
        renderReader(unlockedEntry);
      } catch (ex) {
        err.textContent = ex.message || "That password is not correct.";
      }
    };

    document.getElementById("unlock-btn").addEventListener("click", doUnlock);
    document.getElementById("unlock-pw").addEventListener("keyup", function (e) {
      if (e.key === "Enter") doUnlock();
    });
    return;
  }

  renderReader(entry);
}

/* Draw the entry onto a canvas and download it as a PNG picture. */
function exportEntryAsImage(entry) {
  var canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fbfaf6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#857a68";
  ctx.font = "16px Inter, sans-serif";
  ctx.fillText(formatLong(entry.date).toUpperCase(), 60, 80);

  ctx.fillStyle = "#3b3328";
  ctx.font = "44px Georgia, serif";
  ctx.fillText(entry.title || "Untitled", 60, 140);

  ctx.fillStyle = "#a9552f";
  ctx.font = "18px Inter, sans-serif";
  ctx.fillText(entry.mood + "  \u00b7  " + entry.category, 60, 180);

  ctx.fillStyle = "#3b3328";
  ctx.font = "22px Georgia, serif";

  var words = (entry.content || "").split(/\s+/);
  var line = "";
  var y = 240;
  for (var i = 0; i < words.length; i++) {
    var test = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(test).width > 780) {
      ctx.fillText(line, 60, y);
      line = words[i];
      y += 38;
      if (y > 1130) break;
    } else {
      line = test;
    }
  }
  if (line && y <= 1130) ctx.fillText(line, 60, y);

  var link = document.createElement("a");
  link.download = (entry.title || "entry") + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/* ------------------------------ Calendar ---------------------------- */

function renderCalendar(query) {
  var now = new Date();
  var year = query.y ? Number(query.y) : now.getFullYear();
  var month = query.m ? Number(query.m) : now.getMonth();
  if (month < 0) {
    month = 11;
    year -= 1;
  }
  if (month > 11) {
    month = 0;
    year += 1;
  }

  var entries = myEntries();
  var byDate = {};
  for (var i = 0; i < entries.length; i++) {
    if (!byDate[entries[i].date]) byDate[entries[i].date] = entries[i];
  }

  var first = new Date(year, month, 1);
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var label = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  var cells = "";
  for (var w = 0; w < 7; w++) cells += '<div class="cal-head label-mono">' + WEEKDAYS[w] + "</div>";
  for (var b = 0; b < first.getDay(); b++) cells += '<div class="cal-cell blank"></div>';

  for (var d = 1; d <= daysInMonth; d++) {
    var iso = toISO(new Date(year, month, d));
    var entry = byDate[iso];
    var isToday = iso === todayISO();
    var href = entry ? "#/entry/" + entry.id : "#/new?date=" + iso;
    cells +=
      '<a class="cal-cell' + (isToday ? " today" : "") + '" href="' + href + '">' +
      '<div class="cal-num">' + d + "</div>" +
      (entry
        ? '<div class="cal-title">' + escapeHtml(entry.title || "Untitled") + "</div>" +
          '<div style="margin-top:6px">' + moodChip(entry.mood) + "</div>"
        : "") +
      "</a>";
  }

  var prevMonth = month - 1 < 0 ? 11 : month - 1;
  var prevYear = month - 1 < 0 ? year - 1 : year;
  var nextMonth = month + 1 > 11 ? 0 : month + 1;
  var nextYear = month + 1 > 11 ? year + 1 : year;

  view.innerHTML =
    '<div class="spread page-head"><div><h1>' + escapeHtml(label) + "</h1>" +
    "<p>Click a day to read it, or to start writing.</p></div>" +
    '<div class="row no-print">' +
    '<a class="btn" href="#/calendar?y=' + prevYear + "&m=" + prevMonth + '">&larr; Previous</a>' +
    '<a class="btn" href="#/calendar">Today</a>' +
    '<a class="btn" href="#/calendar?y=' + nextYear + "&m=" + nextMonth + '">Next &rarr;</a>' +
    "</div></div>" +
    '<div class="cal-grid">' + cells + "</div>";
}

/* ----------------------------- Favourites --------------------------- */

function renderFavourites() {
  var entries = myEntries().filter(function (e) {
    return e.favourite;
  });
  var html = pageHead("Favourites", "The pages you wanted to keep close.") + '<div class="stack">';
  if (entries.length === 0)
    html += '<p class="empty">No favourites yet. Tap the star on any entry to add one.</p>';
  for (var i = 0; i < entries.length; i++) html += entryCardHtml(entries[i]);
  view.innerHTML = html + "</div>";
}

/* -------------------------------- Moods ----------------------------- */

function renderMoods() {
  var entries = myEntries();
  var counts = {};
  for (var i = 0; i < MOODS.length; i++) counts[MOODS[i]] = 0;
  for (var j = 0; j < entries.length; j++) {
    if (counts[entries[j].mood] != null) counts[entries[j].mood]++;
  }

  var max = 1;
  for (var m = 0; m < MOODS.length; m++) if (counts[MOODS[m]] > max) max = counts[MOODS[m]];

  var top = MOODS[0];
  for (var t = 0; t < MOODS.length; t++) if (counts[MOODS[t]] > counts[top]) top = MOODS[t];

  var bars = "";
  for (var k = 0; k < MOODS.length; k++) {
    var mood = MOODS[k];
    var pct = Math.round((counts[mood] / max) * 100);
    bars +=
      '<div class="bar-row mood-' + mood + '">' +
      '<div class="row" style="gap:6px"><span class="dot"></span><span style="font-size:13px">' +
      mood + "</span></div>" +
      '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="label-mono" style="text-align:right">' + counts[mood] + "</div></div>";
  }

  var recent = entries.slice(0, 14);
  var timeline = "";
  for (var r = recent.length - 1; r >= 0; r--) {
    timeline +=
      '<div class="row mood-' + recent[r].mood + '" style="gap:10px;padding:6px 0;border-bottom:1px solid var(--line)">' +
      '<span class="dot"></span><span class="label-mono" style="width:70px">' +
      escapeHtml(formatShort(recent[r].date)) + "</span>" +
      '<span style="font-size:13px">' + escapeHtml(recent[r].mood) + "</span>" +
      '<span style="font-size:13px;color:var(--ink-soft)">' +
      escapeHtml(recent[r].title || "Untitled") + "</span></div>";
  }

  view.innerHTML =
    pageHead("Mood tracking", "How your days have felt so far.") +
    '<div class="grid-2">' +
    '<div class="card"><div class="label-mono">Mood spread</div><div style="margin-top:16px">' +
    bars + "</div></div>" +
    '<div class="card"><div class="label-mono">Most common mood</div>' +
    '<div class="stat-value">' + escapeHtml(entries.length ? top : "\u2014") + "</div>" +
    '<div class="label-mono">across ' + entries.length + " entries</div>" +
    '<div class="label-mono" style="margin-top:26px">Last 14 entries</div>' +
    '<div style="margin-top:8px">' +
    (timeline || '<p class="empty">Nothing recorded yet.</p>') +
    "</div></div></div>";
}

/* ----------------------------- On this day -------------------------- */

function renderOnThisDay() {
  var now = new Date();
  var entries = myEntries().filter(function (e) {
    var d = dateFromISO(e.date);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() !== now.getFullYear()
    );
  });

  var html =
    pageHead("On this day", "What you wrote on " + formatShort(todayISO()) + " in earlier years.") +
    '<div class="stack">';
  if (entries.length === 0)
    html += '<p class="empty">Nothing from previous years yet. Come back next year.</p>';
  for (var i = 0; i < entries.length; i++) html += entryCardHtml(entries[i]);
  view.innerHTML = html + "</div>";
}

/* ------------------------------- Streaks ---------------------------- */

function renderStreaks() {
  var entries = myEntries();
  var current = computeStreak(entries);
  var best = longestStreak(entries);

  var week = "";
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var iso = toISO(d);
    var written = false;
    for (var j = 0; j < entries.length; j++) if (entries[j].date === iso) written = true;
    week +=
      '<div class="card" style="text-align:center;padding:14px">' +
      '<div class="label-mono">' + WEEKDAYS[d.getDay()] + "</div>" +
      '<div style="font-size:22px;color:' + (written ? "var(--accent)" : "var(--ink-soft)") + '">' +
      (written ? "\u25cf" : "\u25cb") + "</div>" +
      '<div class="label-mono">' + escapeHtml(formatShort(iso)) + "</div></div>";
  }

  view.innerHTML =
    pageHead("Streaks", "Small steps, kept up.") +
    '<div class="grid-3">' +
    '<div class="card"><div class="label-mono">Current streak</div><div class="stat-value">' +
    current + '</div><div class="label-mono">days</div></div>' +
    '<div class="card"><div class="label-mono">Longest streak</div><div class="stat-value">' +
    best + '</div><div class="label-mono">days</div></div>' +
    '<div class="card"><div class="label-mono">Seven day badge</div>' +
    '<div class="badge ' + (current >= 7 ? "" : "locked") + '" style="margin-top:10px">7' +
    '<span class="label-mono">days</span></div></div>' +
    "</div>" +
    '<div class="mt"><div class="label-mono">This week</div>' +
    '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:12px;margin-top:12px">' +
    week + "</div></div>";
}

/* ------------------------------ Settings ---------------------------- */

function renderSettings() {
  var themes = [
    { id: "light", name: "Light paper" },
    { id: "dark", name: "Dark ink" },
    { id: "vintage", name: "Vintage" }
  ];
  var themeBtns = "";
  for (var i = 0; i < themes.length; i++) {
    themeBtns +=
      '<button class="btn ' + (store.theme === themes[i].id ? "btn-primary" : "") +
      '" data-theme="' + themes[i].id + '">' + themes[i].name + "</button>";
  }

  view.innerHTML =
    pageHead("Settings", "Themes, reminders, password and backups.") +
    '<div class="grid-2">' +
    '<div class="card"><div class="label-mono">Appearance</div>' +
    '<p style="font-size:14px;color:var(--ink-soft)">Choose how your diary looks.</p>' +
    '<div class="row">' + themeBtns + "</div></div>" +
    '<div class="card"><div class="label-mono">Daily reminder</div>' +
    '<label class="row" style="gap:8px;margin:12px 0"><input type="checkbox" id="s-remind" ' +
    (store.reminders ? "checked" : "") + " /> Remind me to write each day</label>" +
    '<label class="field"><span class="label-mono">Reminder time</span>' +
    '<input type="time" id="s-time" value="' + store.reminderTime + '" /></label></div>' +
    '<div class="card"><div class="label-mono">Change password</div>' +
    '<label class="field"><span class="label-mono">Current password</span><input type="password" id="s-old" /></label>' +
    '<label class="field"><span class="label-mono">New password</span><input type="password" id="s-new" /></label>' +
    '<p class="form-error" id="s-pw-msg"></p>' +
    '<button class="btn btn-primary" id="s-pw-btn">Update password</button></div>' +
    '<div class="card"><div class="label-mono">Backup and restore</div>' +
    '<p style="font-size:14px;color:var(--ink-soft)">Save a copy of your diary, or bring one back.</p>' +
    '<div class="row"><button class="btn" id="s-backup">Download backup</button>' +
    '<label class="btn" style="cursor:pointer">Restore from file' +
    '<input type="file" id="s-restore" accept="application/json" style="display:none" /></label></div>' +
    '<p class="form-error" id="s-restore-msg"></p></div>' +
    "</div>";

  var themeButtons = view.querySelectorAll("[data-theme]");
  for (var t = 0; t < themeButtons.length; t++) {
    themeButtons[t].addEventListener("click", async function () {
      store.theme = this.getAttribute("data-theme");
      saveStore();
      try {
        await apiFetch("/api/settings", {
          method: "PUT",
          body: JSON.stringify({
            theme: store.theme,
            reminders: store.reminders,
            reminderTime: store.reminderTime
          })
        });
      } catch (e) {
        console.warn("Failed to sync theme preference", e);
      }
      renderSettings();
    });
  }

  async function saveSettingsFromForm() {
    await apiFetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        theme: store.theme,
        reminders: document.getElementById("s-remind").checked,
        reminderTime: document.getElementById("s-time").value
      })
    });
    await refreshRemote();
  }

  document.getElementById("s-remind").addEventListener("change", function () {
    store.reminders = this.checked;
    saveSettingsFromForm().then(render).catch(function (e) {
      alert(e.message);
    });
  });

  document.getElementById("s-time").addEventListener("change", function () {
    store.reminderTime = this.value;
    saveSettingsFromForm().catch(function (e) {
      alert(e.message);
    });
  });

  document.getElementById("s-pw-btn").addEventListener("click", async function () {
    var msg = document.getElementById("s-pw-msg");
    var oldPw = document.getElementById("s-old").value;
    var newPw = document.getElementById("s-new").value;
    msg.textContent = "";

    if (!oldPw) {
      msg.textContent = "Please enter your current password.";
      return;
    }
    if (newPw.length < 4) {
      msg.textContent = "Use a new password of at least 4 characters.";
      return;
    }

    try {
      var res = await apiFetch("/api/settings/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: oldPw, newPassword: newPw })
      });
      msg.textContent = res.message || "Password updated.";
      document.getElementById("s-old").value = "";
      document.getElementById("s-new").value = "";
    } catch (e) {
      msg.textContent = e.message;
    }
  });

  document.getElementById("s-backup").addEventListener("click", async function () {
    try {
      var data = await apiFetch("/api/backup");
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ledger-backup.json";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      alert("Could not create backup: " + e.message);
    }
  });

  document.getElementById("s-restore").addEventListener("change", async function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var msg = document.getElementById("s-restore-msg");
    msg.textContent = "";

    try {
      var text = await file.text();
      var data = JSON.parse(text);
      await apiFetch("/api/backup/restore", {
        method: "POST",
        body: JSON.stringify(data)
      });
      await refreshRemote();
      render();
    } catch (err) {
      msg.textContent = err.message || "That file is not a valid backup.";
    }
  });
}

/* -------------------------------- Help ------------------------------ */

function renderHelp() {
  var faqs = [
    {
      q: "Where are my entries saved?",
      a: "Everything is stored in your private MySQL database and is protected by your account."
    },
    {
      q: "How do streaks work?",
      a: "Write on consecutive days and the streak grows. Miss a day and it starts again from one."
    },
    {
      q: "What does marking an entry as private do?",
      a: "A private entry stays hidden until you type your account password to unlock it."
    },
    {
      q: "Can I save an entry outside the app?",
      a: "Open any entry and use Export as PDF or Export as image."
    },
    {
      q: "How do I move my diary to another computer?",
      a: "In Settings, download a backup file, then use Restore from file on the other computer."
    },
    {
      q: "Can I change how the app looks?",
      a: "Settings has three looks: light paper, dark ink and vintage."
    }
  ];

  var html = pageHead("Help centre", "Short answers to common questions.") + '<div class="card">';
  for (var i = 0; i < faqs.length; i++) {
    html +=
      '<details class="faq"><summary>' + escapeHtml(faqs[i].q) + "</summary><p>" +
      escapeHtml(faqs[i].a) + "</p></details>";
  }
  view.innerHTML = html + "</div>";
}

/* ------------------------------- Start ------------------------------ */

bootstrap();
