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
  song: "assets/song.mp3",                    // drop an mp3 here; if missing, built-in raga music plays
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
};

/* ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const hasGSAP = !!window.gsap;
const isMobile = matchMedia("(max-width: 768px)").matches;
const slide = isMobile ? 24 : 80;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const mapsLink = (q) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);

/* ---------- render config ---------- */
function render() {
  $$("[data-cfg]").forEach((el) => (el.textContent = CONFIG[el.dataset.cfg] || ""));
  $("#storyList").innerHTML = CONFIG.story.map((s) => `
    <div class="tl-item">
      <span class="tl-dot">${esc(s.icon)}</span>
      <p class="tl-when">${esc(s.when)}</p>
      <h4 class="tl-title">${esc(s.title)}</h4>
      <p class="tl-text">${esc(s.text)}</p>
    </div>`).join("");
  $("#eventList").innerHTML = CONFIG.events.map((e) => `
    <article class="event${e.main ? " main" : ""}">
      <div class="ev-icon">${esc(e.icon)}</div>
      <p class="ev-date">${esc(e.date)}</p>
      <h4 class="ev-title">${esc(e.title)}</h4>
      <p class="ev-desc">${esc(e.desc)}</p>
      ${e.dress ? `<span class="ev-dress">Dress code · ${esc(e.dress)}</span>` : ""}
      <div class="ev-meta">
        <p>🕒 ${esc(e.time)}</p>
        <p>📍 ${esc(e.place)}</p>
      </div>
      <a class="btn ${e.main ? "gold" : "ghost"}" href="${mapsLink(e.place)}" target="_blank" rel="noopener">Directions 🗺️</a>
    </article>`).join("");
  $("#mapBtn").href = mapsLink(CONFIG.mapQuery);
  $("#mapFrame").src = "https://maps.google.com/maps?q=" + encodeURIComponent(CONFIG.mapQuery) + "&z=14&output=embed";
}

/* ---------- split text into chars ---------- */
function splitChars() {
  $$(".split").forEach((el) => {
    el.innerHTML = [...el.textContent].map((c) => `<span class="ch">${c === " " ? "&nbsp;" : c}</span>`).join("");
  });
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
    this.audio.src = CONFIG.song;
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
  setUI() { $("#musicBtn").classList.toggle("playing", this.playing); },
};

/* =========================================================
   3D PETALS + GOLD DUST (three.js)
   ========================================================= */
const Petals = {
  init() {
    if (!window.THREE || reduced) return;
    const canvas = $("#petals");
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); }
    catch (e) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 20;

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dl = new THREE.DirectionalLight(0xfff1d0, 0.7); dl.position.set(3, 6, 8); scene.add(dl);

    // curved petal geometry
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(0.5, -0.3, 0.42, 0.35, 0, 0.55);
    s.bezierCurveTo(-0.42, 0.35, -0.5, -0.3, 0, -0.5);
    const geo = new THREE.ShapeGeometry(s, 10);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      p.setZ(i, x * x * 0.9 + y * y * 0.2);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.55, metalness: 0.05 });

    const N = isMobile ? 55 : 110;
    const mesh = new THREE.InstancedMesh(geo, mat, N);
    const palette = [0xe8766e, 0xf19a8f, 0xf6b24a, 0xf08a24, 0xfff6e6, 0xfbe3e0, 0xd94e4e, 0xffd27a];
    const col = new THREE.Color();
    const dummy = new THREE.Object3D();
    const P = [];
    let halfH = 0, halfW = 0;

    const size = () => {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      halfW = halfH * camera.aspect;
    };
    size();
    addEventListener("resize", size);

    const spawn = (o, top) => {
      o.x = (Math.random() * 2 - 1) * (halfW + 2);
      o.y = top ? halfH + 1 + Math.random() * 4 : (Math.random() * 2 - 1) * halfH;
      o.z = Math.random() * 10 - 6;
      o.rx = Math.random() * 6; o.ry = Math.random() * 6; o.rz = Math.random() * 6;
      o.vx = (Math.random() - 0.5) * 0.02; o.vy = 0.012 + Math.random() * 0.02;
      o.sr = [(Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.03];
      o.ph = Math.random() * Math.PI * 2;
      o.s = 0.35 + Math.random() * 0.45;
      o.boost = 0;
    };
    for (let i = 0; i < N; i++) {
      const o = {}; spawn(o, false); o.y += halfH * 2; P.push(o); // start off-screen, falls in
      mesh.setColorAt(i, col.setHex(palette[i % palette.length]));
    }
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);

    // gold dust
    const dustN = isMobile ? 120 : 260;
    const dg = new THREE.BufferGeometry();
    const dp = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) { dp[i * 3] = (Math.random() * 2 - 1) * 20; dp[i * 3 + 1] = (Math.random() * 2 - 1) * 12; dp[i * 3 + 2] = Math.random() * 12 - 8; }
    dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    const c2 = document.createElement("canvas"); c2.width = c2.height = 64;
    const x2 = c2.getContext("2d");
    const grd = x2.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,244,200,1)"); grd.addColorStop(0.3, "rgba(245,205,110,.8)"); grd.addColorStop(1, "rgba(245,205,110,0)");
    x2.fillStyle = grd; x2.fillRect(0, 0, 64, 64);
    const dm = new THREE.PointsMaterial({ size: 0.22, map: new THREE.CanvasTexture(c2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
    const dust = new THREE.Points(dg, dm);
    scene.add(dust);

    const mouse = { x: 0, y: 0 };
    addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
    let scrollV = 0, lastY = scrollY;
    addEventListener("scroll", () => { scrollV += (scrollY - lastY) * 0.0015; lastY = scrollY; }, { passive: true });

    this.density = 1;
    this.shower = () => P.forEach((o, i) => { spawn(o, true); o.y += Math.random() * halfH * 2; o.boost = 0.06; });

    let t = 0;
    const loop = () => {
      requestAnimationFrame(loop);
      if (document.hidden) return;
      t += 0.016;
      scrollV *= 0.9;
      for (let i = 0; i < N; i++) {
        const o = P[i];
        o.boost *= 0.985;
        o.y -= o.vy + o.boost + scrollV;
        o.x += o.vx + Math.sin(t * 0.8 + o.ph) * 0.012;
        o.rx += o.sr[0]; o.ry += o.sr[1]; o.rz += o.sr[2];
        if (o.y < -halfH - 2 || o.y > halfH + 8) spawn(o, true);
        dummy.position.set(o.x, o.y, o.z);
        dummy.rotation.set(o.rx, o.ry, o.rz);
        dummy.scale.setScalar(o.s * (i < N * this.density ? 1 : 0));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      dust.rotation.y = t * 0.02;
      dust.position.y = Math.sin(t * 0.3) * 0.5;
      dm.opacity = 0.55 + Math.sin(t * 2) * 0.25;
      camera.position.x += (mouse.x * 2 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 1.5 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    loop();
  },
  shower() {},
};

/* =========================================================
   INTRO / OPEN
   ========================================================= */
function openInvite() {
  const intro = $("#intro");
  if (intro.classList.contains("opening")) return;
  Music.start();
  Music.bell(523, 0.14);
  setTimeout(() => Music.bell(659, 0.08), 380);
  intro.classList.add("opening");
  Petals.shower();
  setTimeout(() => {
    document.body.classList.remove("locked");
    document.body.classList.add("opened");
    heroIn();
  }, 1500);
  setTimeout(() => {
    intro.classList.add("gone");
    if (hasGSAP) gsap.to(intro, { opacity: 0, duration: 1, onComplete: () => intro.remove() });
    else intro.remove();
    Petals.density = isMobile ? 0.6 : 0.55; // calmer after the shower
  }, 2600);
}

/* =========================================================
   GSAP ANIMATIONS
   ========================================================= */
function setupAnimations() {
  if (!hasGSAP) { document.body.classList.add("no-gsap"); return; }
  gsap.registerPlugin(ScrollTrigger);

  // hero initial state (plays on open)
  gsap.set(".hero-names .ch", { yPercent: 110, rotateX: -80, opacity: 0, transformOrigin: "50% 100%" });
  gsap.set(".hero-names .amp", { scale: 0, opacity: 0 });
  gsap.set(".hero .reveal", { y: 30, opacity: 0 });
  gsap.set(".hero-frame", { opacity: 0, scale: 0.85, rotateY: -25 });

  // scroll reveals (skip hero)
  $$(".reveal").filter((el) => !el.closest(".hero")).forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });
  $$(".reveal-left, .reveal-right").forEach((el) => {
    gsap.from(el, { x: el.classList.contains("reveal-left") ? -slide : slide, opacity: 0, rotateY: el.classList.contains("reveal-left") ? 20 : -20, duration: 1.3, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 82%" } });
  });
  $$(".tl-item").forEach((el, i) => {
    gsap.from(el, { x: (i % 2 ? 1 : -1) * Math.min(60, slide), opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    gsap.from(el.querySelector(".tl-dot"), { scale: 0, rotate: 180, duration: 0.8, ease: "back.out(2)", scrollTrigger: { trigger: el, start: "top 85%" } });
  });
  ScrollTrigger.batch(".event", {
    start: "top 88%",
    onEnter: (els) => gsap.from(els, { y: 90, rotateX: 30, opacity: 0, duration: 1.2, stagger: 0.15, ease: "power3.out", transformOrigin: "50% 100%" }),
    once: true,
  });
  gsap.from(".cd-flip", { rotateY: 180, opacity: 0, duration: 1.2, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".cd-grid", start: "top 85%" } });
  gsap.from(".venue-card", { rotateX: 15, scale: 0.94, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".venue-card", start: "top 85%" } });

  // parallax
  gsap.to(".hero-bg", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-frame-wrap", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
}

function heroIn() {
  if (!hasGSAP) return;
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.to(".hero-frame", { opacity: 1, scale: 1, rotateY: 0, duration: 1.8, ease: "expo.out" })
    .to(".hero .kicker, .hero .hero-small", { y: 0, opacity: 1, duration: 0.9, stagger: 0.12 }, 0.2)
    .to(".hero-names .name:first-child .ch", { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.1, stagger: 0.05 }, 0.5)
    .to(".hero-names .amp", { scale: 1, opacity: 1, duration: 0.9, ease: "back.out(2)" }, 0.95)
    .to(".hero-names .name:last-child .ch", { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.1, stagger: 0.05 }, 1.05)
    .to(".hero .divider, .hero .hero-date, .hero .hero-place, .hero .hero-ctas", { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 1.5)
    .add(() => gsap.set(".hero-names .ch, .hero-names .amp", { clearProps: "transform,opacity" }));
}

/* =========================================================
   INTERACTIONS
   ========================================================= */
function setupTilt() {
  if (matchMedia("(hover: none)").matches) return;
  $$(".tilt, .event").forEach((el) => {
    const max = +el.dataset.tilt || 8;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

function setupCountdown() {
  const target = new Date(CONFIG.weddingDate).getTime();
  const els = { d: $("#cdD"), h: $("#cdH"), m: $("#cdM"), s: $("#cdS") };
  const set = (el, v) => { if (el.textContent !== v) { el.textContent = v; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); } };
  const upd = () => {
    let diff = Math.max(0, target - Date.now());
    if (diff === 0) { $("#cdDone").hidden = false; }
    const d = Math.floor(diff / 864e5); diff %= 864e5;
    const h = Math.floor(diff / 36e5); diff %= 36e5;
    const m = Math.floor(diff / 6e4); diff %= 6e4;
    const s = Math.floor(diff / 1e3);
    set(els.d, String(d).padStart(2, "0")); set(els.h, String(h).padStart(2, "0"));
    set(els.m, String(m).padStart(2, "0")); set(els.s, String(s).padStart(2, "0"));
  };
  upd(); setInterval(upd, 1000);
}

function setupCalendar() {
  $("#calBtn").addEventListener("click", () => {
    const start = new Date(CONFIG.weddingDate);
    const end = new Date(start.getTime() + 3 * 36e5);
    const f = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = "https://calendar.google.com/calendar/render?action=TEMPLATE"
      + "&text=" + encodeURIComponent(`${CONFIG.groom} & ${CONFIG.bride} — Wedding`)
      + "&dates=" + f(start) + "/" + f(end)
      + "&details=" + encodeURIComponent("With the blessings of our families, we invite you to celebrate our wedding. " + location.href)
      + "&location=" + encodeURIComponent(`${CONFIG.venueName}, ${CONFIG.venueAddress}`);
    window.open(url, "_blank", "noopener");
  });
}

function setupWishes() {
  const KEY = "ps-wishes";
  const wall = $("#wishWall");
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const draw = () => {
    wall.innerHTML = read().map((w) => `<div class="wish"><p>“${esc(w.msg)}”</p><b>— ${esc(w.name)}</b></div>`).join("");
  };
  draw();
  $("#wishForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#wishName").value.trim(), msg = $("#wishMsg").value.trim();
    if (!name || !msg) return;
    const list = read(); list.unshift({ name, msg });
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20))); } catch {}
    draw();
    burst(innerWidth / 2, innerHeight / 2, 28);
    if (CONFIG.whatsapp) {
      const text = `💐 Blessings for ${CONFIG.groom} & ${CONFIG.bride}\n\n${msg}\n\n— ${name}`;
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    }
    e.target.reset();
  });
  if (!CONFIG.whatsapp) $(".wish-hint").textContent = "Thank you for your love and blessings 🙏";
}

function burst(x, y, n = 12) {
  if (!hasGSAP || reduced) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "spark";
    s.style.left = x + "px"; s.style.top = y + "px";
    document.body.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * (n > 15 ? 160 : 60);
    gsap.to(s, { x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, scale: 0.3, duration: 0.8 + Math.random() * 0.6, ease: "power2.out", onComplete: () => s.remove() });
  }
}

function setupNav() {
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  $("#menuBtn").addEventListener("click", () => nav.classList.toggle("menu-open"));
  $$("#nav nav a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("menu-open")));
  const links = $$("#nav nav a");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => io.observe(s));
}

/* =========================================================
   BOOT
   ========================================================= */
render();
splitChars();
setupAnimations();
setupCountdown();
setupCalendar();
setupWishes();
setupNav();
setupTilt();
Petals.init();

$("#openBtn").addEventListener("click", openInvite);
$("#musicBtn").addEventListener("click", () => Music.toggle());
addEventListener("pointerdown", (e) => { if (document.body.classList.contains("opened")) burst(e.clientX, e.clientY); });

addEventListener("load", () => setTimeout(() => $("#loader").classList.add("done"), 1900));
setTimeout(() => $("#loader").classList.add("done"), 5000); // safety
