self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  clients.claim();
});

self.addEventListener("push", event => {
  const data = event.data?.json() || {};
  self.registration.showNotification(
    data.title || "طلب جديد",
    {
      body: data.body || "تم استلام طلب جديد",
      icon: "icon-192.png",
      badge: "icon-192.png",
      dir: "rtl",
      vibrate: [200, 100, 200]
    }
  );
});