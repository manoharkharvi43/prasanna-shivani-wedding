/* Design 1 — Royal maroon & gold. Details live in ../core.js (CONFIG). */
const hasGSAP = !!window.gsap;
const slide = isMobile ? 24 : 80;

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
        ${e.time ? `<p>🕒 ${esc(e.time)}</p>` : ""}
        ${e.place ? `<p>📍 ${esc(e.place)}</p>` : ""}
      </div>
      ${e.place ? `<a class="btn ${e.main ? "gold" : "ghost"}" href="${mapsLink(e.place)}" target="_blank" rel="noopener">Directions 🗺️</a>` : ""}
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

    const N = isMobile ? 24 : 45;
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
      const o = {}; spawn(o, true); o.done = true; P.push(o); // hidden until the one-time shower
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
    // one shower when the invitation opens; petals are not respawned
    this.shower = () => P.forEach((o) => { spawn(o, true); o.y += Math.random() * halfH; o.vy = 0.045 + Math.random() * 0.035; o.boost = 0.03; o.done = false; });

    let t = 0;
    const loop = () => {
      requestAnimationFrame(loop);
      if (document.hidden) return;
      t += 0.016;
      for (let i = 0; i < N; i++) {
        const o = P[i];
        if (o.done) { dummy.scale.setScalar(0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); continue; }
        o.boost *= 0.985;
        o.y -= o.vy + o.boost;
        o.x += o.vx + Math.sin(t * 0.8 + o.ph) * 0.012;
        o.rx += o.sr[0]; o.ry += o.sr[1]; o.rz += o.sr[2];
        if (o.y < -halfH - 2) o.done = true;
        dummy.position.set(o.x, o.y, o.z);
        dummy.rotation.set(o.rx, o.ry, o.rz);
        dummy.scale.setScalar(o.s);
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
  const els = { d: $("#cdD"), h: $("#cdH"), m: $("#cdM"), s: $("#cdS") };
  const set = (el, v) => { if (el.textContent !== v) { el.textContent = v; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); } };
  countdown((t) => {
    if (t.done) $("#cdDone").hidden = false;
    set(els.d, t.d); set(els.h, t.h); set(els.m, t.m); set(els.s, t.s);
  });
}

function setupCalendar() {
  $("#calBtn").addEventListener("click", () => window.open(calendarUrl(), "_blank", "noopener"));
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
    sendWish(name, msg);
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
designSwitcher(1);

$("#openBtn").addEventListener("click", openInvite);
$("#musicBtn").addEventListener("click", () => Music.toggle());
addEventListener("click", (e) => { if (document.body.classList.contains("opened") && e.target.closest("a, button")) burst(e.clientX, e.clientY); });

addEventListener("load", () => setTimeout(() => $("#loader").classList.add("done"), 1900));
setTimeout(() => $("#loader").classList.add("done"), 5000); // safety

