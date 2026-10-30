(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Heures et statut (heure de Montréal) ---------- */
  const HOURS = { 0: [12, 19], 1: [11, 19], 2: [11, 20], 3: [11, 21], 4: [11, 21], 5: [11, 21], 6: [11, 20] };
  function montrealNow() {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Toronto", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, h: (+get("hour") % 24) + +get("minute") / 60 };
  }
  function updateStatus() {
    const { day, h } = montrealNow();
    const [o, c] = HOURS[day];
    const open = h >= o && h < c;
    const el = $("#status");
    el.classList.toggle("is-open", open);
    el.classList.toggle("is-closed", !open);
    $("b", el).textContent = open ? `Ouvert jusqu'à ${c} h` : "Fermé pour le moment";
    $$("#hours li").forEach(li => li.classList.toggle("is-today", +li.dataset.day === day));
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Menu ---------- */
  const money = v => typeof v === "number" ? v.toFixed(2).replace(".", ",").replace(",00", "") + " $" : v;
  const menu = window.CHALA_MENU || [];
  const tabs = $("#tabs"), grid = $("#menuGrid");
  function renderCat(id, animate) {
    const cat = menu.find(c => c.id === id);
    $$(".tab", tabs).forEach(t => t.setAttribute("aria-selected", t.dataset.id === id));
    grid.innerHTML = cat.items.map(([name, size, price]) => `
      <div class="mi"><span class="mi__name">${name}${size ? `<span class="mi__size">${size}</span>` : ""}</span><span class="mi__dots"></span><span class="mi__price">${money(price)}</span></div>`).join("");
    if (animate && hasGsap && !reduce) {
      gsap.from($$(".mi", grid), { y: 24, opacity: 0, duration: .55, stagger: .035, ease: "power3.out" });
    }
  }
  tabs.innerHTML = menu.map(c => `<button class="tab" role="tab" data-id="${c.id}">${c.label}<small>${c.kreyol}</small></button>`).join("");
  tabs.addEventListener("click", e => { const b = e.target.closest(".tab"); if (b) renderCat(b.dataset.id, true); });
  if (menu.length) renderCat(menu[0].id, false);

  /* ---------- Nav mobile ---------- */
  const burger = $("#burger"), drawer = $("#drawer");
  const toggleDrawer = force => {
    const open = force ?? !drawer.classList.contains("is-open");
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleDrawer());
  $$("a", drawer).forEach(a => a.addEventListener("click", () => toggleDrawer(false)));

  if (!hasGsap || reduce) {
    $("#loader")?.remove();
    document.documentElement.classList.remove("js");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const target = $(a.getAttribute("href"));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -60 }); }
    }));
  }

  /* ---------- Nav scroll state ---------- */
  const nav = $("#nav");
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle("is-scrolled", y > 40);
      nav.classList.toggle("is-hidden", y > 500 && y > lastY && !drawer.classList.contains("is-open"));
      lastY = y;
    }
  });

  /* ---------- Split helpers ---------- */
  $$(".split").forEach(el => {
    el.innerHTML = [...el.textContent].map(ch => `<span class="char">${ch}</span>`).join("");
  });
  $$(".split-lines").forEach(el => {
    const words = el.textContent.trim().split(" ");
    el.innerHTML = words.map(w => `<span class="line" style="display:inline-block"><span>${w}</span></span>`).join(" ");
  });

  /* ---------- Brush paths ---------- */
  const prepPath = p => { const l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); return p; };
  const heroBrush = prepPath($(".hero__brush path"));
  const loaderBrush = prepPath($(".loader__brush path"));

  /* ---------- Initial states ---------- */
  gsap.set(".hero__title .char", { yPercent: 110, rotate: 8 });
  gsap.set(".reveal-up", { y: 30, opacity: 0 });
  gsap.set(".plate", { scale: 0, rotate: -40 });
  gsap.set(".badge", { scale: 0 });

  /* ---------- Loader → Hero ---------- */
  document.body.classList.add("is-loading");
  const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  intro
    .to(".loader__word span", { y: 0, duration: .9, stagger: .07 })
    .to(".loader__script", { opacity: 1, duration: .6 }, "-=.5")
    .to(loaderBrush, { strokeDashoffset: 0, duration: .7, ease: "power2.inOut" }, "-=.4")
    .to(".loader__panel", { scaleY: 1, duration: .6, ease: "power3.inOut", stagger: .05 }, "+=.25")
    .set(".loader__inner", { opacity: 0 })
    .to("#loader", { clipPath: "inset(0 0 100% 0)", duration: .9, ease: "power4.inOut" })
    .add(() => { $("#loader").remove(); document.body.classList.remove("is-loading"); })
    .to(".hero__title .char", { yPercent: 0, rotate: 0, duration: 1.1, stagger: .06 }, "-=.45")
    .to(heroBrush, { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" }, "-=.7")
    .to(".reveal-up", { y: 0, opacity: 1, duration: .9, stagger: .1 }, "-=.9")
    .to(".plate", { scale: 1, rotate: 0, duration: 1.3, stagger: .12, ease: "elastic.out(1, .7)" }, "-=1")
    .to(".badge", { scale: 1, duration: .9, ease: "back.out(2)" }, "-=.8");

  /* ---------- Hero parallax + idle float ---------- */
  $$(".plate").forEach((p, i) => {
    gsap.to(p, { y: () => -120 * +p.dataset.speed, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to($("img", p), { rotate: i % 2 ? -360 : 360, duration: 90 + i * 20, repeat: -1, ease: "none" });
  });
  gsap.to(".hero__content", { yPercent: 18, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // Hero plates follow the pointer a little
  const plates = $(".hero__plates");
  if (matchMedia("(pointer:fine)").matches) {
    window.addEventListener("pointermove", e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      $$(".plate", plates).forEach(p => gsap.to(p, { x: x * 40 * +p.dataset.speed, rotateZ: x * 6, duration: 1.2, ease: "power3.out", overwrite: "auto" }));
    });
  }

  /* ---------- Marquee with scroll velocity ---------- */
  const track = $(".marquee__track");
  track.innerHTML += track.innerHTML;
  const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
  ScrollTrigger.create({
    onUpdate: self => {
      const v = self.getVelocity();
      gsap.to(loop, { timeScale: (v < 0 ? -1 : 1) * Math.min(1 + Math.abs(v) / 300, 5), duration: .2, overwrite: true });
      gsap.to(track, { skewX: gsap.utils.clamp(-8, 8, v / -250), duration: .3, overwrite: "auto" });
    }
  });
  ScrollTrigger.addEventListener("scrollEnd", () => {
    gsap.to(loop, { timeScale: Math.sign(loop.timeScale()) || 1, duration: 1 });
    gsap.to(track, { skewX: 0, duration: .6 });
  });

  /* ---------- Headings line reveal ---------- */
  $$(".split-lines").forEach(el => {
    gsap.from($$(".line > span", el), { yPercent: 110, duration: 1, stagger: .06, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 85%" } });
  });
  $$(".h2:not(.split-lines)").forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
  $$(".eyebrow").forEach(el => gsap.from(el, { x: -30, opacity: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
  $$(".fade-in").forEach(el => gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));

  /* ---------- Story ---------- */
  gsap.fromTo(".story__photo", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "power4.inOut", scrollTrigger: { trigger: ".story", start: "top 70%" } });
  gsap.fromTo(".story__photo img", { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".story", start: "top bottom", end: "bottom top", scrub: true } });
  $$(".ferdecoupe path, .ferdecoupe circle").forEach(prepPath);
  gsap.to(".ferdecoupe path, .ferdecoupe circle", { strokeDashoffset: 0, duration: 2.4, stagger: .12, ease: "power2.inOut", scrollTrigger: { trigger: ".story", start: "top 65%" } });
  $$("[data-count]").forEach(el => {
    const o = { v: 0 }, end = +el.dataset.count;
    gsap.to(o, { v: end, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" }, onUpdate: () => el.textContent = Math.round(o.v) + (end === 60 ? "+" : "") });
  });

  /* ---------- Dishes: horizontal pin (desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 961px)", () => {
    const tr = $("#track");
    const dist = () => tr.scrollWidth - innerWidth;
    gsap.to(tr, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".dishes", pin: ".dishes__pin", start: "top top", end: () => "+=" + dist(), scrub: 1, invalidateOnRefresh: true }
    });
    gsap.from(".dish", { y: 80, rotate: 4, opacity: 0, stagger: .08, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".dishes", start: "top 70%" } });
  });
  mm.add("(max-width: 960px)", () => {
    gsap.from(".dish", { y: 50, opacity: 0, stagger: .08, duration: .9, ease: "power3.out", scrollTrigger: { trigger: ".dishes", start: "top 75%" } });
  });

  /* ---------- Menu items reveal ---------- */
  ScrollTrigger.create({ trigger: "#tabs", start: "top 92%", once: true, onEnter: () => gsap.fromTo(".tab", { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .04, duration: .6, ease: "power3.out", clearProps: "transform,opacity,visibility" }) });
  ScrollTrigger.create({ trigger: "#menuGrid", start: "top 85%", once: true, onEnter: () => gsap.from($$(".mi", grid), { y: 24, opacity: 0, duration: .55, stagger: .035, ease: "power3.out" }) });

  /* ---------- Feast parallax ---------- */
  gsap.fromTo(".feast__img", { yPercent: -8, scale: 1.15 }, { yPercent: 8, scale: 1, ease: "none", scrollTrigger: { trigger: ".feast", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".feast__title span", { yPercent: 60, opacity: 0, scale: .8, stagger: .15, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: ".feast", start: "top 60%" } });

  /* ---------- Visit ---------- */
  gsap.from(".hours li", { x: -30, opacity: 0, stagger: .06, duration: .6, ease: "power3.out", scrollTrigger: { trigger: ".hours", start: "top 85%" } });
  gsap.from(".visit__map", { y: 80, rotate: 6, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".visit__map", start: "top 85%" } });
  gsap.fromTo(".footer__big", { yPercent: 40 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

  /* ---------- Magnetic buttons ---------- */
  if (matchMedia("(pointer:fine)").matches) {
    $$(".magnetic").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: "elastic.out(1, .4)" }));
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
