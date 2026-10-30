(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const S = window.ChalaStore;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const flash = (el, msg) => { el.textContent = msg; clearTimeout(el._t); el._t = setTimeout(() => (el.textContent = ""), 3500); };

  /* ---------- Connexion (démo) ---------- */
  const SESSION = "chala-admin-session";
  const enter = () => { $("#login").hidden = true; $("#app").hidden = false; renderAll(); };
  try { if (sessionStorage.getItem(SESSION)) enter(); } catch {}
  $("#loginForm").addEventListener("submit", e => {
    e.preventDefault();
    if ($("#code").value.trim().toLowerCase() === "chala") {
      try { sessionStorage.setItem(SESSION, "1"); } catch {}
      enter();
    } else { $("#loginError").hidden = false; $("#code").select(); }
  });

  /* ---------- Navigation ---------- */
  function show(view) {
    $$(".view").forEach(v => (v.hidden = v.dataset.view !== view));
    $$(".nav-btn").forEach(b => b.dataset.view === view ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
    if (view === "accueil") renderToday();
    window.scrollTo(0, 0);
  }
  $$(".nav-btn").forEach(b => b.addEventListener("click", () => show(b.dataset.view)));
  $$("[data-goto]").forEach(b => b.addEventListener("click", () => show(b.dataset.goto)));
  $("#reset").addEventListener("click", () => { S.reset(); renderAll(); show("accueil"); });

  /* ---------- Aujourd'hui ---------- */
  function renderToday() {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Toronto", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
    const h = (+g("hour") % 24) + +g("minute") / 60;
    const x = S.hours()[day];
    const open = !x.closed && h >= S.toNum(x.o) && h < S.toNum(x.c);
    $("#cardStatus").classList.toggle("is-open", open);
    $("#cardStatus").classList.toggle("is-closed", !open);
    $("#todayStatus").textContent = open ? "Ouvert" : "Fermé";
    $("#todayHours").textContent = x.closed ? `${S.DAYS[day]} : fermé toute la journée` : `${S.DAYS[day]} : ${S.label(x.o)} à ${S.label(x.c)}`;
    const out = S.menu().reduce((n, c) => n + c.items.filter(i => i[3]).length, 0);
    $("#outCount").textContent = out;
    const b = S.banner();
    $("#bannerState").textContent = b.on && b.text ? "Affichée" : "Aucune";
  }

  /* ---------- Menu et prix ---------- */
  let menu = S.menu(), cat = menu[0]?.id;
  function renderCats() {
    $("#catTabs").innerHTML = menu.map(c => `<button type="button" class="chip" role="tab" data-id="${c.id}" aria-selected="${c.id === cat}">${esc(c.label)}</button>`).join("");
  }
  function rowHTML(item, i) {
    const [name, size, price, out] = item;
    const numeric = typeof price === "number";
    return `<div class="row${out ? " is-out" : ""}" data-i="${i}">
      <input aria-label="Nom du plat" class="name" value="${esc(name)}" required />
      <input aria-label="Format" class="size" value="${esc(size)}" placeholder="Format (ex. Grand plat)" />
      <span class="price"><input aria-label="Prix" class="pr" inputmode="decimal" value="${numeric ? price.toFixed(2).replace(".", ",") : esc(price)}" /></span>
      <label class="out"><input type="checkbox" class="oc"${out ? " checked" : ""} />Épuisé</label>
      <button type="button" class="del" aria-label="Retirer ${esc(name)}">Retirer</button>
    </div>`;
  }
  function renderRows() {
    const c = menu.find(x => x.id === cat);
    $("#menuRows").innerHTML = c.items.map(rowHTML).join("");
  }
  function readRows() {
    const c = menu.find(x => x.id === cat);
    c.items = $$("#menuRows .row").map(r => {
      const raw = $(".pr", r).value.trim();
      const num = parseFloat(raw.replace(",", "."));
      const price = /^\d+([.,]\d{1,2})?$/.test(raw) ? num : raw;
      return [$(".name", r).value.trim(), $(".size", r).value.trim(), price, $(".oc", r).checked];
    }).filter(i => i[0]);
  }
  $("#catTabs").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    readRows(); cat = b.dataset.id; renderCats(); renderRows();
  });
  $("#menuRows").addEventListener("change", e => {
    if (e.target.classList.contains("oc")) e.target.closest(".row").classList.toggle("is-out", e.target.checked);
  });
  $("#menuRows").addEventListener("click", e => {
    if (!e.target.classList.contains("del")) return;
    e.target.closest(".row").remove();
  });
  $("#addItem").addEventListener("click", () => {
    readRows();
    menu.find(x => x.id === cat).items.push(["", "", 0, false]);
    renderRows();
    $("#menuRows .row:last-child .name").focus();
  });
  $("#menuForm").addEventListener("submit", e => {
    e.preventDefault(); readRows();
    flash($("#menuSaved"), S.set("menu", menu) ? "Menu enregistré, le site est à jour." : "Enregistrement impossible dans ce navigateur.");
  });

  /* ---------- Annonce ---------- */
  function renderBanner() {
    const b = S.banner();
    $("#bannerOn").checked = b.on; $("#bannerText").value = b.text; preview();
  }
  function preview() {
    const t = $("#bannerText").value.trim(), on = $("#bannerOn").checked;
    $("#bannerPreview").textContent = t || "Votre annonce apparaîtra ici";
    $("#bannerPreview").classList.toggle("is-off", !on || !t);
  }
  $("#bannerText").addEventListener("input", preview);
  $("#bannerOn").addEventListener("change", preview);
  $$(".chip-idea").forEach(b => b.addEventListener("click", () => { $("#bannerText").value = b.textContent; $("#bannerOn").checked = true; preview(); }));
  $("#bannerForm").addEventListener("submit", e => {
    e.preventDefault();
    const ok = S.set("banner", { on: $("#bannerOn").checked, text: $("#bannerText").value.trim() });
    flash($("#bannerSaved"), ok ? ($("#bannerOn").checked ? "Annonce publiée sur le site." : "Annonce retirée du site.") : "Enregistrement impossible.");
  });

  /* ---------- Heures ---------- */
  function renderHours() {
    const H = S.hours();
    $("#hoursRows").innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => `
      <div class="hrow${H[d].closed ? " is-closed" : ""}" data-d="${d}">
        <b>${S.DAYS[d]}</b>
        <input type="time" class="o" value="${H[d].o}" aria-label="${S.DAYS[d]}, ouverture" step="900" />
        <span class="to">à</span>
        <input type="time" class="c" value="${H[d].c}" aria-label="${S.DAYS[d]}, fermeture" step="900" />
        <label class="out"><input type="checkbox" class="cl"${H[d].closed ? " checked" : ""} />Fermé</label>
      </div>`).join("");
  }
  $("#hoursRows").addEventListener("change", e => {
    if (e.target.classList.contains("cl")) e.target.closest(".hrow").classList.toggle("is-closed", e.target.checked);
  });
  $("#hoursForm").addEventListener("submit", e => {
    e.preventDefault();
    const H = {};
    for (const r of $$("#hoursRows .hrow")) {
      const o = $(".o", r).value, c = $(".c", r).value, closed = $(".cl", r).checked;
      if (!closed && (!o || !c || S.toNum(c) <= S.toNum(o))) { flash($("#hoursSaved"), `${S.DAYS[r.dataset.d]} : l'heure de fermeture doit suivre l'ouverture.`); $("#hoursSaved").style.color = "var(--wouj)"; return; }
      H[r.dataset.d] = { o, c, closed };
    }
    $("#hoursSaved").style.color = "";
    flash($("#hoursSaved"), S.set("hours", H) ? "Heures enregistrées." : "Enregistrement impossible.");
  });

  function renderAll() {
    menu = S.menu(); cat = menu[0]?.id;
    renderCats(); renderRows(); renderBanner(); renderHours(); renderToday();
  }
})();
