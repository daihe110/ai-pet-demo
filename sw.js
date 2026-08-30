const VERSION = "aipet-v9";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/pets/doudou.jpg",
  "./assets/pets/cat-afei.jpg",
  "./assets/pets/cat-mili.jpg",
  "./assets/pets/dog-wangcai.jpg",
  "./assets/pets/cat-new1.jpg",
  "./assets/pets/cat-new2.jpg",
  "./assets/videos/naicha-poster.jpg",
  "./assets/user/person-2.jpg",
  "./assets/user/me-avatar-sm.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // 视频等媒体直接交给浏览器处理（分段请求不能被缓存干扰）
  const url = req.url;
  if (req.destination === "video" || req.destination === "audio" || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)) {
    return;
  }

  // 页面请求网络优先，保证每次发布后用户拿到最新版本
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put("./index.html", copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok && new URL(req.url).origin === location.origin) {
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
