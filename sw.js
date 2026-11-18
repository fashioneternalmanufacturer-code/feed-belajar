const CACHE_VERSION = "v3";
const SHELL_CACHE = `feed-belajar-shell-${CACHE_VERSION}`;
const CARD_CACHE = `feed-belajar-cards-${CACHE_VERSION}`;
const IMAGE_CACHE = `feed-belajar-images-${CACHE_VERSION}`;

const BASE = new URL("./", self.location).pathname;

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/storage.js",
  "./js/feed.js",
  "./js/quiz.js",
  "./js/vocab.js",
  "./js/ui.js",
  "./js/sources/wikipedia.js",
  "./js/sources/dictionary.js",
  "./js/sources/stories.js",
  "./content/stories/sejarah-dunia.json",
  "./content/stories/sejarah-indonesia.json",
  "./content/stories/tokoh.json",
  "./content/stories/penemuan.json",
  "./content/stories/sains-sehari-hari.json",
  "./content/stories/tubuh-kesehatan-olahraga.json",
  "./content/stories/psikologi-kebiasaan.json",
  "./content/stories/bisnis-ekonomi.json",
  "./content/stories/alam-geografi-luar-angkasa.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== CARD_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isAppShellRequest(url) {
  return url.pathname.startsWith(BASE) && !url.pathname.includes("/api/");
}

function isCardDataRequest(url) {
  return (
    url.hostname.endsWith("wikipedia.org") ||
    url.hostname === "api.dictionaryapi.dev"
  );
}

function isStoryImageRequest(url) {
  return url.pathname.includes("/assets/img/");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (isStoryImageRequest(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(IMAGE_CACHE).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
    return;
  }

  if (isCardDataRequest(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CARD_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (isAppShellRequest(url)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
