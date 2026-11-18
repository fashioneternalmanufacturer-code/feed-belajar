import { lookupWord } from "./sources/dictionary.js";
import { addVocabWord } from "./storage.js";

export function tokenizeExtract(text) {
  return text.split(/(\s+)/).filter((t) => t.length);
}

function cleanWord(raw) {
  return raw.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, "");
}

export async function handleWordTap(rawToken) {
  const word = cleanWord(rawToken);
  if (!word || word.length < 2) return null;

  const result = await lookupWord(word);
  if (result && result.definition) {
    addVocabWord({
      word: result.word,
      phonetic: result.phonetic,
      partOfSpeech: result.partOfSpeech,
      definition: result.definition,
      example: result.example,
    });
  }
  return result;
}
