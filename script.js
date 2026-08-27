/* ══════════════════════════════════════════════
   Undangan Lamaran — Imam & Mia · 27.09.2026
   ══════════════════════════════════════════════ */
const CONFIG = {
  couple: 'Imam & Mia',
  start: '2026-09-27T13:00:00+07:00',
  end:   '2026-09-27T17:00:00+07:00',
  address: "Mia's House, Jl. Pepaya 4 No. 9, Pondok Makmur, Rt.005/Rw.007, Kutabaru, Pasarkemis, Tangerang",
  mapsUrl: "https://maps.google.com/?q=Mia's+House,+Pasarkemis,+Tangerang",
  musicPath: 'assets/custom-music.mp3', // Ganti lokasi lagu kustom di sini
  fallbackGuest: 'Tamu Undangan'
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ── Toast ───────────────────────────────── */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ── 1. Nama tamu dinamis (?to=Nama) ─────── */
function readGuest() {
  const p = new URLSearchParams(location.search);
  let raw = p.get('to') ?? p.get('kepada') ?? p.get('nama') ?? p.get('guest') ?? '';
  raw = raw.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!raw) return CONFIG.fallbackGuest;
  raw = raw.replace(/[<>{}[\]\\^~`|]/g, '').slice(0, 70);
  return raw || CONFIG.fallbackGuest;
}
const GUEST = readGuest();
$('#guestName').textContent = GUEST;
if (GUEST !== CONFIG.fallbackGuest) {
  document.title = `${GUEST} — Undangan Lamaran Imam & Mia`;
}

/* ── 2. Buka undangan ────────────────────── */
const cover = $('#cover');
const main = $('#main');
const bgm = $('#bgm');
const fab = $('#musicFab');
let opened = false;

// Pastikan audio memuat musik kustom dari CONFIG jika diatur
if (CONFIG.musicPath && bgm.getAttribute('src') !== CONFIG.musicPath) {
  bgm.src = CONFIG.musicPath;
}

function openInvitation() {
  if (opened) return;
  opened = true;
  cover.classList.add('is-open');
  document.body.classList.remove('locked');
  main.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => main.classList.add('is-live'));
  fab.hidden = false;
  playMusic();
  setTimeout(() => {
    cover.remove();
    window.scrollTo({ top: 0 });
    revealScan();
  }, 950);
}
$('#openBtn').addEventListener('click', openInvitation);

/* ── 3. Musik latar ──────────────────────── */
function syncFab() { fab.classList.toggle('playing', !bgm.paused); }
function playMusic() {
  bgm.volume = 0;
  const p = bgm.play();
  const fadeIn = () => {
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(0.55, v + 0.04);
      bgm.volume = v;
      if (v >= 0.55) clearInterval(id);
    }, 90);
  };
  if (p && p.catch) {
    p.then(() => { fadeIn(); syncFab(); })
     .catch(() => { bgm.volume = 0.55; syncFab(); toast('Ketuk ikon musik untuk memutar lagu'); });
  } else { fadeIn(); syncFab(); }
}
fab.addEventListener('click', () => {
  if (bgm.paused) { bgm.volume = 0.55; bgm.play().catch(() => {}); }
  else bgm.pause();
  setTimeout(syncFab, 60);
});
bgm.addEventListener('play', syncFab);
bgm.addEventListener('pause', syncFab);

/* ── 4. Countdown ────────────────────────── */
const target = new Date(CONFIG.start).getTime();
const pad = n => String(n).padStart(2, '0');
function tick() {
  const diff = target - Date.now();
  if (diff <= 0) {
    $('#cdGrid').innerHTML =
      '<p style="grid-column:1/-1;margin:6px 0;font-family:var(--font-serif);' +
      'font-size:17px;color:var(--gold-soft)">Hari bahagia telah tiba. Terima kasih atas doanya.</p>';
    clearInterval(cdTimer);
    return;
  }
  const s = Math.floor(diff / 1000);
  $('#cdD').textContent = pad(Math.floor(s / 86400));
  $('#cdH').textContent = pad(Math.floor(s / 3600) % 24);
  $('#cdM').textContent = pad(Math.floor(s / 60) % 60);
  $('#cdS').textContent = pad(s % 60);
}
tick();
const cdTimer = setInterval(tick, 1000);

/* ── 5. Add to Calendar ──────────────────── */
const utc = iso => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
const CAL_TITLE = `Lamaran ${CONFIG.couple}`;
const CAL_DESC = `Undangan lamaran ${CONFIG.couple} — Minggu, 27 September 2026, 13.00 - selesai.`;
$('#gcal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  + `&text=${encodeURIComponent(CAL_TITLE)}`
  + `&dates=${utc(CONFIG.start)}/${utc(CONFIG.end)}`
  + `&details=${encodeURIComponent(CAL_DESC)}`
  + `&location=${encodeURIComponent(CONFIG.address)}`;

const ics = [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Undangan Imam & Mia//ID',
  'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
  `UID:lamaran-imam-mia-${Date.now()}@undangan`,
  `DTSTAMP:${utc(new Date().toISOString())}`,
  `DTSTART:${utc(CONFIG.start)}`, `DTEND:${utc(CONFIG.end)}`,
  `SUMMARY:${CAL_TITLE}`, `DESCRIPTION:${CAL_DESC}`,
  `LOCATION:${CONFIG.address.replace(/,/g, '\\,')}`,
  'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY',
  `DESCRIPTION:Besok lamaran ${CONFIG.couple}`, 'END:VALARM',
  'END:VEVENT', 'END:VCALENDAR'
].join('\r\n');
$('#ical').href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
$('#ical').addEventListener('click', () => toast('Berkas kalender diunduh'));

/* ── 6. Salin alamat ─────────────────────── */
$('#copyAddr').addEventListener('click', async () => {
  const text = CONFIG.address;
  try {
    await navigator.clipboard.writeText(text);
    toast('Alamat disalin — siap ditempel di Gojek/Grab');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Alamat disalin'); }
    catch { toast('Salin manual: ' + text); }
    ta.remove();
  }
});

/* ── 7. Scroll reveal ────────────────────── */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

function revealScan() {
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    io.observe(el);
  });
}
revealScan();

/* ── 8. Partikel hati & kilau ────────────── */
(function sparkles() {
  const c = $('#sparkles');
  if (!c || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = c.getContext('2d');
  let w, h, dots = [];
  const DPR = Math.min(devicePixelRatio || 1, 2);

  function size() {
    w = c.width = innerWidth * DPR;
    h = c.height = innerHeight * DPR;
    c.style.width = innerWidth + 'px';
    c.style.height = innerHeight + 'px';
    const n = innerWidth < 500 ? 20 : 34;
    dots = Array.from({ length: n }, mk);
  }
  function mk() {
    return {
      x: Math.random() * w, y: Math.random() * h,
      r: (Math.random() * 2.6 + 1.1) * DPR,
      vy: -(Math.random() * 0.22 + 0.07) * DPR,
      vx: (Math.random() - 0.5) * 0.14 * DPR,
      a: Math.random() * 0.5 + 0.18,
      ph: Math.random() * Math.PI * 2,
      heart: Math.random() < 0.32
    };
  }
  function heart(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.75);
    ctx.bezierCurveTo(x - s * 1.5, y - s * 0.5, x - s * 0.5, y - s * 1.5, x, y - s * 0.55);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.5, x + s * 1.5, y - s * 0.5, x, y + s * 0.75);
    ctx.fill();
  }
  let t = 0;
  function frame() {
    ctx.clearRect(0, 0, w, h);
    t += 0.016;
    dots.forEach(d => {
      d.y += d.vy; d.x += d.vx + Math.sin(t + d.ph) * 0.13 * DPR;
      if (d.y < -20) { d.y = h + 12; d.x = Math.random() * w; }
      const tw = d.a * (0.62 + 0.38 * Math.sin(t * 1.7 + d.ph));
      if (d.heart) {
        ctx.fillStyle = `rgba(242,160,168,${tw})`;
        heart(d.x, d.y, d.r * 1.5);
      } else {
        ctx.fillStyle = `rgba(250,235,196,${tw})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.65, 0, 6.284); ctx.fill();
      }
    });
    requestAnimationFrame(frame);
  }
  size();
  addEventListener('resize', size, { passive: true });
  frame();
})();