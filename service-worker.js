/**
 * Service Worker — Élus School Pro (version fichier unique)
 * Nécessaire pour que Chrome/Android propose "Installer l'application"
 * et pour un minimum de résilience hors connexion. Il met en cache la
 * coquille (index.html, manifest.json) et toutes les ressources
 * chargées ensuite (polices, Chart.js, etc.) au fur et à mesure.
 * Les échanges avec Firebase ne sont jamais interceptés : Firestore
 * gère lui-même son propre cache local persistant.
 *
 * IMPORTANT : changez CACHE_VERSION à chaque nouvelle mise en ligne
 * pour que les utilisateurs reçoivent automatiquement la dernière version.
 */
const CACHE_VERSION = "esp-single-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("firebasestorage.app") ||
    url.hostname.includes("gstatic.com") ||
    event.request.method !== "GET"
  ) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
