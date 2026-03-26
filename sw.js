// Zmień ten numer przy każdej dużej aktualizacji, żeby wymusić odświeżenie!
const CACHE_NAME = 'tadc-cache-v4'; 

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './images/backgrund.jpg',
  './music/maintheme.mp3'
];

// 1. INSTALACJA I WYMUSZENIE AKTUALIZACJI
self.addEventListener('install', event => {
  self.skipWaiting(); // Zmusza nowy skrypt do natychmiastowego przejęcia kontroli
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Otwarto cache');
        // Używamy catch, żeby jeden błędny plik (np. brak mp3) nie wysypał całego skryptu
        return cache.addAll(urlsToCache).catch(err => console.log('Błąd ładowania pliku do cache:', err));
      })
  );
});

// 2. CZYSZCZENIE STARYCH WERSJI (Kasuje starego "TADC Installera")
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Przejmij kontrolę nad stroną od razu
  );
});

// 3. STRATEGIA: NAJPIERW SIEĆ, POTEM CACHE
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Jeśli udało się pobrać z neta (jesteś online), zapisz nową kopię i ją wyświetl
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        let responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Jeśli nie masz neta (offline) lub GitHub padł, pokaż to co zapisałeś
        return caches.match(event.request);
      })
  );
});
