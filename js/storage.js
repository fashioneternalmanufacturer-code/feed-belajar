const KEYS = {
  SETTINGS: "fb_settings",
  SAVED: "fb_saved",
  VOCAB: "fb_vocab",
  SEEN: "fb_seen_ids",
  STATS: "fb_stats",
};

const DEFAULT_SETTINGS = {
  language: "mixed", // "mixed" | "id" | "en"
  mixedRatio: 0.6, // proportion English in mixed mode
  category: "all", // "all" or one of the story category keys
  sessionLimit: 20,
  quizEnabled: true,
  exploreMode: false, // Mode Jelajah: live Wikipedia random/featured articles
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable: ignore, app still works in-memory for this session */
  }
}

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...readJSON(KEYS.SETTINGS, {}) };
}

export function saveSettings(partial) {
  const next = { ...getSettings(), ...partial };
  writeJSON(KEYS.SETTINGS, next);
  return next;
}

export function getSavedCards() {
  return readJSON(KEYS.SAVED, []);
}

export function isCardSaved(id) {
  return getSavedCards().some((c) => c.id === id);
}

export function toggleSavedCard(card) {
  const list = getSavedCards();
  const idx = list.findIndex((c) => c.id === card.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    writeJSON(KEYS.SAVED, list);
    return false;
  }
  list.unshift({ ...card, savedAt: Date.now() });
  writeJSON(KEYS.SAVED, list);
  return true;
}

export function removeSavedCard(id) {
  const list = getSavedCards().filter((c) => c.id !== id);
  writeJSON(KEYS.SAVED, list);
}

export function getVocab() {
  return readJSON(KEYS.VOCAB, []);
}

export function addVocabWord(entry) {
  const list = getVocab();
  const idx = list.findIndex((w) => w.word.toLowerCase() === entry.word.toLowerCase());
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...entry, timesSeen: (list[idx].timesSeen || 1) + 1 };
  } else {
    list.unshift({ ...entry, addedAt: Date.now(), timesSeen: 1 });
  }
  writeJSON(KEYS.VOCAB, list);
}

export function removeVocabWord(word) {
  const list = getVocab().filter((w) => w.word.toLowerCase() !== word.toLowerCase());
  writeJSON(KEYS.VOCAB, list);
}

export function getSeenIds() {
  return new Set(readJSON(KEYS.SEEN, []));
}

export function markSeen(id) {
  const seen = readJSON(KEYS.SEEN, []);
  seen.push(id);
  // keep memory bounded: remember only the most recent 500 ids
  const trimmed = seen.slice(-500);
  writeJSON(KEYS.SEEN, trimmed);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getStats() {
  return readJSON(KEYS.STATS, {
    totalCardsRead: 0,
    byDay: {},
    streak: 0,
    lastReadDay: null,
  });
}

export function recordCardRead() {
  const stats = getStats();
  const today = todayKey();
  stats.totalCardsRead += 1;
  stats.byDay[today] = (stats.byDay[today] || 0) + 1;

  if (stats.lastReadDay !== today) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayKey = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
    stats.streak = stats.lastReadDay === yesterdayKey ? stats.streak + 1 : 1;
    stats.lastReadDay = today;
  }
  writeJSON(KEYS.STATS, stats);
  return stats;
}

export function getTodayCount() {
  const stats = getStats();
  return stats.byDay[todayKey()] || 0;
}

export function getWeekCount() {
  const stats = getStats();
  const now = new Date();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    total += stats.byDay[key] || 0;
  }
  return total;
}
