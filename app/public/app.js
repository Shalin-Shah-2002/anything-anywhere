/* ============================================================
   Gymtime Attendance Portal — front-end
   ============================================================ */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const api = async (path, body) => {
    const res = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      throw new Error('The server returned an unexpected response.');
    }
    if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };

  const STORE_KEY = 'gymtime.session.v1';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ---------- date helpers (local, date-only) ----------
  const toKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseKey = (k) => {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const dayDiff = (a, b) => Math.round((stripTime(a) - stripTime(b)) / 86400000);
  const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const sameDay = (a, b) => toKey(a) === toKey(b);

  function relativeLabel(d) {
    const diff = dayDiff(new Date(), d);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 14) return 'Last week';
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    if (diff < 60) return 'Last month';
    if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
    return `${Math.floor(diff / 365)}y ago`;
  }

  // ---------- stats ----------
  function computeStats(keys) {
    const set = new Set(keys);
    const dates = [...set].sort();
    const total = dates.length;
    const today = stripTime(new Date());

    // streaks
    let longest = 0;
    let run = 0;
    let prev = null;
    for (const k of dates) {
      const d = parseKey(k);
      if (prev && dayDiff(d, prev) === 1) run += 1;
      else run = 1;
      if (run > longest) longest = run;
      prev = d;
    }

    // current streak — counts back from today/yesterday
    let current = 0;
    if (dates.length) {
      const last = parseKey(dates[dates.length - 1]);
      const gap = dayDiff(today, last);
      if (gap <= 1) {
        current = 1;
        let cursor = last;
        for (let i = dates.length - 2; i >= 0; i--) {
          const d = parseKey(dates[i]);
          if (dayDiff(cursor, d) === 1) {
            current += 1;
            cursor = d;
          } else break;
        }
      }
    }

    const now = new Date();
    const thisMonth = dates.filter((k) => {
      const d = parseKey(k);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const lastKey = dates[dates.length - 1] || null;

    // monthly counts for last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = dates.filter((k) => {
        const d = parseKey(k);
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
      }).length;
      months.push({ label: MONTHS[m.getMonth()], count });
    }

    return { set, dates, total, longest, current, thisMonth, lastKey, months };
  }

  // ---------- heatmap ----------
  function buildHeatmap(stats) {
    const wrap = $('#heatmap');
    wrap.innerHTML = '';
    const today = stripTime(new Date());
    // find max per-week presence to scale (binary per day, but fill levels add depth)
    // We render ~53 weeks ending this week. Column = week, row = day (Sun..Sat).
    const WEEKS = 53;
    const end = addDays(today, 6 - today.getDay()); // end of current week (Sat)
    const start = addDays(end, -(WEEKS * 7 - 1)); // inclusive start (Sun)

    // precompute rolling density for level (how active the surrounding week is)
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = addDays(start, i);
      const key = toKey(d);
      const on = stats.set.has(key);
      const future = d > today;
      const cell = el('div', 'hcell');
      if (future) {
        cell.classList.add('empty');
      } else if (on) {
        // level from how many visits in the Mon-anchored week window
        let lvl = 3;
        const weekStart = addDays(d, -d.getDay());
        let wc = 0;
        for (let j = 0; j < 7; j++) if (stats.set.has(toKey(addDays(weekStart, j)))) wc++;
        lvl = wc >= 5 ? 4 : wc >= 3 ? 3 : wc >= 2 ? 2 : 1;
        cell.dataset.lvl = String(lvl);
        cell.dataset.on = '1';
      } else {
        cell.dataset.lvl = '0';
      }
      cell.dataset.key = key;
      cell.dataset.on2 = on ? '1' : '0';
      wrap.appendChild(cell);
    }
    wireHeatTips();
  }

  function wireHeatTips() {
    const tip = $('#heatTip');
    const map = $('#heatmap');
    map.onmouseover = (e) => {
      const cell = e.target.closest('.hcell');
      if (!cell || cell.classList.contains('empty')) return;
      const d = parseKey(cell.dataset.key);
      const on = cell.dataset.on2 === '1';
      tip.textContent = `${on ? '✓ Checked in' : 'No check-in'} · ${DOW[d.getDay()]} ${d.getDate()} ${
        MONTHS[d.getMonth()]
      } ${d.getFullYear()}`;
      tip.hidden = false;
    };
    map.onmousemove = (e) => {
      tip.style.left = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 10) + 'px';
      tip.style.top = e.clientY + 16 + 'px';
    };
    map.onmouseleave = () => (tip.hidden = true);
  }

  // ---------- calendar ----------
  let calCursor = new Date();
  function renderCalendar(stats) {
    const grid = $('#calendar');
    const label = $('#calLabel');
    grid.innerHTML = '';
    const y = calCursor.getFullYear();
    const m = calCursor.getMonth();
    label.textContent = `${MONTHS_FULL[m]} ${y}`;
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < startPad; i++) grid.appendChild(el('div', 'cday blank'));
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      const key = toKey(d);
      const cell = el('div', 'cday', String(day));
      if (stats.set.has(key)) cell.classList.add('on');
      if (sameDay(d, today)) cell.classList.add('today');
      cell.title = stats.set.has(key) ? 'Checked in' : '';
      grid.appendChild(cell);
    }
  }

  // ---------- recent list ----------
  function renderRecent(stats) {
    const list = $('#recent');
    const pill = $('#recentPill');
    list.innerHTML = '';
    const recent = [...stats.dates].reverse().slice(0, 12);
    pill.textContent = `${stats.total} total`;
    if (!recent.length) {
      list.appendChild(el('div', 'empty-state', 'No biometric check-ins recorded yet.'));
      return;
    }
    for (const k of recent) {
      const d = parseKey(k);
      const li = el('li');
      const day = el('div', 'r-day', `<b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span>`);
      const main = el(
        'div',
        'r-main',
        `<b>${DOW[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</b><span>Biometric check-in</span>`,
      );
      const rel = el('span', 'r-rel', relativeLabel(d));
      li.append(day, main, rel);
      list.appendChild(li);
    }
    // fade the bottom edge only when the list actually scrolls
    requestAnimationFrame(() => {
      list.classList.toggle('scrolls', list.scrollHeight > list.clientHeight + 2);
    });
  }

  // ---------- bars ----------
  function renderBars(stats) {
    const wrap = $('#bars');
    wrap.innerHTML = '';
    const max = Math.max(1, ...stats.months.map((m) => m.count));
    for (const m of stats.months) {
      const bar = el('div', 'bar');
      const pct = Math.round((m.count / max) * 100);
      const col = el('div', 'col');
      col.style.height = '4px';
      if (m.count === 0) col.dataset.zero = '1';
      bar.append(el('span', 'bv', String(m.count)), col, el('span', 'bl', m.label));
      wrap.appendChild(bar);
      // animate after insert
      requestAnimationFrame(() => {
        col.style.height = Math.max(4, pct) + '%';
      });
    }
  }

  // ---------- profile ----------
  function initials(name) {
    if (!name) return 'M';
    const parts = String(name).trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'M';
  }
  function fmtDOB(dob) {
    if (!dob) return '';
    const d = new Date(dob);
    if (isNaN(d)) return dob;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function renderProfile(session) {
    const m = session.member || {};
    const b = session.branch || {};
    const name = m.Name || 'Member';
    const memberId = session.memberId || m.MemberID || m.Member_ID || '—';

    $('#userName').textContent = name;
    $('#userId').textContent = `#${memberId}`;
    $('#avatar').textContent = initials(name);
    $('#heroAvatar').textContent = initials(name);
    $('#heroName').textContent = name;

    const gymName = b.Name || session.gym || 'Gymtime';
    const branchName = b.Branch || session.branch || 'Member Attendance';
    $('#gymName').textContent = gymName;
    $('#branchName').textContent = branchName;

    const metaBits = [];
    if (m.Occupation) metaBits.push(m.Occupation);
    if (b.Branch) metaBits.push(b.Branch);
    $('#heroMeta').textContent = metaBits.join(' · ') || `Member #${memberId}`;

    const chips = $('#heroChips');
    chips.innerHTML = '';
    const addChip = (icon, text) => {
      if (!text) return;
      chips.appendChild(el('span', 'chip', `${icon}<span>${escapeHtml(text)}</span>`));
    };
    addChip(ICON.id, `ID ${memberId}`);
    addChip(ICON.mail, m.Email);
    addChip(ICON.cake, fmtDOB(m.DOB));
    addChip(ICON.pin, m.Address || b.Address);
  }

  const ICON = {
    id: '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4Zm2 2v10h12V7Zm2 2h4v2H8Zm0 4h8v1H8Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4Zm2 2 6 4 6-4"/></svg>',
    cake: '<svg viewBox="0 0 24 24"><path d="M12 3a1 1 0 0 1 1 1v2h-2V4a1 1 0 0 1 1-1ZM6 9h12v4H6Zm-2 6h16v5H4Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 2a6 6 0 0 1 6 6c0 4-6 12-6 12S6 12 6 8a6 6 0 0 1 6-6Zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg>',
  };
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- render dashboard ----------
  function renderDashboard(session) {
    renderProfile(session);
    const stats = computeStats(session.dates || []);

    animateCount($('#totalVisits'), stats.total);
    animateCount($('#currentStreak'), stats.current);
    animateCount($('#longestStreak'), stats.longest);
    animateCount($('#thisMonth'), stats.thisMonth);
    $('#thisMonthName').textContent = MONTHS_FULL[new Date().getMonth()];
    $('#currentStreakSub').textContent = stats.current === 1 ? 'day' : 'days';

    if (stats.lastKey) {
      const d = parseKey(stats.lastKey);
      $('#lastVisit').textContent = relativeLabel(d);
      $('#lastVisitDate').textContent = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    } else {
      $('#lastVisit').textContent = '—';
    }

    $('#heatmapSub').textContent = stats.total
      ? `${stats.total} check-ins over the last year`
      : 'No check-ins recorded yet';

    buildHeatmap(stats);
    calCursor = new Date();
    renderCalendar(stats);
    renderRecent(stats);
    renderBars(stats);

    // wire calendar nav
    $('#calPrev').onclick = () => {
      calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1);
      renderCalendar(stats);
    };
    $('#calNext').onclick = () => {
      calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1);
      renderCalendar(stats);
    };
  }

  function animateCount(node, target) {
    const dur = 650;
    const start = performance.now();
    const from = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(step);
      else node.textContent = String(target);
    };
    requestAnimationFrame(step);
  }

  // ---------- view switching ----------
  function showView(name) {
    document.documentElement.dataset.view = name;
    $('#loginView').hidden = name !== 'login';
    $('#dashboardView').hidden = name !== 'dashboard';
    window.scrollTo(0, 0);
  }

  // ---------- session persistence ----------
  function saveSession(s) {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch {}
  }
  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
    } catch {
      return null;
    }
  }
  function clearSession() {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {}
  }

  // ---------- login flow ----------
  async function doLogin(e) {
    e.preventDefault();
    const btn = $('#loginBtn');
    const errBox = $('#loginError');
    errBox.hidden = true;
    const uniqueId = $('#uniqueId').value.trim();
    const companyCode = $('#companyCode').value.trim();
    const mobile = $('#mobile').value.trim();

    if (!companyCode || !mobile) {
      errBox.textContent = 'Please enter your company code and mobile number.';
      errBox.hidden = false;
      return;
    }

    btn.classList.add('is-loading');
    btn.disabled = true;
    try {
      const session = await api('/api/session', { uniqueId, companyCode, mobile });
      $('#overlay').hidden = false;
      $('#overlayText').textContent = 'Loading your attendance…';
      const att = await api('/api/attendance', {
        server: session.server,
        compId: session.compId,
        memberId: session.memberId,
      });
      const full = { ...session, dates: att.dates || [] };
      saveSession(full);
      $('#overlay').hidden = true;
      showView('dashboard');
      renderDashboard(full);
    } catch (err) {
      $('#overlay').hidden = true;
      errBox.textContent = err.message || 'Something went wrong. Please try again.';
      errBox.hidden = false;
    } finally {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  }

  function doLogout() {
    clearSession();
    $('#loginForm').reset();
    prefillDefaults();
    showView('login');
  }

  // ---------- defaults ----------
  async function prefillDefaults() {
    try {
      const d = await api('/api/defaults');
      if (d.uniqueId && !$('#uniqueId').value) $('#uniqueId').value = d.uniqueId;
      if (d.companyCode && !$('#companyCode').value) $('#companyCode').value = d.companyCode;
      if (d.mobile && !$('#mobile').value) $('#mobile').value = d.mobile;
    } catch {}
  }

  // ---------- boot ----------
  function boot() {
    $('#loginForm').addEventListener('submit', doLogin);
    $('#logoutBtn').addEventListener('click', doLogout);

    const existing = loadSession();
    if (existing && existing.memberId) {
      showView('dashboard');
      renderDashboard(existing);
      // refresh attendance quietly in the background
      api('/api/attendance', {
        server: existing.server,
        compId: existing.compId,
        memberId: existing.memberId,
      })
        .then((att) => {
          const full = { ...existing, dates: att.dates || existing.dates };
          saveSession(full);
          renderDashboard(full);
        })
        .catch(() => {});
    } else {
      showView('login');
      prefillDefaults();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
