import {
  fetchRandomBatch,
  fetchTopicBatch,
  fetchFeaturedBatch,
  fetchOnThisDayBatch,
  isGoodQuality,
  normalizeSummaryToCard,
} from "./sources/wikipedia.js";
import { loadAllStories, localizeStory } from "./sources/stories.js";
import { getSettings, getSeenIds, getSavedCards } from "./storage.js";

const seenThisSessionWiki = new Set();
const categoryBags = new Map();

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickLang(settings) {
  if (settings.language === "id" || settings.language === "en") return settings.language;
  return Math.random() < settings.mixedRatio ? "en" : "id";
}

function ensureBag(category, keysInCategory, seenIds) {
  const existing = categoryBags.get(category);
  if (existing && existing.length) return;
  let unseen = keysInCategory.filter((k) => !seenIds.has(k));
  if (unseen.length === 0) unseen = [...keysInCategory];
  categoryBags.set(category, shuffle(unseen));
}

function categoryWeights(categories) {
  const saved = getSavedCards();
  const counts = {};
  categories.forEach((c) => (counts[c] = 0));
  saved.forEach((c) => {
    if (counts[c.category] !== undefined) counts[c.category] += 1;
  });
  return categories.map((category) => ({ category, weight: 1 + counts[category] * 0.5 }));
}

function pickWeightedCategory(weights) {
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    if (r < w.weight) return w.category;
    r -= w.weight;
  }
  return weights[weights.length - 1].category;
}

async function getNextStoryBatch(count) {
  const settings = getSettings();
  const all = await loadAllStories();
  if (!all.length) return [];

  const seenIds = getSeenIds();
  let categories = [...new Set(all.map((s) => s.category))];
  if (settings.category && settings.category !== "all") {
    categories = categories.filter((c) => c === settings.category);
  }
  if (!categories.length) return [];

  const byCategory = new Map();
  categories.forEach((c) => byCategory.set(c, all.filter((s) => s.category === c).map((s) => s.key)));
  const weights = categoryWeights(categories);

  const out = [];
  let attempts = 0;
  while (out.length < count && attempts < count * 6) {
    attempts += 1;
    const category = pickWeightedCategory(weights);
    const keysInCategory = byCategory.get(category);
    if (!keysInCategory || !keysInCategory.length) continue;
    ensureBag(category, keysInCategory, seenIds);
    const bag = categoryBags.get(category);
    if (!bag.length) continue;
    const key = bag.pop();

    const story = all.find((s) => s.key === key);
    if (!story) continue;
    const card = localizeStory(story, pickLang(settings));
    out.push(card);
  }
  return out;
}

async function collectWikiCandidates(lang, topic, desiredCount) {
  const raw =
    topic === "random"
      ? await fetchRandomBatch(lang, desiredCount * 2)
      : await fetchTopicBatch(lang, topic, desiredCount * 2);

  let good = raw.filter((c) => isGoodQuality(c.summary));

  if (good.length < desiredCount) {
    const reroute = [];
    try {
      reroute.push(...(await fetchFeaturedBatch(lang)));
    } catch {
      /* featured feed unavailable for this lang/date: skip */
    }
    try {
      reroute.push(...(await fetchOnThisDayBatch(lang)));
    } catch {
      /* on-this-day feed unavailable: skip */
    }
    good = good.concat(reroute.filter((c) => isGoodQuality(c.summary)));
  }

  return good;
}

async function getNextExploreBatch(count) {
  const settings = getSettings();
  const seenIds = getSeenIds();
  const lang = pickLang(settings);

  let candidates = [];
  try {
    candidates = await collectWikiCandidates(lang, "random", count);
  } catch {
    candidates = [];
  }

  let cards = candidates.map((c) =>
    normalizeSummaryToCard(c.summary, {
      source: c.source,
      topic: "random",
      lang: c.lang || lang,
      extra: c.extra,
    })
  );

  cards = cards.filter((card) => !seenIds.has(card.id) && !seenThisSessionWiki.has(card.id));
  cards.sort((a, b) => Number(b.hasImage) - Number(a.hasImage));

  const finalCards = cards.slice(0, count);
  finalCards.forEach((c) => seenThisSessionWiki.add(c.id));
  return finalCards;
}

export async function getNextBatch(count = 5) {
  const settings = getSettings();
  if (settings.exploreMode) return getNextExploreBatch(count);
  return getNextStoryBatch(count);
}
