import { fetchOnThisDayRaw } from "./sources/wikipedia.js";

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateQuizFromStories(recentCards) {
  const pool = recentCards.filter((c) => Array.isArray(c.quiz) && c.quiz.length);
  if (!pool.length) return null;

  const card = pool[Math.floor(Math.random() * pool.length)];
  const q = card.quiz[Math.floor(Math.random() * card.quiz.length)];
  const correctText = q.options[q.correctIndex];
  const options = shuffle(q.options);

  return {
    type: "story",
    question: `${card.emoji ? card.emoji + " " : ""}${q.question}`,
    options,
    correctIndex: options.indexOf(correctText),
    explanation: q.explanation || "",
  };
}

function stripLeadingYear(text) {
  return text.replace(/^\s*\d{1,4}\s*[–\-:]\s*/, "").trim();
}

export async function generateExploreYearQuiz(lang) {
  try {
    const { events } = await fetchOnThisDayRaw(lang);
    const usable = events.filter((e) => e.year && e.text && e.text.length > 20);
    if (!usable.length) return null;
    const event = usable[Math.floor(Math.random() * usable.length)];
    const correctYear = event.year;
    const question = stripLeadingYear(event.text);

    const years = new Set([correctYear]);
    while (years.size < 4) {
      const offset = Math.floor(Math.random() * 40) - 20;
      const candidate = correctYear + offset;
      if (offset !== 0 && candidate > 0) years.add(candidate);
    }
    const options = shuffle([...years]);
    return {
      type: "year",
      question: `Tebak tahunnya: "${question}"`,
      options: options.map(String),
      correctIndex: options.indexOf(correctYear),
      explanation: "",
    };
  } catch {
    return null;
  }
}

export function generateExploreTitleQuiz(recentCards) {
  const pool = recentCards.filter((c) => c.title && c.extract && c.extract.length > 60);
  if (pool.length < 4) return null;

  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractorTitles = shuffle(pool.filter((c) => c.title !== target.title))
    .slice(0, 3)
    .map((c) => c.title);
  if (distractorTitles.length < 3) return null;

  const options = shuffle([target.title, ...distractorTitles]);
  const snippet = target.extract.slice(0, 140).replace(/\s+\S*$/, "") + "...";
  return {
    type: "title",
    question: `Judul mana yang cocok dengan ringkasan ini?\n"${snippet}"`,
    options,
    correctIndex: options.indexOf(target.title),
    explanation: "",
  };
}

async function generateExploreQuiz(recentCards, lang) {
  const tryYearFirst = Math.random() < 0.5;
  if (tryYearFirst) {
    const yearQuiz = await generateExploreYearQuiz(lang);
    if (yearQuiz) return yearQuiz;
    return generateExploreTitleQuiz(recentCards);
  }
  const titleQuiz = generateExploreTitleQuiz(recentCards);
  if (titleQuiz) return titleQuiz;
  return generateExploreYearQuiz(lang);
}

export async function generateQuiz(exploreMode, recentCards, lang) {
  if (exploreMode) return generateExploreQuiz(recentCards, lang);
  return generateQuizFromStories(recentCards);
}
