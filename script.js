/* VI — Leonida · fan concept. GSAP 3 + ScrollTrigger + Lenis (locali). */
(() => {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  gsap.registerPlugin(ScrollTrigger);

  // ---------- Lenis ----------
  let lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const t = $(a.getAttribute("href"));
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { duration: 1.6 }); else t.scrollIntoView();
    if (t.id === "welcome") t.setAttribute("tabindex", "-1"), t.focus({ preventScroll: true });
  }));

  const ready = () => {
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    const hudEl = document.querySelector(".hud");
    if (hudEl) hudEl.classList.add("is-on");
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  };

  if (RM) { ready(); return; }

  // ---------- HERO: livelli ----------
  const hero = $(".hero");
  const L = {
    sky: $(".hero .layer--sky"), city: $(".hero .layer--city"), title: $(".hero .layer--title"),
    front: $(".hero .layer--front"), char: $(".hero .layer--char"),
  };
  const inner = (el) => el.firstElementChild;
  const heroGlyphs = $$("#pd-hero .pd__g");

  // ---------- caricamento: «VI» che si apre ----------
  const svg = $(".loader__svg");
  const viG = $(".loader__vi");
  const edge = $(".loader__edge");
  const pct = $(".loader__pct");
  const W0 = +viG.dataset.w, X0 = +viG.dataset.x0, IX = +viG.dataset.ix, H0 = 639;
  const zoom = { s: 1 };
  // punto d'origine dello zoom: il punto PIENO della sagoma più vicino al centro del VI
  // (il centro esatto cade tra V e I; serve un punto dentro la lettera perché il buco copra tutto lo schermo)
  const viPath = $("path", viG);
  const C0 = { x: X0 + W0 / 2, y: H0 / 2 };
  let O = C0;
  try {
    let best = null;
    for (let r = 0; r <= 260 && !best; r += 6) {
      for (let a = 0; a < 360; a += 10) {
        const x = C0.x + r * Math.cos((a * Math.PI) / 180), y = C0.y + r * Math.sin((a * Math.PI) / 180);
        if (viPath.isPointInFill(new DOMPoint(x, y))) { best = { x, y }; break; }
      }
    }
    // entra di qualche unità dentro il tratto, così il bordo non resta sul punto
    if (best) { const dx = best.x - C0.x, dy = best.y - C0.y, d = Math.hypot(dx, dy) || 1; O = { x: best.x + (dx / d) * 18, y: best.y + (dy / d) * 18 }; }
  } catch (e) { O = { x: IX, y: H0 / 2 }; }
  // VI centrato con zoom sc attorno al punto O (caricamento e chiusura dell'hero)
  const viTr = (sc) => {
    const vw = innerWidth, vh = innerHeight;
    const k = Math.min((vh * 0.34) / H0, (vw * 0.62) / W0);
    const tx = vw / 2 - C0.x * k, ty = vh / 2 - C0.y * k;
    const px = tx + O.x * k, py = ty + O.y * k;
    return `translate(${px} ${py}) scale(${sc}) translate(${-px} ${-py}) translate(${tx} ${ty}) scale(${k})`;
  };
  const place = () => {
    const vw = innerWidth, vh = innerHeight;
    const k = Math.min((vh * 0.34) / H0, (vw * 0.62) / W0);
    const tx = vw / 2 - C0.x * k, ty = vh / 2 - C0.y * k; // VI centrato nello schermo
    const tr = viTr(zoom.s);
    viG.setAttribute("transform", tr);
    edge.setAttribute("transform", tr);
  };
  place();
  addEventListener("resize", place);

  // stato iniziale: la scena dentro il VI è già viva ma ingrandita
  gsap.set([inner(L.sky), inner(L.city), inner(L.front)], { scale: 1.35, transformOrigin: "50% 60%" });
  gsap.set(inner(L.char), { yPercent: 18, scale: 1.12, transformOrigin: "50% 100%" });
  gsap.set(heroGlyphs, { yPercent: -160, rotate: () => gsap.utils.random(-14, 14), opacity: 0 });
  gsap.set(".nav, .hero__ui", { autoAlpha: 0 });
  gsap.to(inner(L.sky), { xPercent: 2, duration: 6, ease: "sine.inOut", yoyo: true, repeat: -1 });

  const heroImgs = $$("img", hero);
  let done = 0;
  const shown = { v: 0 };
  const tick = () => gsap.to(shown, { v: (done / heroImgs.length) * 100, duration: 0.5, ease: "power2.out", onUpdate: () => { pct.textContent = String(Math.round(shown.v)).padStart(3, "0"); } });
  const loaded = heroImgs.map((im) => (im.complete && im.naturalWidth ? Promise.resolve() : new Promise((r) => { im.addEventListener("load", r, { once: true }); im.addEventListener("error", r, { once: true }); }))
    .then(() => (im.decode ? im.decode().catch(() => {}) : null)).then(() => { done++; tick(); }));
  const minTime = new Promise((r) => setTimeout(r, 1300));
  const safety = new Promise((r) => setTimeout(r, 7000));

  Promise.race([Promise.all([...loaded, minTime]), safety]).then(() => {
    pct.textContent = "100";
    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: ready });
    tl.to(".loader__meta", { autoAlpha: 0, y: 12, duration: 0.4, ease: "power2.in" })
      .to(edge, { opacity: 0, duration: 0.35 }, "<")
      .to(zoom, { s: 70, duration: 1.7, ease: "expo.in", onUpdate: place }, "-=0.1")
      .to([inner(L.sky), inner(L.city), inner(L.front)], { scale: 1, duration: 2.2, ease: "expo.out", stagger: 0.06 }, "-=0.55")
      .to(inner(L.char), { yPercent: 0, scale: 1, duration: 1.6, ease: "expo.out" }, "<0.15")
      .set(".loader", { display: "none" }, "<")
      // effetto 1: il titolo cade lettera per lettera come un adesivo sbattuto sullo schermo
      .to(heroGlyphs, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.9, ease: "back.out(2.2)", stagger: { each: 0.05, from: "center" } }, "<0.15")
      .to(".nav, .hero__ui", { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, "<0.4");
  });

  // ---------- HERO: parallasse allo scroll + mouse ----------
  // 2 · uscita: le righe del titolo si separano, lui si avvicina, la scena si richiude nel VI
  const closeSvg = $(".hero__close"), closeG = $(".hero__vi");
  const cz = { l: Math.log(70) };
  const placeClose = () => closeG.setAttribute("transform", viTr(cz.l <= -6 ? 0 : Math.exp(cz.l)));
  placeClose();
  addEventListener("resize", placeClose);
  const tLines = $$("#pd-hero .pd__ln");
  gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.6, onUpdate: (st) => { closeSvg.style.visibility = st.progress > 0.38 ? "visible" : "hidden"; } } })
    .to(tLines[0], { x: -1400, ease: "power2.in", duration: 0.5 }, 0)
    .to(tLines[2], { x: 1400, ease: "power2.in", duration: 0.5 }, 0)
    .to(tLines[1], { opacity: 0, ease: "none", duration: 0.35 }, 0.1)
    .to(inner(L.char), { scale: 1.16, transformOrigin: "50% 30%", ease: "power1.in", duration: 0.6 }, 0)
    .fromTo(cz, { l: Math.log(70) }, { l: 0, ease: "none", duration: 0.42, onUpdate: placeClose, immediateRender: false }, 0.4)
    .to(cz, { l: -7, ease: "power2.in", duration: 0.18, onUpdate: placeClose }, 0.82);
  gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
    .to(L.sky, { yPercent: 26, ease: "none" }, 0)
    .to(L.city, { yPercent: 16, ease: "none" }, 0)
    .to(L.title, { yPercent: 60, ease: "none" }, 0)
    .to(L.front, { yPercent: -4, scale: 1.12, ease: "none" }, 0)
    .to(L.char, { yPercent: 6, ease: "none" }, 0); // scende soltanto: il taglio in basso resta fuori dallo schermo

  if (FINE) {
    const depth = [[L.sky, 8, 4], [L.city, 16, 6], [L.title, 26, 10], [L.front, 44, 16], [L.char, 34, 12]];
    const movers = depth.map(([el, dx, dy]) => [gsap.quickTo(inner(el), "x", { duration: 1.1, ease: "power3.out" }), gsap.quickTo(inner(el), "y", { duration: 1.1, ease: "power3.out" }), dx, dy]);
    hero.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      movers.forEach(([mx, my, dx, dy]) => { mx(-nx * dx * 2); my(-ny * dy * 2); });
    });
  }

  // ---------- WELCOME ----------
  const wl = gsap.timeline({ scrollTrigger: { trigger: ".welcome", start: "top 70%", toggleActions: "play none none reverse" } });
  wl.from(".slant--pink", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.9, ease: "expo.out" })
    .from(".welcome__char", { yPercent: 16, opacity: 0, duration: 1.1, ease: "expo.out" }, "<0.15")
    .from("#pd-welcome .pd__g", { yPercent: -140, rotate: () => gsap.utils.random(-12, 12), opacity: 0, duration: 0.8, ease: "back.out(2)", stagger: 0.035 }, "<0.1")
    .from(".welcome__copy > :not(h2)", { y: 26, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, "-=0.5");

  // hover 1: il personaggio e la cornice si muovono in direzioni opposte, una luce scorre sulla cornice
  if (FINE) {
    const art = $(".welcome__art");
    const fr = $(".slant--pink");
    const ch = $(".welcome__clip");
    const fx = gsap.quickTo(fr, "x", { duration: 0.9, ease: "power3.out" }), fy = gsap.quickTo(fr, "y", { duration: 0.9, ease: "power3.out" });
    // la sagoma che ritaglia il personaggio va con la cornice; dentro si sposta solo il disegno
    const img = $(".welcome__char");
    const kx = gsap.quickTo(ch, "x", { duration: 0.9, ease: "power3.out" }), ky = gsap.quickTo(ch, "y", { duration: 0.9, ease: "power3.out" });
    const cx = gsap.quickTo(img, "x", { duration: 0.9, ease: "power3.out" }), cy = gsap.quickTo(img, "y", { duration: 0.9, ease: "power3.out" });
    art.addEventListener("pointermove", (e) => {
      const r = art.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      fx(-nx * 34); fy(-ny * 22); kx(-nx * 34); ky(-ny * 22); cx(nx * 44); cy(Math.max(0, ny * 14));
      art.style.setProperty("--lx", `${(nx + 0.5) * 100}%`);
      art.style.setProperty("--ly", `${(ny + 0.5) * 100}%`);
    });
    art.addEventListener("pointerleave", () => { fx(0); fy(0); kx(0); ky(0); cx(0); cy(0); });
  }

  // ---------- SCENE: stesso trucco a livelli, entrate diverse ----------
  $$(".scene").forEach((sec) => {
    const stage = $(".scene__stage", sec);
    const bg = $(".scene__bg", stage);
    const glyphs = $$(".pd__g", stage);
    const title = $(".scene__title", stage);
    const char = $(".scene__char", stage);
    const card = $(".scene__card", stage);
    const kind = sec.dataset.enter;
    const fromRight = sec.classList.contains("scene--beach") || sec.classList.contains("scene--keys");

    const tl = gsap.timeline({ defaults: { ease: "power3.out" }, scrollTrigger: { trigger: sec, start: "top 85%", end: "bottom bottom", scrub: 0.7 } });

    if (kind === "sun") {
      tl.fromTo(bg, { clipPath: "circle(0% at 50% 62%)", scale: 1.3 }, { clipPath: "circle(80% at 50% 62%)", scale: 1, duration: 0.42, ease: "power2.inOut" }, 0);
    } else if (kind === "wipe") {
      tl.fromTo(bg, { clipPath: "polygon(0% 0%, 0% 0%, -25% 100%, -25% 100%)", xPercent: -8 }, { clipPath: "polygon(0% 0%, 125% 0%, 100% 100%, -25% 100%)", xPercent: 0, duration: 0.42, ease: "power2.inOut" }, 0);
    } else if (kind === "shutter") {
      tl.fromTo(bg, { clipPath: "inset(50% 0% 50% 0%)", filter: "brightness(0.2) saturate(0.4)" }, { clipPath: "inset(0% 0% 0% 0%)", filter: "brightness(1) saturate(1)", duration: 0.42, ease: "power2.inOut" }, 0);
    } else if (kind === "slices") {
      const img = $("img", bg);
      const polys = ["polygon(0% 0%, 39% 0%, 27% 100%, 0% 100%)", "polygon(38.8% 0%, 72% 0%, 60% 100%, 26.8% 100%)", "polygon(71.8% 0%, 100% 0%, 100% 100%, 59.8% 100%)"];
      const slices = polys.map((p) => {
        const d = document.createElement("div");
        d.className = "scene__bg scene__slice";
        d.setAttribute("aria-hidden", "true");
        d.style.clipPath = p;
        const c = img.cloneNode(); c.alt = ""; c.removeAttribute("loading");
        if (matchMedia("(max-width: 700px)").matches) { c.removeAttribute("srcset"); c.src = "assets/img/keys-bg-9x16.webp"; }
        d.appendChild(c);
        bg.after(d);
        return d;
      });
      gsap.set(bg, { autoAlpha: 0 });
      tl.fromTo(slices, { yPercent: (i) => [110, -110, 110][i] }, { yPercent: 0, duration: 0.42, ease: "power3.inOut", stagger: 0.04 }, 0);
      tl.to(slices, { scale: 1.06, duration: 0.58, ease: "none" }, 0.46);
    }

    // titolo: lettere che cadono (effetto 1), il neon della notte sfarfalla
    tl.fromTo(glyphs, { yPercent: -150, rotate: () => gsap.utils.random(-14, 14), opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.2, ease: "back.out(2.4)", stagger: 0.012 }, 0.2);
    if (kind === "shutter") tl.fromTo(title, { opacity: 1 }, { keyframes: { opacity: [1, 0.25, 1, 0.5, 1, 0.8, 1] }, duration: 0.12, ease: "none" }, 0.36);
    tl.fromTo(char, { xPercent: kind === "wipe" ? -30 : kind === "sun" ? 30 : 0, yPercent: kind === "shutter" || kind === "slices" ? 28 : 10, opacity: 0 }, { xPercent: 0, yPercent: 0, opacity: 1, duration: 0.24, ease: "power3.out" }, 0.3);
    tl.fromTo(card, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.14 }, 0.44);
    // tenuta: i livelli scivolano a velocità diverse
    if (kind !== "slices") tl.to(bg, { scale: 1.08, yPercent: -2, duration: 0.5, ease: "none" }, 0.5);
    tl.to(title, { yPercent: 18, duration: 0.5, ease: "none" }, 0.5);
    tl.to(char, { yPercent: -5, xPercent: fromRight ? -3 : 3, duration: 0.5, ease: "none" }, 0.5);
  });

  // ---------- 1 · HUD: la minimappa segue il viaggio, le stelle salgono ----------
  const world = $(".hud__world"), blip = $(".hud__blip"), placeTag = $(".hud__place"), stars = $$(".hud__stars i"), starBox = $(".hud__stars");
  const POI = { vc: [318, 250], beach: [352, 214], swamp: [196, 256], night: [300, 226], keys: [208, 424] };
  const MK = 0.62, cam = { x: POI.vc[0], y: POI.vc[1], r: 0 };
  const drawMap = () => { world.setAttribute("transform", `translate(${80 - cam.x * MK} ${80 - cam.y * MK}) scale(${MK})`); blip.setAttribute("transform", `rotate(${cam.r} 80 80)`); };
  drawMap();
  let curPoi = "vc";
  const goTo = (key, label, n) => {
    stars.forEach((st, i) => st.classList.toggle("on", i < n));
    starBox.classList.toggle("is-hot", n === 5);
    placeTag.textContent = label;
    if (key === curPoi) return;
    const [x, y] = POI[key];
    const ang = (Math.atan2(y - cam.y, x - cam.x) * 180) / Math.PI + 90;
    curPoi = key;
    gsap.to(cam, { x, y, r: ang, duration: 1.4, ease: "power2.inOut", onUpdate: drawMap });
  };
  [["#top", "vc", "Vice City", 0], [".scene--beach", "beach", "Vice Beach", 1], [".scene--swamp", "swamp", "Grassrivers", 2], [".scene--night", "night", "Vice City · noche", 3], [".scene--keys", "keys", "Leonida Keys", 4], ["#banda", "keys", "Leonida Keys", 4], ["#final", "vc", "Vice City", 5]]
    .forEach(([sel, key, label, n]) => ScrollTrigger.create({ trigger: sel, start: "top 55%", end: "bottom 55%", onToggle: (st) => { if (st.isActive) goTo(key, label, n); } }));

  // la barra in alto diventa piena dopo l'hero; la minimappa si toglie sopra la banda (non copre i nomi)
  ScrollTrigger.create({ trigger: "#bienvenido", start: "top 80px", end: "max", onToggle: (st) => $(".nav").classList.toggle("is-solid", st.isActive) });
  ScrollTrigger.create({ trigger: "#banda", start: "top 70%", end: "bottom 30%", onToggle: (st) => $(".hud").classList.toggle("hud--mapoff", st.isActive) });

  // ---------- LA BANDA: il pannello si apre, il personaggio esce dal marco ----------
  const cards = $$(".card");
  const openCard = (c) => cards.forEach((x) => x.classList.toggle("is-live", x === c));
  gsap.from(cards, { yPercent: 18, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".crew__list", start: "top 85%" } });
  gsap.from("#pd-crew .pd__g", { yPercent: -150, rotate: () => gsap.utils.random(-12, 12), opacity: 0, duration: 0.8, ease: "back.out(2)", stagger: 0.05, scrollTrigger: { trigger: ".crew", start: "top 70%" } });
  cards.forEach((c) => {
    c.addEventListener("pointerenter", () => openCard(c));
    c.addEventListener("focus", () => openCard(c));
    c.addEventListener("click", () => openCard(c));
    if (FINE) {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", `${-((e.clientX - r.left) / r.width - 0.5) * 30}px`);
        c.style.setProperty("--my", `${-((e.clientY - r.top) / r.height - 0.5) * 16}px`);
      });
      c.addEventListener("pointerleave", () => { c.style.setProperty("--mx", "0px"); c.style.setProperty("--my", "0px"); });
    }
  });

  // ---------- FINALE: l'auto entra davanti al titolo e frena (effetto 5) ----------
  const fin = $(".finale");
  const car = $(".finale__car");
  const smoke = $$(".finale__smoke");
  gsap.set(smoke[0], { left: "54%" });
  gsap.set(smoke[1], { left: "66%" });
  const ft = gsap.timeline({ scrollTrigger: { trigger: fin, start: "top 60%", end: "bottom bottom", scrub: 0.7 } });
  ft.from($(".finale .layer--sky"), { yPercent: -10, scale: 1.15, duration: 0.6, ease: "none" }, 0)
    .from($(".finale .layer--city"), { yPercent: 18, duration: 0.5, ease: "power2.out" }, 0)
    .fromTo("#pd-fin .pd__g", { yPercent: -150, rotate: () => gsap.utils.random(-14, 14), opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.2, ease: "back.out(2.4)", stagger: 0.02 }, 0.18)
    .fromTo(car, { x: () => innerWidth * 0.9, rotate: -1.5 }, { x: 0, rotate: 0, duration: 0.32, ease: "power4.out" }, 0.42)
    .to(car, { keyframes: { rotate: [0, 1.6, -0.6, 0], y: [0, -10, 3, 0] }, duration: 0.1, ease: "none" }, 0.72)
    .fromTo(smoke, { opacity: 0, scale: 0.4 }, { opacity: 0.85, scale: 1.2, duration: 0.08, stagger: 0.02 }, 0.7)
    .to(smoke, { opacity: 0, scale: 2.2, x: () => innerWidth * 0.06, duration: 0.16 }, 0.8)
    .from(".finale__copy", { y: 40, opacity: 0, duration: 0.12, ease: "power3.out" }, 0.8);
})();
