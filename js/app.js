import { getNextBatch } from "./feed.js";
import { generateQuiz } from "./quiz.js";
import { handleWordTap } from "./vocab.js";
import { loadAllStories, localizeStory } from "./sources/stories.js";
import {
  getSettings,
  saveSettings,
  toggleSavedCard,
  getSavedCards,
  removeSavedCard,
  getVocab,
  removeVocabWord,
  markSeen,
  recordCardRead,
  getStats,
  getTodayCount,
  getWeekCount,
} from "./storage.js";
import {
  renderStoryCard,
  renderWikiCard,
  renderStoryDetail,
  renderQuizCard,
  showWordPopup,
  hideWordPopup,
  renderList,
  showScreen,
  hideScreen,
  setActiveNav,
  updateStatsText,
} from "./ui.js";

const feedEl = document.getElementById("feed");
const wordPopupEl = document.getElementById("word-popup");
const storyDetailEl = document.getElementById("story-detail");

const cardById = new Map();
const recentCardsForQuiz = [];
let totalRealCardsAppended = 0;
let sessionCardCount = 0;
let nextLimitThreshold = getSettings().sessionLimit;
let isFetchingMore = false;
let toastTimer = null;
let currentDetailCard = null;

function showToast(msg, ms = 2000) {
  wordPopupEl.innerHTML = "";
  const p = document.createElement("div");
  p.className = "word-popup-def";
  p.textContent = msg;
  wordPopupEl.appendChild(p);
  wordPopupEl.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => wordPopupEl.classList.add("hidden"), ms);
}

function isStoryCard(card) {
  return typeof card.story === "string";
}

async function appendCards(cards) {
  const settings = getSettings();
  for (const card of cards) {
    cardById.set(card.id, card);
    const el = isStoryCard(card) ? renderStoryCard(card) : renderWikiCard(card);
    feedEl.appendChild(el);
    observer.observe(el);

    recentCardsForQuiz.push(card);
    if (recentCardsForQuiz.length > 20) recentCardsForQuiz.shift();
    totalRealCardsAppended += 1;

    if (settings.quizEnabled && totalRealCardsAppended % 8 === 0) {
      const quiz = await generateQuiz(settings.exploreMode, recentCardsForQuiz, card.lang);
      if (quiz) {
        const quizEl = renderQuizCard(quiz);
        feedEl.appendChild(quizEl);
        observer.observe(quizEl);
      }
    }
  }
}

async function fetchMoreIfNeeded(activeEl) {
  const children = Array.from(feedEl.children);
  const index = children.indexOf(activeEl);
  if (index === -1 || isFetchingMore) return;
  if (index >= children.length - 3) {
    isFetchingMore = true;
    try {
      const cards = await getNextBatch(6);
      await appendCards(cards);
    } finally {
      isFetchingMore = false;
    }
  }
}

function showLimitOverlay() {
  document.getElementById("limit-title").textContent =
    `Kamu sudah belajar ${sessionCardCount} hal hari ini 🎉`;
  document.getElementById("screen-limit").classList.remove("hidden");
}

function handleCardBecameActive(el) {
  if (el.dataset.seen === "true") return;
  el.dataset.seen = "true";

  const card = cardById.get(el.dataset.id);
  if (!card) return;

  markSeen(card.id);
  recordCardRead();
  sessionCardCount += 1;

  if (sessionCardCount >= nextLimitThreshold) {
    showLimitOverlay();
    nextLimitThreshold += getSettings().sessionLimit;
  }

  fetchMoreIfNeeded(el);
}

function handleQuizBecameActive(el) {
  fetchMoreIfNeeded(el);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio < 0.6) return;
      if (entry.target.classList.contains("card")) {
        handleCardBecameActive(entry.target);
      } else if (entry.target.classList.contains("quiz-card")) {
        handleQuizBecameActive(entry.target);
      }
    });
  },
  { root: feedEl, threshold: 0.6 }
);

function handleQuizAnswer(quizEl, btn) {
  if (quizEl.dataset.answered === "true") return;
  quizEl.dataset.answered = "true";

  const correctIndex = Number(quizEl.dataset.correctIndex);
  const chosenIndex = Number(btn.dataset.index);
  const options = quizEl.querySelectorAll(".quiz-option");
  options[correctIndex].classList.add("correct");
  if (chosenIndex !== correctIndex) btn.classList.add("wrong");

  const explanation = quizEl.dataset.explanation || "";
  const feedback = quizEl.querySelector(".quiz-feedback");
  const base = chosenIndex === correctIndex ? "Benar! 🎯" : "Belum tepat.";
  feedback.textContent = explanation ? `${base} ${explanation}` : base;
}

async function handleWordClick(span) {
  const token = span.dataset.word;
  span.classList.add("tapped");
  showWordPopup(wordPopupEl, token, null);
  const result = await handleWordTap(token);
  showWordPopup(wordPopupEl, token, result);
}

function shareCard(card) {
  const url = card.contentUrl || card.sourceUrl;
  if (navigator.share) {
    navigator.share({ title: card.title, url }).catch(() => {});
    return;
  }
  if (url && navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast("Link disalin ke clipboard"));
  } else {
    showToast("Tidak ada link untuk dibagikan");
  }
}

async function getRawStory(key) {
  const all = await loadAllStories();
  return all.find((s) => s.key === key);
}

async function openStoryDetail(cardId, lang) {
  const story = await getRawStory(cardId);
  if (!story) return;
  currentDetailCard = localizeStory(story, lang);
  renderStoryDetail(storyDetailEl, currentDetailCard);
  showScreen("screen-story");
}

storyDetailEl.addEventListener("click", (e) => {
  const saveBtn = e.target.closest(".btn-save");
  if (saveBtn && currentDetailCard) {
    const nowSaved = toggleSavedCard(currentDetailCard);
    const t = currentDetailCard.lang === "en" ? "🔖 Saved" : "🔖 Tersimpan";
    const tOff = currentDetailCard.lang === "en" ? "🔖 Save" : "🔖 Simpan";
    saveBtn.textContent = nowSaved ? t : tOff;
    saveBtn.classList.toggle("active", nowSaved);
    return;
  }

  const langBtn = e.target.closest(".btn-lang-toggle");
  if (langBtn && currentDetailCard) {
    const nextLang = currentDetailCard.lang === "en" ? "id" : "en";
    openStoryDetail(currentDetailCard.id, nextLang);
    return;
  }

  const wordSpan = e.target.closest(".word");
  if (wordSpan) {
    handleWordClick(wordSpan);
    return;
  }

  const quizOption = e.target.closest(".quiz-option");
  if (quizOption) {
    handleQuizAnswer(quizOption.closest(".inline-quiz"), quizOption);
  }
});

feedEl.addEventListener("click", (e) => {
  const saveBtn = e.target.closest(".btn-save");
  if (saveBtn) {
    const cardEl = saveBtn.closest(".card");
    const card = cardById.get(cardEl.dataset.id);
    const nowSaved = toggleSavedCard(card);
    const t = card.lang === "en" ? "🔖 Saved" : "🔖 Tersimpan";
    const tOff = card.lang === "en" ? "🔖 Save" : "🔖 Simpan";
    saveBtn.textContent = nowSaved ? t : tOff;
    saveBtn.classList.toggle("active", nowSaved);
    return;
  }

  const shareBtn = e.target.closest(".btn-share");
  if (shareBtn) {
    const cardEl = shareBtn.closest(".card");
    shareCard(cardById.get(cardEl.dataset.id));
    return;
  }

  const wordSpan = e.target.closest(".word");
  if (wordSpan) {
    handleWordClick(wordSpan);
    return;
  }

  const quizOption = e.target.closest(".quiz-option");
  if (quizOption) {
    handleQuizAnswer(quizOption.closest(".quiz-card"), quizOption);
    return;
  }

  const storyCard = e.target.closest(".story-card");
  if (storyCard) {
    const card = cardById.get(storyCard.dataset.id);
    if (card) openStoryDetail(card.id, card.lang);
  }
});

document.addEventListener("click", (e) => {
  if (!wordPopupEl.contains(e.target) && !e.target.closest(".word")) {
    hideWordPopup(wordPopupEl);
  }
});

document.getElementById("btn-limit-continue").addEventListener("click", () => {
  hideScreen("screen-limit");
});
document.getElementById("btn-limit-stop").addEventListener("click", () => {
  hideScreen("screen-limit");
  showToast("Sampai jumpa lagi! 👋");
});

function openScreen(screenKey) {
  if (screenKey === "feed") {
    ["screen-saved", "screen-vocab", "screen-settings", "screen-story"].forEach(hideScreen);
    setActiveNav("feed");
    return;
  }
  setActiveNav(screenKey);
  if (screenKey === "screen-saved") {
    renderList(document.getElementById("saved-list"), getSavedCards(), {
      emptyText: "Belum ada kartu yang disimpan.",
      kind: "saved",
    });
  } else if (screenKey === "screen-vocab") {
    renderList(document.getElementById("vocab-list"), getVocab(), {
      emptyText: "Belum ada kosakata. Ketuk kata di kartu berbahasa Inggris.",
      kind: "vocab",
    });
  } else if (screenKey === "screen-settings") {
    populateSettingsForm();
  }
  showScreen(screenKey);
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => openScreen(btn.dataset.screen));
});

document.querySelectorAll(".btn-back").forEach((btn) => {
  btn.addEventListener("click", () => openScreen("feed"));
});

document.getElementById("saved-list").addEventListener("click", (e) => {
  const removeBtn = e.target.closest(".btn-remove");
  if (!removeBtn) return;
  const row = removeBtn.closest(".list-item");
  removeSavedCard(row.dataset.id);
  openScreen("screen-saved");
});

document.getElementById("vocab-list").addEventListener("click", (e) => {
  const removeBtn = e.target.closest(".btn-remove");
  if (!removeBtn) return;
  const row = removeBtn.closest(".list-item");
  removeVocabWord(row.dataset.id);
  openScreen("screen-vocab");
});

function populateSettingsForm() {
  const settings = getSettings();
  document.getElementById("setting-language").value = settings.language;
  document.getElementById("setting-category").value = settings.category;
  document.getElementById("setting-limit").value = settings.sessionLimit;
  document.getElementById("setting-quiz").checked = settings.quizEnabled;
  document.getElementById("setting-explore").checked = settings.exploreMode;

  updateStatsText(document.getElementById("stats-text"), {
    stats: getStats(),
    todayCount: getTodayCount(),
    weekCount: getWeekCount(),
  });
}

document.getElementById("setting-language").addEventListener("change", (e) => {
  saveSettings({ language: e.target.value });
});
document.getElementById("setting-category").addEventListener("change", (e) => {
  saveSettings({ category: e.target.value });
});
document.getElementById("setting-limit").addEventListener("change", (e) => {
  const value = Math.max(5, Number(e.target.value) || 20);
  saveSettings({ sessionLimit: value });
  nextLimitThreshold = sessionCardCount + value;
});
document.getElementById("setting-quiz").addEventListener("change", (e) => {
  saveSettings({ quizEnabled: e.target.checked });
});
document.getElementById("setting-explore").addEventListener("change", (e) => {
  saveSettings({ exploreMode: e.target.checked });
});

async function init() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  const firstBatch = await getNextBatch(6);
  await appendCards(firstBatch);
}

init();
