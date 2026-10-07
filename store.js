import * as config from "./config.js";

const { FIREBASE_CONFIG, ROOT, CATEGORIES } = config;

const listeners = new Set();
let current = {};
let loaded = false;
const emit = () => listeners.forEach((cb) => cb(current));

const placeholder = !FIREBASE_CONFIG?.databaseURL || FIREBASE_CONFIG.databaseURL.includes("YOUR_");
// A copy of this repo hosted somewhere else still carries the original owner's database settings.
// Run it in demo mode there instead of writing votes into someone else's database.
const liveHosts = config.LIVE_HOSTS || [];
const wrongHost = liveHosts.length > 0 && !liveHosts.includes(location.hostname);
if (wrongHost && !placeholder)
  console.warn(`Demo mode: "${location.hostname}" isn't in LIVE_HOSTS in config.js. ` +
    "To go live, put your own Firebase settings in config.js and add your site's hostname to LIVE_HOSTS.");

export const DEMO = placeholder || wrongHost;

const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
let writeFn, app, db, fb;
if (!DEMO) {
  const { initializeApp } = await import(SDK + "firebase-app.js");
  fb = await import(SDK + "firebase-database.js");
  const { getDatabase, ref, onValue, set } = fb;
  app = initializeApp(FIREBASE_CONFIG);
  db = getDatabase(app);
  onValue(ref(db, ROOT), (snap) => { current = snap.val() || {}; loaded = true; emit(); });
  writeFn = (path, value) => set(ref(db, path ? `${ROOT}/${path}` : ROOT), value ?? null);
} else {
  const KEY = "halloween-demo-" + ROOT;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  current = load(); loaded = true;
  addEventListener("storage", (e) => { if (e.key === KEY) { current = load(); emit(); } });
  writeFn = async (path, value) => {
    let data = load();
    if (!path) data = value ?? {};
    else {
      const parts = path.split("/"), last = parts.pop();
      let o = data;
      for (const p of parts) o = o[p] ??= {};
      if (value == null) delete o[last]; else o[last] = value;
    }
    localStorage.setItem(KEY, JSON.stringify(data));
    current = data; emit();
  };
}

// Host sign-in (TV only, loaded on demand so phones don't download it).
// The database rules only let the host's account open/close voting or delete votes.
let authApi;
async function hostAuth() {
  if (!authApi) {
    const m = await import(SDK + "firebase-auth.js");
    authApi = { ...m, auth: m.getAuth(app) };
  }
  return authApi;
}
export async function watchHost(cb) {
  if (DEMO) return cb(true); // demo mode has no database to protect
  const a = await hostAuth();
  a.onAuthStateChanged(a.auth, (user) => cb(!!user));
}
export async function hostSignIn() {
  const a = await hostAuth();
  await a.signInWithPopup(a.auth, new a.GoogleAuthProvider());
}
export async function hostSignOut() {
  if (DEMO) return;
  const a = await hostAuth();
  await a.signOut(a.auth);
}

export function onData(cb) { listeners.add(cb); if (loaded) cb(current); }
export const write = (path, value) => writeFn(path, value);

// Party code: the TV's QR carries a secret code, and the database only accepts a ballot
// that comes with it, so only people who can see the TV can vote. The code is stored where
// only the host can read it, and each phone's copy goes to a write-only "proofs" list.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CODE_CHARS[b % 32]).join("");

export async function partyCode({ renew = false } = {}) {
  if (DEMO) {
    let code = renew ? null : localStorage.getItem("halloween-demo-code");
    if (!code) { code = newCode(); localStorage.setItem("halloween-demo-code", code); }
    return code;
  }
  const r = fb.ref(db, `codes/${ROOT}`);
  let code = renew ? null : (await fb.get(r)).val();
  if (!code) { code = newCode(); await fb.set(r, code); }
  return code;
}

export async function castVote(ballot, code) {
  const me = voterId();
  if (DEMO) return writeFn(`votes/${me}`, ballot);
  // Both writes land together or not at all; the rules check the proof matches the code.
  await fb.update(fb.ref(db), { [`proofs/${ROOT}/${me}`]: code || "", [`${ROOT}/votes/${me}`]: ballot });
}

export async function resetVotes() {
  if (DEMO) return writeFn("votes", null);
  await fb.update(fb.ref(db), { [`${ROOT}/votes`]: null, [`proofs/${ROOT}`]: null });
}

// One id per phone so re-voting replaces the old vote instead of adding one.
export function voterId() {
  let id = localStorage.getItem("halloween-voter-id");
  if (!id) { id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem("halloween-voter-id", id); }
  return id;
}

// "  maria   LÓPEZ " and "María López" count as the same person (ignores spaces, case and accents).
export const normalize = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLowerCase();

export const isOpen = (data) => data?.state?.open !== false;

// Per category: [{ name, votes }] sorted high to low. Display name = most-used spelling.
export function tally(data) {
  const votes = Object.values(data?.votes || {});
  return CATEGORIES.map((cat) => {
    const groups = new Map();
    for (const v of votes) {
      const raw = v?.[cat.id];
      const key = normalize(raw);
      if (!key) continue;
      const g = groups.get(key) || { votes: 0, spellings: {} };
      g.votes++;
      const shown = raw.trim().replace(/\s+/g, " ");
      g.spellings[shown] = (g.spellings[shown] || 0) + 1;
      groups.set(key, g);
    }
    const ranked = [...groups.values()]
      .map((g) => ({ name: Object.entries(g.spellings).sort((a, b) => b[1] - a[1])[0][0], votes: g.votes }))
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
    return { cat, ranked, total: ranked.reduce((s, r) => s + r.votes, 0) };
  });
}

// Every name anyone has typed, for autocomplete.
export function knownNames(data) {
  const seen = new Map();
  for (const v of Object.values(data?.votes || {}))
    for (const raw of Object.values(v || {})) {
      const k = normalize(raw);
      if (k && !seen.has(k)) seen.set(k, raw.trim().replace(/\s+/g, " "));
    }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
