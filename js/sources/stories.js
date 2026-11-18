export const CATEGORY_META = {
  "sejarah-dunia": { label: "Sejarah Dunia", gradient: "linear-gradient(160deg, #6b3f23, #241409)" },
  "sejarah-indonesia": { label: "Sejarah Indonesia", gradient: "linear-gradient(160deg, #7a2418, #230d08)" },
  tokoh: { label: "Tokoh", gradient: "linear-gradient(160deg, #4a3178, #170f28)" },
  penemuan: { label: "Penemuan", gradient: "linear-gradient(160deg, #1f5a73, #0b1f28)" },
  "sains-sehari-hari": { label: "Sains Sehari-hari", gradient: "linear-gradient(160deg, #1f5c43, #0b2419)" },
  "tubuh-kesehatan-olahraga": { label: "Tubuh, Kesehatan & Olahraga", gradient: "linear-gradient(160deg, #7a3523, #27120a)" },
  "psikologi-kebiasaan": { label: "Psikologi & Kebiasaan", gradient: "linear-gradient(160deg, #7a5a1e, #27200a)" },
  "bisnis-ekonomi": { label: "Bisnis & Ekonomi", gradient: "linear-gradient(160deg, #1f3f73, #0b1628)" },
  "alam-geografi-luar-angkasa": { label: "Alam, Geografi & Luar Angkasa", gradient: "linear-gradient(160deg, #19534a, #091d19)" },
  custom: { label: "Catatan Saya", gradient: "linear-gradient(160deg, #1f3a30, #0b1712)" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_META).filter((k) => k !== "custom");

let cache = null;

export async function loadAllStories() {
  if (cache) return cache;
  const results = await Promise.allSettled(
    CATEGORY_KEYS.map((cat) => fetch(`./content/stories/${cat}.json`).then((r) => r.json()))
  );
  cache = results.flatMap((r) => (r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []));
  return cache;
}

export function localizeStory(story, lang) {
  const loc = story[lang] || story.id || story.en;
  return {
    id: story.key,
    category: story.category,
    emoji: story.emoji || "📘",
    sourceUrl: story.sourceUrl || null,
    images: story.images || null,
    commonsImage: story.commonsImage || null,
    lang,
    title: loc.title,
    hook: loc.hook,
    story: loc.story,
    whyItMatters: loc.whyItMatters,
    keyFacts: loc.keyFacts || [],
    quiz: loc.quiz || [],
  };
}

export function storyImagePath(storyKey, file) {
  return `./assets/img/${storyKey}/${file}`;
}

export function categoryLabel(category) {
  return CATEGORY_META[category]?.label || category;
}

export function categoryGradient(category) {
  return CATEGORY_META[category]?.gradient || CATEGORY_META.custom.gradient;
}
