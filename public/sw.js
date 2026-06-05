const CACHE_NAME = "bliss-bakery-v2";
const OFFLINE_URL = "/offline";

// Install: cache the offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (cart mutations, checkout, auth)
  if (request.method !== "GET") return;

  // Never cache auth, OTP, checkout, payment, admin API
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/otp") ||
    url.pathname.startsWith("/api/orders/create") ||
    url.pathname.startsWith("/api/admin") ||
    url.pathname.startsWith("/checkout") ||
    url.pathname.includes("razorpay")
  ) {
    return;
  }

  // Static assets: cache first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|webp|avif|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Product images: stale while revalidate
  if (url.pathname.startsWith("/uploads/") || url.hostname.includes("cloudinary")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // HTML pages: network first, fallback to offline
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // API/data: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
