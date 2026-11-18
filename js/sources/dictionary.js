const cache = new Map();

export async function lookupWord(word) {
  const key = word.toLowerCase().trim();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = await res.json();
    const entry = data[0];
    const meaning = entry?.meanings?.[0];
    const result = {
      word: entry?.word || key,
      phonetic: entry?.phonetic || entry?.phonetics?.find((p) => p.text)?.text || "",
      partOfSpeech: meaning?.partOfSpeech || "",
      definition: meaning?.definitions?.[0]?.definition || "",
      example: meaning?.definitions?.[0]?.example || "",
    };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}
