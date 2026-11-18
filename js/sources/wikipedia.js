const APP_UA = "FeedBelajarPWA/1.0 (personal-use, offline learning feed)";

const TOPIC_QUERIES = {
  history: { id: ["sejarah", "perang", "kerajaan", "revolusi"], en: ["history", "war", "empire", "revolution"] },
  science: { id: ["sains", "fisika", "kimia", "biologi", "astronomi"], en: ["science", "physics", "chemistry", "biology", "astronomy"] },
  psychology: { id: ["psikologi", "perilaku manusia", "kognitif"], en: ["psychology", "human behavior", "cognitive science"] },
  business: { id: ["ekonomi", "bisnis", "perusahaan", "keuangan"], en: ["economics", "business", "company", "finance"] },
  health: { id: ["kesehatan", "olahraga", "nutrisi", "kedokteran"], en: ["health", "sports", "nutrition", "medicine"] },
  geography: { id: ["geografi", "negara", "gunung", "sungai"], en: ["geography", "country", "mountain", "river"] },
};

const STUB_PATTERNS = [
  /village in/i, /municipality/i, /commune in/i, /district in/i,
  /genus of/i, /species of/i, /desa di/i, /kecamatan di/i,
  /\bgenus\b/i, /\bspesies\b/i,
];

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "Api-User-Agent": APP_UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function withFallback(lang, taskFn) {
  try {
    return { lang, data: await taskFn(lang) };
  } catch (err) {
    if (lang !== "en") {
      const data = await taskFn("en");
      return { lang: "en", data };
    }
    throw err;
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export async function restRandomSummary(lang) {
  return fetchJSON(`https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`);
}

export async function restSummaryForTitle(lang, title) {
  return fetchJSON(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`
  );
}

export async function restFeaturedToday(lang, date = new Date()) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return withFallback(lang, (l) =>
    fetchJSON(`https://${l}.wikipedia.org/api/rest_v1/feed/featured/${y}/${m}/${d}`)
  );
}

export async function restOnThisDay(lang, date = new Date()) {
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return withFallback(lang, (l) =>
    fetchJSON(`https://${l}.wikipedia.org/api/rest_v1/feed/onthisday/all/${m}/${d}`)
  );
}

export async function actionSearchTitles(lang, query, limit = 20) {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search` +
    `&srsearch=${encodeURIComponent(query)}&srnamespace=0&srlimit=${limit}` +
    `&format=json&origin=*`;
  const data = await fetchJSON(url);
  return (data.query && data.query.search) || [];
}

export function isGoodQuality(summary) {
  if (!summary || !summary.extract) return false;
  if (summary.type === "disambiguation") return false;
  if (summary.extract.length < 200) return false;
  const haystack = `${summary.description || ""} ${summary.extract.slice(0, 160)}`;
  if (STUB_PATTERNS.some((p) => p.test(haystack))) return false;
  return true;
}

export function normalizeSummaryToCard(summary, { source, topic, lang, extra = {} }) {
  const thumb = summary.thumbnail || summary.originalimage || null;
  return {
    id: `${lang}-${summary.pageid || summary.title}-${source}`,
    source,
    lang,
    topic,
    title: summary.title,
    description: summary.description || "",
    extract: summary.extract || "",
    thumbnail: thumb,
    hasImage: !!thumb,
    contentUrl:
      (summary.content_urls && (summary.content_urls.desktop?.page || summary.content_urls.mobile?.page)) ||
      `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`,
    ...extra,
  };
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN(arr, n) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export async function fetchRandomBatch(lang, count) {
  const results = await Promise.allSettled(
    Array.from({ length: count }, () => restRandomSummary(lang))
  );
  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => ({ summary: r.value, source: "random" }));
}

export async function fetchTopicBatch(lang, topic, count) {
  const queries = TOPIC_QUERIES[topic]?.[lang] || TOPIC_QUERIES[topic]?.en || [topic];
  const query = pickRandom(queries);
  const hits = await actionSearchTitles(lang, query, 20);
  if (!hits.length) return [];
  const chosen = pickRandomN(hits, count);
  const results = await Promise.allSettled(
    chosen.map((h) => restSummaryForTitle(lang, h.title))
  );
  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => ({ summary: r.value, source: "topic-search" }));
}

export async function fetchFeaturedBatch(lang) {
  const { lang: usedLang, data } = await restFeaturedToday(lang);
  const out = [];
  if (data.tfa) out.push({ summary: data.tfa, source: "featured", lang: usedLang });
  const mostRead = data.mostread?.articles || [];
  mostRead.slice(0, 8).forEach((a) => out.push({ summary: a, source: "mostread", lang: usedLang }));
  return out;
}

export async function fetchOnThisDayRaw(lang, date = new Date()) {
  const { lang: usedLang, data } = await restOnThisDay(lang, date);
  return { lang: usedLang, events: data.events || [], births: data.births || [], deaths: data.deaths || [] };
}

export async function fetchOnThisDayBatch(lang, date = new Date()) {
  const { lang: usedLang, events } = await fetchOnThisDayRaw(lang, date);
  const out = [];
  for (const ev of events) {
    const page = ev.pages && ev.pages[0];
    if (!page) continue;
    out.push({
      summary: page,
      source: "onthisday",
      lang: usedLang,
      extra: { year: ev.year, onThisDayText: ev.text },
    });
  }
  return out;
}
