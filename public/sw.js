const CACHE_NAME = 'diamond-solar-v1'

const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy)
          })
        }
        return networkResponse
      })
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name)
        })
      )
    })
  )
})
