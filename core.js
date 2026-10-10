/* =========================================================
   EDIT EVERYTHING HERE — names, dates, venues, family, song
   ========================================================= */
const CONFIG = {
  groom: "Prasanna",
  bride: "Shivani",
  weddingDate: "2026-12-23T10:30:00+05:30", // Muhurtham (IST) — used by countdown
  city: "Karnataka, India",
  groomParents: "Smt. ______ & Sri ______",
  groomFamily: "Groom's family, Hometown",
  brideParents: "Smt. ______ & Sri ______",
  brideFamily: "Bride's family, Hometown",
  venueName: "Venue Name",
  venueAddress: "Venue address, City, Karnataka",
  mapQuery: "Bengaluru, Karnataka",          // text Google Maps will search
  whatsapp: "",                               // e.g. "919876543210" — wishes go here; blank = wishes stay on page
  song: "assets/song.mp3",                    // path from site root; if missing, built-in raga music plays
  story: [
    { when: "Chapter One", title: "Two Paths", text: "Two souls, two stories, quietly moving toward the same destiny.", icon: "✦" },
    { when: "Chapter Two", title: "The First Hello", text: "A simple conversation that turned into a thousand more.", icon: "❀" },
    { when: "Chapter Three", title: "Families Unite", text: "With the blessings of elders, two families became one.", icon: "✿" },
    { when: "23 · 12 · 2026", title: "Forever Begins", text: "And so, our journey begins — with you by our side.", icon: "♥" },
  ],
  events: [
    { icon: "🌼", date: "December 21, 2026 · Monday", title: "Haldi Ceremony", desc: "Where traditions shine in shades of yellow and love", dress: "Yellow", time: "10:00 AM onwards", place: "Bride's Residence" },
    { icon: "🌿", date: "December 21, 2026 · Monday", title: "Mehendi", desc: "Beautiful stories written in henna", dress: "Green", time: "4:00 PM onwards", place: "Bride's Residence" },
    { icon: "🎶", date: "December 22, 2026 · Tuesday", title: "Sangeet Night", desc: "An evening set to the rhythm of joy & music", time: "6:30 PM onwards", place: "Venue Name, City" },
    { icon: "🪔", date: "December 23, 2026 · Wednesday", title: "Muhurtham", desc: "A sacred bond and divine celebration for a lifetime of love", time: "10:30 AM", place: "Venue Name, City", main: true },
    { icon: "✨", date: "December 23, 2026 · Wednesday", title: "Reception", desc: "Dinner, blessings and celebrations with our loved ones", time: "7:00 PM onwards", place: "Venue Name, City" },
  ],
  showSwitcher: true,                         // floating "Design 1 / 2 / 3" pill — set false once a design is chosen
};

/* ===== shared helpers (used by all three designs) ===== */
const CORE_BASE = new URL(".", document.currentScript.src).href; // site root
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const isMobile = matchMedia("(max-width: 768px)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const mapsLink = (q) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);

function calendarUrl() {
  const start = new Date(CONFIG.weddingDate);
  const end = new Date(start.getTime() + 3 * 36e5);
  const f = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return "https://calendar.google.com/calendar/render?action=TEMPLATE"
    + "&text=" + encodeURIComponent(`${CONFIG.groom} & ${CONFIG.bride} — Wedding`)
    + "&dates=" + f(start) + "/" + f(end)
    + "&details=" + encodeURIComponent("With the blessings of our families, we invite you to celebrate our wedding. " + location.href)
    + "&location=" + encodeURIComponent(`${CONFIG.venueName}, ${CONFIG.venueAddress}`);
}

// calls cb({d,h,m,s,done}) every second
function countdown(cb) {
  const target = new Date(CONFIG.weddingDate).getTime();
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    const done = diff === 0;
    const d = Math.floor(diff / 864e5); diff %= 864e5;
    const h = Math.floor(diff / 36e5); diff %= 36e5;
    const m = Math.floor(diff / 6e4); diff %= 6e4;
    cb({ d: pad(d), h: pad(h), m: pad(m), s: pad(Math.floor(diff / 1e3)), done });
  };
  tick(); setInterval(tick, 1000);
}

function sendWish(name, msg) {
  if (!CONFIG.whatsapp) return;
  const text = `💐 Blessings for ${CONFIG.groom} & ${CONFIG.bride}\n\n${msg}\n\n— ${name}`;
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

// floating design switcher so the couple can compare /1 – /5
function designSwitcher(current) {
  if (!CONFIG.showSwitcher) return;
  const nav = document.createElement("div");
  nav.setAttribute("style", "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:999;display:flex;gap:2px;padding:4px;align-items:center;border-radius:999px;background:rgba(20,20,20,.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font:500 12px/1 system-ui,sans-serif;letter-spacing:.04em;box-shadow:0 6px 20px rgba(0,0,0,.25)");
  nav.innerHTML = `<span style="padding:8px 6px 8px 10px;color:#bbb">Design</span>` + [1, 2, 3, 4, 5].map((n) => `<a href="${CORE_BASE}${n}/" style="width:30px;height:30px;display:grid;place-items:center;border-radius:50%;text-decoration:none;color:${n === current ? "#111" : "#eee"};background:${n === current ? "#fff" : "transparent"}">${n}</a>`).join("");
  document.body.appendChild(nav);
}

/* =========================================================
   MUSIC — mp3 if present, else a generated Raga Mohanam
   (veena-like plucks over a tanpura drone)
   ========================================================= */
const Music = {
  ctx: null, master: null, audio: null, mode: null, playing: false, timer: null,

  ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      // simple generated reverb
      const len = this.ctx.sampleRate * 3;
      const ir = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      this.verb = this.ctx.createConvolver();
      this.verb.buffer = ir;
      const wet = this.ctx.createGain(); wet.gain.value = 0.55;
      this.bus = this.ctx.createGain();
      this.bus.connect(this.master);
      this.bus.connect(this.verb); this.verb.connect(wet); wet.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },

  bell(freq = 520, gain = 0.12) {
    const ctx = this.ensureCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.playing ? 0.5 : 0.6, t, 0.05);
    [1, 2.76, 5.4, 8.93].forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq * m;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain / (i + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5 / (i * 0.6 + 1));
      o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 5);
    });
  },

  pluck(f, t, dur, vol = 0.16) {
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    const g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o1.type = "triangle"; o1.frequency.value = f;
    o2.type = "sine"; o2.frequency.value = f * 2.003;
    // slight gamaka (pitch bend) for an Indian feel
    if (Math.random() < 0.3) {
      o1.frequency.setValueAtTime(f * 0.97, t);
      o1.frequency.exponentialRampToValueAtTime(f, t + 0.12);
    }
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    lp.type = "lowpass"; lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.2);
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(this.bus);
    o1.start(t); o2.start(t); o1.stop(t + dur + 1.3); o2.stop(t + dur + 1.3);
  },

  drone(f, t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = "sawtooth"; o.frequency.value = f;
    lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 3;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(lp); lp.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t + 3.3);
  },

  startSynth() {
    const ctx = this.ensureCtx(); if (!ctx) return;
    this.mode = "synth";
    const SA = 261.63, beat = 0.52;
    const ratios = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3]; // Mohanam: S R2 G3 P D2
    const notes = [];
    for (let oct = 0; oct < 2; oct++) ratios.forEach((r) => notes.push(SA * r * Math.pow(2, oct)));
    notes.push(SA * 4);
    let idx = 5, next = ctx.currentTime + 0.3, droneNext = ctx.currentTime + 0.1, dStep = 0, phrase = 0;
    const tanpura = [SA * 0.75, SA, SA, SA / 2];

    const tick = () => {
      if (!this.playing) return;
      const horizon = ctx.currentTime + 0.4;
      while (droneNext < horizon) {
        this.drone(tanpura[dStep % 4], droneNext);
        dStep++; droneNext += beat * 1.5;
      }
      while (next < horizon) {
        phrase++;
        if (phrase % 9 === 0) { next += beat * 2; continue; } // breathe
        const step = [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)];
        idx = Math.max(0, Math.min(notes.length - 1, idx + step));
        if (phrase % 9 === 8) idx = [0, 5, 3][Math.floor(Math.random() * 3)]; // resolve on Sa/Pa
        const len = [1, 1, 0.5, 0.5, 2, 1.5][Math.floor(Math.random() * 6)];
        this.pluck(notes[idx], next, len * beat);
        if (len >= 1.5 && Math.random() < 0.5) this.pluck(notes[idx] / 2, next, len * beat, 0.07);
        next += len * beat;
      }
    };
    this.timer = setInterval(tick, 100);
    tick();
  },

  start() {
    this.ensureCtx(); // must happen inside the click gesture
    this.playing = true;
    this.setUI();
    const fadeIn = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0.5, t, 1.2);
    };
    if (this.mode === "file") { this.audio.play().catch(() => {}); return; }
    if (this.mode === "synth") { this.ctx.resume(); fadeIn(); if (!this.timer) this.startSynth(); return; }

    if (!CONFIG.song) { fadeIn(); this.startSynth(); return; }
    this.audio = new Audio();
    this.audio.loop = true; this.audio.volume = 0; this.audio.preload = "auto";
    let fellBack = false;
    const fallback = () => { if (fellBack || this.mode === "file") return; fellBack = true; fadeIn(); this.startSynth(); };
    this.audio.addEventListener("error", fallback, { once: true });
    this.audio.src = new URL(CONFIG.song, CORE_BASE).href;
    this.audio.play().then(() => {
      this.mode = "file";
      let v = 0; const iv = setInterval(() => { v = Math.min(0.7, v + 0.05); this.audio.volume = v; if (v >= 0.7) clearInterval(iv); }, 120);
    }).catch(fallback);
  },

  stop() {
    this.playing = false;
    this.setUI();
    if (this.mode === "file") this.audio.pause();
    if (this.mode === "synth") {
      clearInterval(this.timer); this.timer = null;
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0, t, 0.3);
    }
  },

  toggle() { this.playing ? this.stop() : this.start(); },
  setUI() { $("#musicBtn")?.classList.toggle("playing", this.playing); },
};

