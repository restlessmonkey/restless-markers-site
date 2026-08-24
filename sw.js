/**
 * Offline cache for Add to Home Screen / browser use (not used in Capacitor native WebView).
 */
const CACHE = "restless-markers-ui-20260824-v4";
const PRECACHE = [
  "./",
  "./index.html",
  "./app.js?v=1.4.0",
  "./restless-markers-brand.js?v=1",
  "./ca-enhancements.js?v=1",
  "./ca-hmdb-poc.js?v=1.4.6-poc",
  "./ca-hmdb-rich-details.js?v=1.4.6-poc",
  "./ca-berd-enrichment.js?v=1.4.6-poc",
  "./data/runtime/route-planner.js?v=1.7.0",
  "./app-meta.json?v=1.4.0",
  "./styles.css",
  "./site.webmanifest",
  "./data/offline-lookups.json?v=1.4.0",
  "./data/states/nc/offline-lookups.json?v=1.4.0",
  "./data/states/ca/offline-lookups.json?v=1.4.0",
  "./vendor/leaflet/leaflet.css",
  "./vendor/leaflet/leaflet.js",
  "./vendor/leaflet/images/marker-icon.png",
  "./vendor/leaflet/images/marker-icon-2x.png",
  "./vendor/leaflet/images/marker-shadow.png",
  "./vendor/leaflet.markercluster/MarkerCluster.css",
  "./vendor/leaflet.markercluster/MarkerCluster.Default.css",
  "./vendor/leaflet.markercluster/leaflet.markercluster.js",
  "./vendor/wordcloud/wordcloud2.js",
  "./icons/icon.svg",
  "./icons/restless-monkey-software-logo.png",
  "./icons/restless-monkey-software-mascot.png"
];

function isFreshDataJsonRequest(url) {
  const path = url.pathname;
  return (
    path.endsWith("/markers.json") ||
    path === "/markers.json" ||
    path.endsWith("/offline-lookups.json") ||
    path === "/offline-lookups.json" ||
    path.endsWith("/app-meta.json") ||
    path === "/app-meta.json" ||
    path.endsWith("/berd-landmark-enrichment.json")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") {
    return;
  }
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Dataset JSON and app metadata can change independently of the application
  // shell. Prefer the current network copy while retaining the most recent
  // successful response for offline use.
  if (isFreshDataJsonRequest(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === "opaque") {
          return res;
        }
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});