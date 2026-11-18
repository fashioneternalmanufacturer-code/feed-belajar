import { tokenizeExtract } from "./vocab.js";
import { isCardSaved } from "./storage.js";
import { categoryLabel, categoryGradient, storyImagePath } from "./sources/stories.js";

const TOPIC_LABELS = {
  random: "Acak",
  custom: "Catatan Saya",
};

const SOURCE_LABELS = {
  random: "Wikipedia · acak",
  "topic-search": "Wikipedia",
  featured: "Wikipedia · pilihan hari ini",
  mostread: "Wikipedia · paling banyak dibaca",
  onthisday: "Wikipedia · hari ini dalam sejarah",
};

const UI_STRINGS = {
  id: {
    minRead: (n) => `${n} menit baca`,
    whyItMatters: "Kenapa Ini Penting",
    keyFacts: "Fakta Kunci",
    quiz: "Kuis",
    source: "Sumber",
    save: "🔖 Simpan",
    saved: "🔖 Tersimpan",
    langToggle: "English",
    tapToRead: "Ketuk untuk baca cerita lengkap →",
    seeOriginal: "Lihat Aslinya",
  },
  en: {
    minRead: (n) => `${n} min read`,
    whyItMatters: "Why It Matters",
    keyFacts: "Key Facts",
    quiz: "Quiz",
    source: "Source",
    save: "🔖 Save",
    saved: "🔖 Saved",
    langToggle: "Indonesia",
    tapToRead: "Tap to read the full story →",
    seeOriginal: "See the Original",
  },
};

function strings(lang) {
  return UI_STRINGS[lang] || UI_STRINGS.id;
}

function topicLabel(topic) {
  return TOPIC_LABELS[topic] || topic;
}

function sourceLabel(source, lang) {
  const base = SOURCE_LABELS[source] || "Wikipedia";
  return `${base} (${lang.toUpperCase()})`;
}

function splitWordPunct(token) {
  const match = token.match(/^([^a-zA-Z']*)([a-zA-Z']+)([^a-zA-Z']*)$/);
  if (!match) return { lead: token, word: "", trail: "" };
  const [, lead, word, trail] = match;
  return { lead, word, trail };
}

function estimateReadMinutes(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function appendTappableText(parent, text, lang) {
  if (lang === "en") {
    tokenizeExtract(text).forEach((tok) => {
      const { lead, word, trail } = splitWordPunct(tok);
      if (lead) parent.appendChild(document.createTextNode(lead));
      if (word) {
        const span = document.createElement("span");
        span.className = "word";
        span.textContent = word;
        span.dataset.word = word;
        parent.appendChild(span);
      } else if (!lead && !trail) {
        parent.appendChild(document.createTextNode(tok));
      }
      if (trail) parent.appendChild(document.createTextNode(trail));
    });
  } else {
    parent.appendChild(document.createTextNode(text));
  }
}

export function renderStoryCard(card) {
  const t = strings(card.lang);
  const el = document.createElement("article");
  el.className = "card story-card";
  el.dataset.id = card.id;
  el.dataset.type = "story";
  el.style.background = categoryGradient(card.category);

  const heroEntry = card.images && card.images.hero;
  if (heroEntry) {
    const bg = document.createElement("div");
    bg.className = "story-card-bg";
    const img = document.createElement("img");
    img.className = "story-card-bg-img";
    img.loading = "lazy";
    img.src = storyImagePath(card.id, heroEntry.file);
    img.alt = "";
    img.onerror = () => bg.remove();
    bg.appendChild(img);
    const overlay = document.createElement("div");
    overlay.className = "story-card-bg-overlay";
    bg.appendChild(overlay);
    el.appendChild(bg);
  }

  const top = document.createElement("div");
  top.className = "story-card-top";
  const emojiEl = document.createElement("span");
  emojiEl.className = "story-card-emoji";
  emojiEl.textContent = card.emoji;
  top.appendChild(emojiEl);
  const catEl = document.createElement("span");
  catEl.className = "card-topic";
  catEl.textContent = categoryLabel(card.category);
  top.appendChild(catEl);
  el.appendChild(top);

  const body = document.createElement("div");
  body.className = "card-body";

  const titleEl = document.createElement("h2");
  titleEl.className = "card-title";
  titleEl.textContent = card.title;
  body.appendChild(titleEl);

  const hookEl = document.createElement("p");
  hookEl.className = "card-extract story-card-hook";
  hookEl.textContent = card.hook;
  body.appendChild(hookEl);

  const ctaEl = document.createElement("span");
  ctaEl.className = "story-card-cta";
  ctaEl.textContent = t.tapToRead;
  body.appendChild(ctaEl);

  const actions = document.createElement("div");
  actions.className = "card-actions story-card-actions";

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-small btn-save";
  const saved = isCardSaved(card.id);
  saveBtn.textContent = saved ? t.saved : t.save;
  saveBtn.classList.toggle("active", saved);
  actions.appendChild(saveBtn);

  const shareBtn = document.createElement("button");
  shareBtn.className = "btn btn-small btn-share";
  shareBtn.textContent = "↗";
  actions.appendChild(shareBtn);

  body.appendChild(actions);
  el.appendChild(body);
  return el;
}

function buildStoryFigure(card, entry) {
  const figure = document.createElement("figure");
  figure.className = "story-scene-figure";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.src = storyImagePath(card.id, entry.file);
  img.alt = entry.alt || "";
  img.onerror = () => figure.remove();
  figure.appendChild(img);
  if (entry.caption) {
    const caption = document.createElement("figcaption");
    caption.textContent = entry.caption;
    figure.appendChild(caption);
  }
  return figure;
}

export function renderStoryDetail(container, card) {
  container.innerHTML = "";
  const t = strings(card.lang);
  const minutes = estimateReadMinutes(card.story);

  container.style.setProperty("--story-accent-bg", categoryGradient(card.category));

  const metaText = `${card.emoji}  ${categoryLabel(card.category)} · ${t.minRead(minutes)}`;
  const heroEntry = card.images && card.images.hero;

  if (heroEntry) {
    const hero = document.createElement("div");
    hero.className = "story-detail-hero";
    const img = document.createElement("img");
    img.loading = "eager";
    img.src = storyImagePath(card.id, heroEntry.file);
    img.alt = heroEntry.alt || "";
    img.onerror = () => { img.style.display = "none"; };
    hero.appendChild(img);
    const overlay = document.createElement("div");
    overlay.className = "story-detail-hero-overlay";
    hero.appendChild(overlay);

    const textWrap = document.createElement("div");
    textWrap.className = "story-detail-hero-text";
    const meta = document.createElement("div");
    meta.className = "story-detail-meta";
    meta.textContent = metaText;
    textWrap.appendChild(meta);
    const title = document.createElement("h1");
    title.className = "story-detail-title";
    title.textContent = card.title;
    textWrap.appendChild(title);
    const hook = document.createElement("p");
    hook.className = "story-detail-hook";
    hook.textContent = card.hook;
    textWrap.appendChild(hook);
    hero.appendChild(textWrap);
    container.appendChild(hero);
  } else {
    const meta = document.createElement("div");
    meta.className = "story-detail-meta";
    meta.textContent = metaText;
    container.appendChild(meta);

    const title = document.createElement("h1");
    title.className = "story-detail-title";
    title.textContent = card.title;
    container.appendChild(title);

    const hook = document.createElement("p");
    hook.className = "story-detail-hook";
    hook.textContent = card.hook;
    container.appendChild(hook);
  }

  const sceneEntries = ["scene1", "scene2", "scene3"]
    .map((slot) => card.images && card.images[slot])
    .filter(Boolean);

  const body = document.createElement("div");
  body.className = "story-detail-body";
  const paragraphs = card.story.split(/\n+/).filter((p) => p.trim());
  const insertAfter = sceneEntries.map((_, i) =>
    Math.max(0, Math.round(((i + 1) * paragraphs.length) / (sceneEntries.length + 1)) - 1)
  );
  paragraphs.forEach((para, idx) => {
    const p = document.createElement("p");
    appendTappableText(p, para, card.lang);
    body.appendChild(p);
    const sceneIdx = insertAfter.indexOf(idx);
    if (sceneIdx !== -1) {
      body.appendChild(buildStoryFigure(card, sceneEntries[sceneIdx]));
    }
  });
  container.appendChild(body);

  const whySection = document.createElement("div");
  whySection.className = "story-detail-section";
  const whyHeading = document.createElement("h3");
  whyHeading.textContent = t.whyItMatters;
  whySection.appendChild(whyHeading);
  const whyText = document.createElement("p");
  whyText.textContent = card.whyItMatters;
  whySection.appendChild(whyText);
  container.appendChild(whySection);

  const factsSection = document.createElement("div");
  factsSection.className = "story-detail-section";
  const factsHeading = document.createElement("h3");
  factsHeading.textContent = t.keyFacts;
  factsSection.appendChild(factsHeading);
  const factsList = document.createElement("ul");
  factsList.className = "key-facts-list";
  (card.keyFacts || []).forEach((fact) => {
    const li = document.createElement("li");
    li.textContent = fact;
    factsList.appendChild(li);
  });
  factsSection.appendChild(factsList);
  container.appendChild(factsSection);

  if (card.quiz && card.quiz.length) {
    const quizSection = document.createElement("div");
    quizSection.className = "story-detail-section";
    const quizHeading = document.createElement("h3");
    quizHeading.textContent = t.quiz;
    quizSection.appendChild(quizHeading);

    card.quiz.forEach((q, qi) => {
      const qEl = document.createElement("div");
      qEl.className = "inline-quiz";
      qEl.dataset.correctIndex = String(q.correctIndex);
      qEl.dataset.answered = "false";
      qEl.dataset.explanation = q.explanation || "";

      const qText = document.createElement("p");
      qText.className = "inline-quiz-question";
      qText.textContent = `${qi + 1}. ${q.question}`;
      qEl.appendChild(qText);

      const optionsWrap = document.createElement("div");
      optionsWrap.className = "quiz-options";
      q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "quiz-option";
        btn.textContent = opt;
        btn.dataset.index = String(i);
        optionsWrap.appendChild(btn);
      });
      qEl.appendChild(optionsWrap);

      const feedback = document.createElement("p");
      feedback.className = "quiz-feedback";
      qEl.appendChild(feedback);

      quizSection.appendChild(qEl);
    });
    container.appendChild(quizSection);
  }

  const actions = document.createElement("div");
  actions.className = "story-detail-actions";
  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-primary btn-save";
  const saved = isCardSaved(card.id);
  saveBtn.textContent = saved ? t.saved : t.save;
  saveBtn.classList.toggle("active", saved);
  actions.appendChild(saveBtn);

  const langBtn = document.createElement("button");
  langBtn.className = "btn btn-ghost btn-lang-toggle";
  langBtn.textContent = t.langToggle;
  actions.appendChild(langBtn);
  container.appendChild(actions);

  if (card.commonsImage) {
    const ci = card.commonsImage;
    const section = document.createElement("div");
    section.className = "story-detail-section story-commons-section";
    const heading = document.createElement("h3");
    heading.textContent = t.seeOriginal;
    section.appendChild(heading);
    const img = document.createElement("img");
    img.className = "story-commons-image";
    img.loading = "lazy";
    img.src = ci.file;
    img.alt = ci.title || "";
    section.appendChild(img);
    const credit = document.createElement("p");
    credit.className = "story-commons-credit";
    credit.textContent = [ci.title, ci.author, ci.license].filter(Boolean).join(" · ");
    section.appendChild(credit);
    container.appendChild(section);
  }

  if (card.sourceUrl) {
    const sourceEl = document.createElement("a");
    sourceEl.className = "story-detail-source";
    sourceEl.href = card.sourceUrl;
    sourceEl.target = "_blank";
    sourceEl.rel = "noopener";
    sourceEl.textContent = `${t.source}: Wikipedia ↗`;
    container.appendChild(sourceEl);
  }
}

export function renderWikiCard(card) {
  const el = document.createElement("article");
  el.className = "card";
  el.dataset.id = card.id;
  el.dataset.type = "wiki";

  if (card.thumbnail && card.thumbnail.source) {
    const img = document.createElement("img");
    img.className = "card-image";
    img.loading = "lazy";
    img.src = card.thumbnail.source;
    img.alt = "";
    el.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "card-image-fallback";
    el.appendChild(fallback);
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const topicEl = document.createElement("span");
  topicEl.className = "card-topic";
  topicEl.textContent = topicLabel(card.topic);
  body.appendChild(topicEl);

  const titleEl = document.createElement("h2");
  titleEl.className = "card-title";
  titleEl.textContent = card.title;
  body.appendChild(titleEl);

  const extractEl = document.createElement("p");
  extractEl.className = "card-extract";
  appendTappableText(extractEl, card.extract, card.lang);
  body.appendChild(extractEl);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const readMoreBtn = document.createElement("a");
  readMoreBtn.className = "btn btn-primary";
  readMoreBtn.textContent = "Baca selengkapnya";
  readMoreBtn.href = card.contentUrl || "#";
  readMoreBtn.target = "_blank";
  readMoreBtn.rel = "noopener";
  actions.appendChild(readMoreBtn);

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-small btn-save";
  const saved = isCardSaved(card.id);
  saveBtn.textContent = saved ? "🔖 Tersimpan" : "🔖 Simpan";
  saveBtn.classList.toggle("active", saved);
  actions.appendChild(saveBtn);

  const shareBtn = document.createElement("button");
  shareBtn.className = "btn btn-small btn-share";
  shareBtn.textContent = "↗";
  actions.appendChild(shareBtn);

  body.appendChild(actions);

  const sourceEl = document.createElement("div");
  sourceEl.className = "card-source";
  sourceEl.textContent = sourceLabel(card.source, card.lang);
  body.appendChild(sourceEl);

  el.appendChild(body);
  return el;
}

export function renderQuizCard(quiz) {
  const el = document.createElement("article");
  el.className = "quiz-card";
  el.dataset.correctIndex = String(quiz.correctIndex);
  el.dataset.answered = "false";
  el.dataset.explanation = quiz.explanation || "";

  const q = document.createElement("p");
  q.className = "quiz-question";
  q.textContent = quiz.question;
  el.appendChild(q);

  const optionsWrap = document.createElement("div");
  optionsWrap.className = "quiz-options";
  quiz.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = opt;
    btn.dataset.index = String(i);
    optionsWrap.appendChild(btn);
  });
  el.appendChild(optionsWrap);

  const feedback = document.createElement("p");
  feedback.className = "quiz-feedback";
  el.appendChild(feedback);

  return el;
}

export function showWordPopup(container, token, result) {
  container.innerHTML = "";
  const wordEl = document.createElement("div");
  wordEl.className = "word-popup-word";
  wordEl.textContent = result ? result.word : token;
  container.appendChild(wordEl);

  if (result && result.definition) {
    const metaEl = document.createElement("div");
    metaEl.className = "word-popup-phonetic";
    metaEl.textContent = [result.phonetic, result.partOfSpeech].filter(Boolean).join(" · ");
    container.appendChild(metaEl);

    const defEl = document.createElement("div");
    defEl.className = "word-popup-def";
    defEl.textContent = result.definition;
    container.appendChild(defEl);

    const savedEl = document.createElement("div");
    savedEl.className = "word-popup-saved";
    savedEl.textContent = "Ditambahkan ke Kosakata Saya";
    container.appendChild(savedEl);
  } else {
    const defEl = document.createElement("div");
    defEl.className = "word-popup-def";
    defEl.textContent = "Arti tidak ditemukan di kamus.";
    container.appendChild(defEl);
  }
  container.classList.remove("hidden");
}

export function hideWordPopup(container) {
  container.classList.add("hidden");
}

export function renderList(container, items, { emptyText, kind }) {
  container.innerHTML = "";
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "list-empty";
    p.textContent = emptyText;
    container.appendChild(p);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.dataset.id = kind === "vocab" ? item.word : item.id;
    row.dataset.kind = kind;

    if (kind !== "vocab") {
      if (item.thumbnail && item.thumbnail.source) {
        const img = document.createElement("img");
        img.src = item.thumbnail.source;
        row.appendChild(img);
      } else {
        const badge = document.createElement("div");
        badge.className = "list-item-badge";
        badge.style.background = categoryGradient(item.category);
        badge.textContent = item.emoji || "📘";
        row.appendChild(badge);
      }
    }

    const textWrap = document.createElement("div");
    const titleEl = document.createElement("div");
    titleEl.className = "list-item-title";
    titleEl.textContent = kind === "vocab" ? item.word : item.title;
    textWrap.appendChild(titleEl);

    const subEl = document.createElement("div");
    subEl.className = "list-item-sub";
    subEl.textContent = kind === "vocab" ? item.definition || "" : item.hook || item.description || "";
    textWrap.appendChild(subEl);
    row.appendChild(textWrap);

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn-icon btn-remove";
    removeBtn.textContent = "✕";
    row.appendChild(removeBtn);

    container.appendChild(row);
  });
}

export function showScreen(id) {
  document.getElementById(id).classList.remove("hidden");
}

export function hideScreen(id) {
  document.getElementById(id).classList.add("hidden");
}

export function setActiveNav(screenKey) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.screen === screenKey);
  });
}

export function updateStatsText(el, { stats, todayCount, weekCount }) {
  el.textContent =
    `Hari ini: ${todayCount} kartu · Minggu ini: ${weekCount} kartu · ` +
    `Streak: ${stats.streak} hari · Total sepanjang waktu: ${stats.totalCardsRead} kartu`;
}
