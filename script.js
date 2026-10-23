(function () {
  "use strict";

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu");
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Floor tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); selectTab(tabs[(i + 1) % tabs.length]); }
      if (e.key === "ArrowLeft") { e.preventDefault(); selectTab(tabs[(i - 1 + tabs.length) % tabs.length]); }
    });
  });

  /* ---------- Free pastry promo status (Philippine time) ---------- */
  var YEAR = 2026, MONTH = 10;           // November (0-based month)
  var FIRST_DAY = 3, LAST_DAY = 30;      // Nov 3 to Nov 30
  var REDEEM_DOWS = [1, 3, 5];           // Mon, Wed, Fri
  var START_H = 13, START_M = 0;         // 1:00 PM
  var END_H = 15, END_M = 30;            // 3:30 PM
  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build windows as "Manila wall-clock" timestamps stored in UTC fields.
  var windows = [];
  for (var d = FIRST_DAY; d <= LAST_DAY; d++) {
    var dow = new Date(Date.UTC(YEAR, MONTH, d)).getUTCDay();
    if (REDEEM_DOWS.indexOf(dow) !== -1) {
      windows.push({
        start: Date.UTC(YEAR, MONTH, d, START_H, START_M),
        end: Date.UTC(YEAR, MONTH, d, END_H, END_M)
      });
    }
  }

  function manilaNow() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila", hourCycle: "h23",
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    }).formatToParts(new Date());
    var p = {};
    parts.forEach(function (x) { p[x.type] = parseInt(x.value, 10); });
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  }

  function fmtDay(ts) {
    return new Date(ts).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  }

  var el = {
    pill: document.getElementById("status-pill"),
    title: document.getElementById("status-title"),
    detail: document.getElementById("status-detail"),
    count: document.getElementById("countdown"),
    d: document.getElementById("cd-d"),
    h: document.getElementById("cd-h"),
    m: document.getElementById("cd-m"),
    s: document.getElementById("cd-s"),
    week: document.getElementById("week")
  };

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function setCountdown(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    el.d.textContent = Math.floor(total / 86400);
    el.h.textContent = pad(Math.floor((total % 86400) / 3600));
    el.m.textContent = pad(Math.floor((total % 3600) / 60));
    el.s.textContent = pad(total % 60);
  }

  function renderWeek(nowTs) {
    var today = new Date(nowTs).getUTCDay();
    el.week.innerHTML = "";
    [1, 2, 3, 4, 5, 6, 0].forEach(function (dow) {
      var span = document.createElement("span");
      span.className = "day";
      span.setAttribute("role", "listitem");
      span.textContent = DAY_NAMES[dow];
      if (REDEEM_DOWS.indexOf(dow) !== -1) {
        span.classList.add("is-redeem");
        span.title = "Free pastry day";
      }
      if (dow === today) span.classList.add("is-today");
      el.week.appendChild(span);
    });
  }

  function update() {
    var now = manilaNow();
    var active = windows.filter(function (w) { return now >= w.start && now < w.end; })[0];
    var next = windows.filter(function (w) { return w.start > now; })[0];

    el.pill.classList.remove("is-open");
    if (active) {
      el.pill.classList.add("is-open");
      el.pill.textContent = "Open now";
      el.title.textContent = "Free pastry is on right now!";
      el.detail.textContent = "Order any drink and show our promo post at the counter. Time left today:";
      el.count.hidden = false;
      setCountdown(active.end - now);
    } else if (next) {
      var started = windows[0].start <= now;
      el.pill.textContent = started ? "Next redeem day" : "Starts soon";
      el.title.textContent = fmtDay(next.start) + ", 1:00 PM";
      el.detail.textContent = (started ? "The next free pastry window opens in:" : "Our launch promo kicks off in:");
      el.count.hidden = false;
      setCountdown(next.start - now);
    } else {
      el.pill.textContent = "Promo ended";
      el.title.textContent = "Thanks for visiting us!";
      el.detail.textContent = "The launch promo ran until November 30, 2026. Follow us for what’s next.";
      el.count.hidden = true;
    }
    renderWeek(now);
  }

  update();
  setInterval(update, 1000);

  /* ---------- Reminder form (demo only, nothing is sent) ---------- */
  var form = document.getElementById("notify");
  var nameInput = document.getElementById("name");
  var msg = document.getElementById("notify-msg");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.classList.add("invalid");
      msg.textContent = "Please enter your name so we know who to save a seat for.";
      nameInput.focus();
      return;
    }
    nameInput.classList.remove("invalid");
    var day = document.getElementById("day").value;
    msg.textContent = "Thanks, " + name + "! See you on " + day + " from 1:00 to 3:30 PM.";
    form.reset();
  });
  nameInput.addEventListener("input", function () { nameInput.classList.remove("invalid"); });

  /* ---------- Social links: replace with your real page URLs ---------- */
  var SOCIALS = {
    facebook: "",   // e.g. "https://facebook.com/beanthere"
    instagram: ""   // e.g. "https://instagram.com/beanthere"
  };
  document.querySelectorAll("[data-social]").forEach(function (a) {
    var url = SOCIALS[a.dataset.social];
    if (url) { a.href = url; a.target = "_blank"; }
    else { a.addEventListener("click", function (e) { e.preventDefault(); }); }
  });
})();

