/* Données modifiables par l'espace propriétaire.
   Version démo : enregistrées dans le navigateur (localStorage).
   Version finale : base de données Cloudflare D1, même structure. */
window.ChalaStore = (() => {
  const KEY = "chala-admin-v1";
  const DEFAULT_HOURS = {
    1: { o: "11:00", c: "19:00", closed: false },
    2: { o: "11:00", c: "20:00", closed: false },
    3: { o: "11:00", c: "21:00", closed: false },
    4: { o: "11:00", c: "21:00", closed: false },
    5: { o: "11:00", c: "21:00", closed: false },
    6: { o: "11:00", c: "20:00", closed: false },
    0: { o: "12:00", c: "19:00", closed: false }
  };
  const DAYS = { 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi", 0: "Dimanche" };
  const clone = o => JSON.parse(JSON.stringify(o));
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch { return false; } };

  return {
    DAYS,
    menu: () => load().menu || clone(window.CHALA_MENU || []),
    hours: () => load().hours || clone(DEFAULT_HOURS),
    banner: () => load().banner || { on: false, text: "" },
    set(key, value) { const d = load(); d[key] = value; d.updated = new Date().toISOString(); return save(d); },
    updated: () => load().updated || null,
    reset() { try { localStorage.removeItem(KEY); } catch {} },
    /* "11:30" -> 11.5 */
    toNum: t => { const [h, m] = t.split(":").map(Number); return h + (m || 0) / 60; },
    /* "11:30" -> "11 h 30", "11:00" -> "11 h" */
    label: t => { const [h, m] = t.split(":"); return `${+h} h${m && m !== "00" ? " " + m : ""}`; }
  };
})();
