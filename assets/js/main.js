/* Manuel López Serrano · portfolio · interacciones (v4)
   JavaScript vanilla, sin dependencias. Cada módulo se degrada con elegancia. */
(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduceMotionQuery.matches;
  const onMotionChange = (e) => { reduceMotion = e.matches; };
  if (reduceMotionQuery.addEventListener) reduceMotionQuery.addEventListener("change", onMotionChange);

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ---------------- Menú móvil ---------------- */
  function initMenu() {
    const btn = document.querySelector(".menu-btn");
    const nav = document.getElementById("nav");
    if (!btn || !nav) return;
    const close = () => { nav.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------------- Sección activa en la navegación ---------------- */
  function initActiveNav() {
    const links = [...document.querySelectorAll(".nav a[href^='#']")];
    if (!("IntersectionObserver" in window) || !links.length) return;
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        const a = map.get(en.target.id);
        if (a) a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------------- Cabecera fija: se compacta tras 40 px ---------------- */
  function initHeader() {
    const top = document.querySelector(".top");
    if (!top) return;
    const root = document.documentElement;
    const setH = () => root.style.setProperty("--hdr", `${Math.round(top.offsetHeight)}px`);
    let compact = null;
    const on = () => {
      const c = window.scrollY > 40;
      if (c !== compact) { compact = c; top.classList.toggle("is-scrolled", c); }
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", setH);
    top.addEventListener("transitionend", setH);
    on(); setH();
  }

  /* ---------------- Retrato del hero: seguimiento amortiguado + vaivén en reposo ---------------- */
  function initPortrait() {
    const wrap = document.getElementById("portrait");
    const spark = document.getElementById("seal-spark");
    const title = document.querySelector(".hero__title");
    const hero = document.querySelector(".hero");
    if (!wrap) return;
    const MAX = 9;                                  // grados máximos de inclinación
    const TRACK_MS = 140, IDLE_MS = 420, IDLE_AFTER = 4500;
    let tx = 0, ty = 0, x = 0, y = 0, last = 0, lastMove = performance.now(), raf = 0, visible = true;

    function target(cx, cy, local) {
      const r = wrap.getBoundingClientRect();
      if (!r.width) return;
      const nx = local ? (cx - r.left) / r.width * 2 - 1 : (cx - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const ny = local ? (cy - r.top) / r.height * 2 - 1 : (cy - (r.top + r.height / 2)) / (window.innerHeight / 2);
      tx = clamp(nx, -1, 1); ty = clamp(ny, -1, 1);
      lastMove = performance.now();
      start();
    }
    function render() {
      wrap.style.setProperty("--rx", `${(x * MAX).toFixed(2)}deg`);
      wrap.style.setProperty("--ry", `${(-y * MAX).toFixed(2)}deg`);
      wrap.style.setProperty("--mx", `${(50 + x * 40).toFixed(1)}%`);
      wrap.style.setProperty("--my", `${(40 + y * 40).toFixed(1)}%`);
      if (spark) spark.style.transform = `translate(${(x * 12).toFixed(1)}px, ${(y * 12).toFixed(1)}px)`;
    }
    function frame(now) {
      raf = 0;
      const dt = Math.min(64, now - (last || now));
      last = now;
      let k;
      if (now - lastMove > IDLE_AFTER) {
        // Vaivén suave en reposo
        const t = now / 1000;
        tx = Math.sin(t * 0.7) * 0.35;
        ty = Math.cos(t * 0.53) * 0.22;
        k = 1 - Math.exp(-dt / IDLE_MS);
      } else {
        k = 1 - Math.exp(-dt / TRACK_MS);         // amortiguación exponencial
      }
      x += (tx - x) * k; y += (ty - y) * k;
      render();
      if (visible && !reduceMotion) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible && !reduceMotion) { last = 0; raf = requestAnimationFrame(frame); } }

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse" || e.pointerType === "pen") target(e.clientX, e.clientY, false);
    }, { passive: true });
    wrap.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") target(e.clientX, e.clientY, true); });
    wrap.addEventListener("pointermove", (e) => { if (e.pointerType === "touch") target(e.clientX, e.clientY, true); }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => { tx = 0; ty = 0; });

    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(hero);
    }
    start();

    // Parallax ligero del titular al bajar
    if (title) {
      let ticking = false;
      const para = () => {
        ticking = false;
        if (reduceMotion) { title.style.translate = ""; return; }
        const yv = window.scrollY;
        if (yv > window.innerHeight * 1.2) return;
        title.style.translate = `0 ${(yv * 0.18).toFixed(1)}px`;
        title.style.opacity = String(clamp(1 - yv / (window.innerHeight * 1.1), 0.2, 1));
      };
      window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(para); } }, { passive: true });
    }
  }

  /* ---------------- Titulares divididos por línea visual real ---------------- */
  function splitLines(el) {
    if (!el.dataset.src) el.dataset.src = el.innerHTML;
    el.innerHTML = el.dataset.src;
    // 1) Unidades: palabras sueltas y elementos en línea completos
    const units = [];
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) units.push(document.createTextNode(" "));
          else { const w = document.createElement("span"); w.className = "w"; w.textContent = part; w.style.display = "inline-block"; units.push(w); }
        });
      } else if (node.nodeType === 1) {
        const w = document.createElement("span"); w.className = "w"; w.style.display = "inline-block";
        w.appendChild(node.cloneNode(true)); units.push(w);
      }
    });
    el.textContent = "";
    units.forEach((u) => el.appendChild(u));
    // 2) Agrupa por offsetTop
    const lines = [];
    let cur = null, curTop = null;
    units.forEach((u) => {
      if (u.nodeType === 3) { if (cur) cur.push(u); return; }
      const t = u.offsetTop;
      if (curTop === null || Math.abs(t - curTop) > 4) { cur = []; lines.push(cur); curTop = t; }
      cur.push(u);
    });
    // 3) Reconstruye en .line > .line__inner
    el.textContent = "";
    lines.forEach((nodes, i) => {
      const line = document.createElement("span"); line.className = "line";
      const inner = document.createElement("span"); inner.className = "line__inner"; inner.style.setProperty("--i", i);
      nodes.forEach((n) => { if (n.nodeType === 1) n.style.display = ""; inner.appendChild(n); });
      line.appendChild(inner); el.appendChild(line);
    });
  }
  function initLines() {
    const heads = [...document.querySelectorAll("[data-lines]")];
    if (!heads.length) return;
    heads.forEach((h) => { h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim()); splitLines(h); });
    if ("IntersectionObserver" in window && !reduceMotion) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-lines-in"); io.unobserve(en.target); } });
      }, { threshold: 0.3 });
      heads.forEach((h) => io.observe(h));
    } else heads.forEach((h) => h.classList.add("is-lines-in"));
    let t = 0, w = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth === w) return; w = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(() => heads.forEach((h) => splitLines(h)), 150);
    });
  }

  /* ---------------- Aparición suave de bloques al hacer scroll ---------------- */
  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const items = document.querySelectorAll(".section-num, .about__copy, .toolbox, .card, .contact__lead, .contact__list, .work__intro, .projects__intro");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el, i) => {
      el.classList.add("reveal");
      if (el.classList.contains("card")) el.style.transitionDelay = `${(i % 3) * 90}ms`;
      io.observe(el);
    });
  }

  /* ---------------- Flecha dibujada de la Toolbox ---------------- */
  function initArrow() {
    const box = document.getElementById("toolbox");
    if (!box) return;
    if (reduceMotion || !("IntersectionObserver" in window)) { box.classList.add("is-drawn"); return; }
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { box.classList.add("is-drawn"); io.disconnect(); }
    }, { threshold: 0.45 });
    io.observe(box);
  }

  /* ---------------- Marquee reactivo a la dirección y velocidad del scroll ---------------- */
  function initMarquee() {
    const band = document.querySelector(".marquee");
    const track = band && band.querySelector(".marquee__track");
    if (!track || reduceMotion) return;
    band.classList.add("marquee--js");
    const BASE = 42;                 // px/s en reposo
    let x = 0, dir = -1, boost = 0, lastY = window.scrollY, lastT = performance.now(), last = 0, paused = false, visible = true, raf = 0;
    window.addEventListener("scroll", () => {
      const now = performance.now(), dy = window.scrollY - lastY, dt = Math.max(16, now - lastT);
      if (Math.abs(dy) > 0) dir = dy > 0 ? -1 : 1;
      boost = Math.min(700, Math.max(boost, Math.abs(dy) / dt * 1000 * 0.45));
      lastY = window.scrollY; lastT = now;
    }, { passive: true });
    band.addEventListener("mouseenter", () => { paused = true; });
    band.addEventListener("mouseleave", () => { paused = false; });
    function frame(now) {
      raf = 0;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      boost *= Math.exp(-dt * 3);
      const half = track.scrollWidth / 2 || 1;
      if (!paused) x += dir * (BASE + boost) * dt;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      const skew = clamp(-dir * boost / 120, -5, 5);
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
      if (visible) raf = requestAnimationFrame(frame);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame); } }).observe(band);
    } else raf = requestAnimationFrame(frame);
  }

  /* ---------------- Trayectoria: piscina con nadador y muelle amortiguado ---------------- */
  function initPool() {
    const track = document.getElementById("pool-track");
    const svg = document.getElementById("pool-svg");
    if (!track || !svg) return;
    const cards = [...document.querySelectorAll(".deck__card")];
    const btns = [...document.querySelectorAll(".stops__btn")];
    const buoys = [...svg.querySelectorAll(".buoy")];
    const swimmer = document.getElementById("swimmer");
    const armL = document.getElementById("arm-l"), armR = document.getElementById("arm-r");
    const legL = document.getElementById("leg-l"), legR = document.getElementById("leg-r");
    const wake = document.getElementById("wake");
    const bubblesG = document.getElementById("pool-bubbles");
    const N = cards.length;
    const X0 = 110, X1 = 890, LANE_Y = 280;
    const DWELL = 0.1;
    const NS = "http://www.w3.org/2000/svg";

    let sT = 0, sD = 0, vD = 0, phase = 0, kick = 0, active = -1, last = 0, raf = 0, visible = false, tween = null;

    // Burbujas reutilizables
    const bubbles = Array.from({ length: 18 }, () => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("r", "0"); bubblesG.appendChild(c);
      return { el: c, life: 0, x: 0, y: 0, r: 0, vx: 0, vy: 0 };
    });
    let spawnAcc = 0;

    const geom = () => {
      const top = track.getBoundingClientRect().top + window.scrollY;
      const span = Math.max(1, track.offsetHeight - window.innerHeight);
      return { top, span };
    };
    // Progreso de scroll → posición objetivo con zonas de parada (DWELL) en cada hito
    function targetFromScroll() {
      const { top, span } = geom();
      const prog = clamp((window.scrollY - top) / span, 0, 1);
      const u = prog * (N - 1);
      const k = Math.floor(u);
      if (k >= N - 1) return N - 1;
      const f = u - k;
      return k + clamp((f - DWELL) / (1 - 2 * DWELL), 0, 1);
    }
    const xOf = (s) => X0 + (X1 - X0) * (s / (N - 1));

    function setActive(k) {
      if (k === active) return;
      active = k;
      cards.forEach((c, i) => c.classList.toggle("is-active", i === k));
      btns.forEach((b, i) => { if (i === k) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      const b = btns[k];
      if (b) {
        const list = b.closest(".stops__list");
        const want = b.offsetLeft - (list.clientWidth - b.offsetWidth) / 2;
        list.scrollTo({ left: want, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }

    function render(dt) {
      const speed = Math.abs(vD);
      const x = xOf(sD);
      swimmer.setAttribute("transform", `translate(${x.toFixed(2)} ${LANE_Y}) scale(1.1)`);
      // Brazada: velocidad del ciclo en función de |vD|
      if (!reduceMotion) {
        phase = (phase + dt * (0.22 + 1.25 * speed)) % 1;
        kick += dt * (1.2 + 5 * speed);
      }
      const arm = (p, side) => {
        let ang, len;
        if (p < 0.5) { ang = -360 * p; len = 1; }                 // tracción bajo el agua
        else { ang = -180 + 360 * (p - 0.5); len = 0.62; }       // recobro por encima (escorzo)
        return `translate(20 ${16 * side}) rotate(${(ang * -side).toFixed(1)}) scale(${len.toFixed(2)} 1)`;
      };
      armL.setAttribute("transform", arm(phase, -1));
      armR.setAttribute("transform", arm((phase + 0.5) % 1, 1));
      const kk = Math.sin(kick * Math.PI * 2) * (3 + 6 * Math.min(1, speed));
      legL.setAttribute("y2", (-9 + kk).toFixed(1));
      legR.setAttribute("y2", (9 - kk).toFixed(1));
      // Estela: amplitud y opacidad según |vD|
      const wo = reduceMotion ? 0 : clamp(0.1 + speed * 0.55, 0, 0.9);
      wake.setAttribute("opacity", wo.toFixed(2));
      wake.setAttribute("transform", `scale(${(0.55 + speed * 0.4).toFixed(2)} ${(0.6 + speed * 0.5).toFixed(2)})`);
      // Burbujas
      if (!reduceMotion) {
        spawnAcc += dt * speed * 26;
        while (spawnAcc >= 1) {
          spawnAcc -= 1;
          const b = bubbles.find((q) => q.life <= 0);
          if (!b) break;
          b.life = 1; b.x = x - 70 - Math.random() * 20; b.y = LANE_Y + (Math.random() - 0.5) * 34;
          b.r = 2 + Math.random() * 4; b.vx = -10 - Math.random() * 20; b.vy = (Math.random() - 0.5) * 16;
        }
        bubbles.forEach((b) => {
          if (b.life <= 0) { b.el.setAttribute("r", "0"); return; }
          b.life -= dt / 1.3; b.x += b.vx * dt; b.y += b.vy * dt;
          b.el.setAttribute("cx", b.x.toFixed(1)); b.el.setAttribute("cy", b.y.toFixed(1));
          b.el.setAttribute("r", (b.r * (0.6 + 0.4 * b.life)).toFixed(2));
          b.el.setAttribute("opacity", Math.max(0, b.life).toFixed(2));
        });
      }
      // Boyas y progreso de la barra
      buoys.forEach((g, i) => {
        g.classList.toggle("is-passed", sD >= i - 0.02);
        g.classList.toggle("is-current", Math.abs(sD - i) < 0.45);
      });
      btns.forEach((b, i) => b.style.setProperty("--p", clamp(sD - i + 1, 0, 1).toFixed(3)));
      // Tarjeta activa
      const k = Math.round(sD);
      if (Math.abs(sD - k) < 0.45) setActive(clamp(k, 0, N - 1));
    }

    function frame(now) {
      raf = 0;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      sT = targetFromScroll();
      if (reduceMotion) {
        sD = Math.round(sT); vD = 0;                              // cambio limpio, sin inercia
      } else {
        // Muelle críticamente amortiguado (ω = 7, 2ω = 14)
        vD = clamp(vD + (49 * (sT - sD) - 14 * vD) * dt, -2.2, 2.2);
        sD += vD * dt;
      }
      render(dt);
      track.dataset.sd = sD.toFixed(3);
      if (visible || Math.abs(vD) > 0.001 || tween) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }

    // Clic en una etapa: desplazamiento suave por coseno sincronizando scroll y nadador
    function goTo(k) {
      const { top, span } = geom();
      const to = Math.round(top + span * (k / (N - 1)));
      const from = window.scrollY;
      if (reduceMotion || Math.abs(to - from) < 2) { window.scrollTo({ top: to, behavior: "instant" }); start(); return; }
      const dur = clamp(450 + 140 * Math.abs(k - sD), 550, 1600);
      const t0 = performance.now();
      if (tween) cancelAnimationFrame(tween);
      const step = (now) => {
        const p = clamp((now - t0) / dur, 0, 1);
        const e = 0.5 - 0.5 * Math.cos(Math.PI * p);
        window.scrollTo({ top: from + (to - from) * e, behavior: "instant" });
        tween = p < 1 ? requestAnimationFrame(step) : null;
      };
      tween = requestAnimationFrame(step);
      start();
    }
    btns.forEach((b) => b.addEventListener("click", () => goTo(Number(b.dataset.k))));
    // Accesibilidad: si el foco entra en una tarjeta oculta, salta a su hito
    cards.forEach((c, i) => c.addEventListener("focusin", () => { if (i !== active) goTo(i); }));

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }, { rootMargin: "200px 0px" }).observe(track);
    } else visible = true;
    window.addEventListener("scroll", start, { passive: true });
    window.addEventListener("resize", start);
    sT = sD = targetFromScroll();
    render(0);
    setActive(clamp(Math.round(sD), 0, N - 1));
    start();
  }

  /* ---------------- Toolbox con física 2D ---------------- */
  function initToolbox() {
    const box = document.getElementById("toolbox");
    const stage = document.getElementById("stage");
    const shakeBtn = document.getElementById("shake");
    if (!box || !stage) return;
    const els = [...stage.querySelectorAll(".pill")];
    if (!els.length) return;

    const G = 2200;          // gravedad px/s²
    const REST = 0.35;       // rebote
    const FRICTION = 0.985;  // amortiguación del aire
    const FLOOR_FRICTION = 0.86;
    let bodies = [];
    let W = 0, H = 0;
    let running = false, active = false, visible = true, last = 0, raf = 0;

    function measure() {
      W = stage.clientWidth; H = stage.clientHeight;
    }

    function enable() {
      if (active) return;
      measure();
      const sr = stage.getBoundingClientRect();
      // Toma las posiciones del layout estático para que las piezas "caigan" desde ahí
      bodies = els.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, w: r.width, h: r.height, x: r.left - sr.left, y: r.top - sr.top, vx: 0, vy: 0, grabbed: false };
      });
      box.classList.add("toolbox--physics");
      bodies.forEach(draw);
      active = true;
      start();
    }

    function draw(b) {
      b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0)`;
    }

    function collideWalls(b) {
      if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * REST; }
      if (b.x + b.w > W) { b.x = W - b.w; b.vx = -Math.abs(b.vx) * REST; }
      if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy) * REST; }
      if (b.y + b.h > H) {
        b.y = H - b.h;
        b.vy = -Math.abs(b.vy) * REST;
        if (Math.abs(b.vy) < 40) b.vy = 0;
        b.vx *= FLOOR_FRICTION;
      }
    }

    // Colisiones caja contra caja (AABB) resueltas por el eje de menor solapamiento
    function collidePairs() {
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          if (ox <= 0) continue;
          const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (oy <= 0) continue;
          const ma = a.grabbed ? 0 : 1, mb = b.grabbed ? 0 : 1;  // la pieza agarrada es "inamovible"
          const tot = ma + mb;
          if (!tot) continue;
          if (ox < oy) {
            const dir = (a.x + a.w / 2) < (b.x + b.w / 2) ? -1 : 1;
            a.x += dir * ox * (ma / tot); b.x -= dir * ox * (mb / tot);
            const rel = a.vx - b.vx;
            if (rel * dir < 0) {
              const imp = -(1 + REST) * rel / tot;
              a.vx += imp * ma; b.vx -= imp * mb;
            }
          } else {
            const dir = (a.y + a.h / 2) < (b.y + b.h / 2) ? -1 : 1;
            a.y += dir * oy * (ma / tot); b.y -= dir * oy * (mb / tot);
            const rel = a.vy - b.vy;
            if (rel * dir < 0) {
              const imp = -(1 + REST) * rel / tot;
              a.vy += imp * ma; b.vy -= imp * mb;
            }
            // un poco de fricción entre piezas apiladas
            const top = dir < 0 ? a : b, bottom = dir < 0 ? b : a;
            if (!top.grabbed) top.vx = top.vx * 0.94 + (bottom.grabbed ? 0 : bottom.vx * 0.06);
          }
        }
      }
    }

    function tick(now) {
      raf = 0;
      if (!running) return;
      const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
      last = now;
      let energy = 0;
      const SUB = 4, h = dt / SUB;
      for (let s = 0; s < SUB; s++) {
        for (const b of bodies) {
          if (b.grabbed) continue;
          b.vy += G * h;
          b.vx *= Math.pow(FRICTION, h * 60);
          b.vy *= Math.pow(FRICTION, h * 60);
          b.x += b.vx * h; b.y += b.vy * h;
        }
        for (let k = 0; k < 4; k++) { collidePairs(); for (const b of bodies) collideWalls(b); }
      }
      for (const b of bodies) { draw(b); energy += Math.abs(b.vx) + Math.abs(b.vy) + (b.grabbed ? 999 : 0); }
      // Duerme cuando todo está quieto o fuera de pantalla para ahorrar batería
      if (energy < 8 * bodies.length || !visible) { running = false; return; }
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (running || !active) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function shake() {
      if (!active) enable();
      bodies.forEach((b) => {
        if (b.grabbed) return;
        b.vx += (Math.random() - 0.5) * 1400;
        b.vy -= 700 + Math.random() * 900;
      });
      start();
    }

    // Arrastrar y lanzar (Pointer Events: ratón, lápiz y táctil)
    let drag = null;
    stage.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".pill");
      if (!el) return;
      if (!active) enable();
      const b = bodies.find((q) => q.el === el);
      if (!b) return;
      e.preventDefault();
      const sr = stage.getBoundingClientRect();
      drag = { b, id: e.pointerId, ox: e.clientX - sr.left - b.x, oy: e.clientY - sr.top - b.y, hist: [] };
      b.grabbed = true; b.vx = 0; b.vy = 0;
      el.classList.add("is-grabbed");
      el.setPointerCapture(e.pointerId);
      start();
    });
    stage.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const sr = stage.getBoundingClientRect();
      const b = drag.b;
      b.x = clamp(e.clientX - sr.left - drag.ox, 0, W - b.w);
      b.y = clamp(e.clientY - sr.top - drag.oy, 0, H - b.h);
      const t = performance.now();
      drag.hist.push({ x: b.x, y: b.y, t });
      while (drag.hist.length && t - drag.hist[0].t > 90) drag.hist.shift();
      start();
    });
    const release = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const b = drag.b, hst = drag.hist;
      if (hst.length >= 2) {
        const a = hst[0], z = hst[hst.length - 1];
        const dt = Math.max(16, z.t - a.t) / 1000;
        b.vx = clamp((z.x - a.x) / dt, -2600, 2600);
        b.vy = clamp((z.y - a.y) / dt, -2600, 2600);
      }
      b.grabbed = false;
      b.el.classList.remove("is-grabbed");
      drag = null;
      start();
    };
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);

    if (shakeBtn) shakeBtn.addEventListener("click", shake);

    window.addEventListener("resize", () => {
      if (!active) return;
      measure();
      bodies.forEach((b) => { b.x = clamp(b.x, 0, Math.max(0, W - b.w)); b.y = clamp(b.y, 0, Math.max(0, H - b.h)); draw(b); });
      start();
    });

    // Activa la física al entrar en pantalla (salvo con movimiento reducido: entonces solo al pulsar "Agitar" o arrastrar)
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          visible = en.isIntersecting;
          if (!visible) return;
          if (!active && !reduceMotion) enable();
          else start();
        });
      }, { threshold: 0.25 });
      io.observe(stage);
    } else if (!reduceMotion) {
      enable();
    }
  }

  const boot = () => {
    initMenu();
    initActiveNav();
    initHeader();
    initPortrait();
    initLines();
    initReveal();
    initMarquee();
    initArrow();
    initToolbox();
    initPool();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
