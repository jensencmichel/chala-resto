(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const motion = document.documentElement.classList.contains("motion") && typeof window.gsap !== "undefined";

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Guirlande ---------- */
  $$("[data-bunting]").forEach(el => {
    const n = Math.ceil(window.innerWidth / 50) + 4;
    el.innerHTML = "<span></span>".repeat(n);
  });

  /* ---------- Heures (heure de Montréal) ---------- */
  const HOURS = { 0: [12, 19], 1: [11, 19], 2: [11, 20], 3: [11, 21], 4: [11, 21], 5: [11, 21], 6: [11, 20] };
  const now = () => {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Toronto", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t).value;
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")), h: (+g("hour") % 24) + +g("minute") / 60 };
  };
  function updateHours() {
    const { day, h } = now();
    const [o, c] = HOURS[day];
    const open = h >= o && h < c;
    const st = $("#sticker");
    st.classList.toggle("is-closed", !open);
    st.innerHTML = open
      ? `<span>Ouvert</span><small>jusqu'à ${c} h</small>`
      : h < o ? `<span>Fermé</span><small>ouvre à ${o} h</small>` : `<span>Fermé</span><small>à demain</small>`;
    $$("#hours tr").forEach(tr => tr.classList.toggle("is-today", +tr.dataset.day === day));
  }
  updateHours();
  setInterval(updateHours, 60000);

  /* ---------- Menu ---------- */
  const money = v => typeof v === "number" ? v.toFixed(2).replace(".", ",").replace(/,00$/, "") + " $" : v;
  const menu = window.CHALA_MENU || [];
  const tabs = $("#tabs"), list = $("#menuGrid");
  const paint = cat => cat.items.map(([n, s, p]) =>
    `<div class="mi"><span class="mi__name">${n}${s ? `<span class="mi__size">${s}</span>` : ""}</span><span class="mi__dots"></span><span class="mi__price">${money(p)}</span></div>`).join("");

  function select(id) {
    const cat = menu.find(c => c.id === id);
    $$(".tab", tabs).forEach(t => { const on = t.dataset.id === id; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
    list.setAttribute("aria-label", cat.label);
    if (!motion || !list.children.length) { list.innerHTML = paint(cat); return; }
    gsap.to(list, { opacity: 0, y: 8, duration: .15, onComplete: () => {
      list.innerHTML = paint(cat);
      gsap.to(list, { opacity: 1, y: 0, duration: .3, ease: "power2.out" });
    }});
  }
  tabs.innerHTML = menu.map(c => `<button class="tab" role="tab" data-id="${c.id}">${c.label}</button>`).join("");
  tabs.addEventListener("click", e => { const b = e.target.closest(".tab"); if (b) select(b.dataset.id); });
  tabs.addEventListener("keydown", e => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const all = $$(".tab", tabs), i = all.indexOf(document.activeElement);
    const next = all[(i + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length];
    next.focus(); select(next.dataset.id);
  });
  if (menu.length) select(menu[0].id);

  /* ---------- Fiche du plat (cliquable) ---------- */
  const sheet = $("#sheet");
  $$(".plate__btn").forEach(btn => btn.addEventListener("click", () => {
    $("#sheet-img").src = btn.dataset.img;
    $("#sheet-img").alt = btn.dataset.name;
    $("#sheet-name").textContent = btn.dataset.name;
    $("#sheet-desc").textContent = btn.dataset.desc;
    $("#sheet-sizes").innerHTML = btn.dataset.sizes.split("|").map(x => { const [k, v] = x.split("="); return `<tr><th scope="row">${k}</th><td>${v}</td></tr>`; }).join("");
    sheet.showModal();
    if (motion) {
      gsap.fromTo(sheet, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: "power3.out" });
      gsap.fromTo("#sheet-img", { scale: .7, rotate: -18 }, { scale: 1, rotate: 0, duration: .6, ease: "back.out(1.6)" });
    }
  }));
  sheet.addEventListener("click", e => { if (e.target === sheet) sheet.close(); });

  if (!motion) return;

  /* ---------- La seule séquence : l'enseigne se peint ---------- */
  document.fonts.ready.then(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".sign .bunting span", { yPercent: -110, rotate: () => gsap.utils.random(-14, 14), duration: .7, stagger: .025, ease: "back.out(1.6)" })
      .from(".sign__script", { opacity: 0, x: -20, duration: .5 }, .2)
      .from(".layer--face", { clipPath: "inset(0 100% 0 0)", duration: 1.1, ease: "power2.inOut" }, .35)
      .from(".layer--shade", { clipPath: "inset(0 100% 0 0)", duration: 1.1, ease: "power2.inOut" }, .5)
      .from(".layer--back", { opacity: 0, x: "-=0.08em", y: "-=0.08em", duration: .6 }, 1.25)
      .from(".sign__lead, .sign__actions", { opacity: 0, y: 14, duration: .6, stagger: .1 }, 1.2)
      .from(".sign__photo", { opacity: 0, rotate: -8, y: 40, duration: .9, ease: "back.out(1.4)" }, 1.25)
      .from(".sticker", { scale: 0, rotate: -40, duration: .6, ease: "back.out(2.4)" }, 1.8);
  });
})();
