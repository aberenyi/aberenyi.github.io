var CACHE_NAME = 'cache-2016083115'

self.addEventListener('install', function(event)
{
  console.log('[install] Kicking off service worker registration!')

  event.waitUntil
  (
    caches
      .open(CACHE_NAME)
      .then(function(cache)
      {
        return fetch('cache.json')
          .then(function(response)
          {
            console.log('[install] Cache config read in successfully.')
            return response.json()
          })
          .then(function(files)
          {
            console.log('[install] Adding files from cache confi: ', files)
            return cache.addAll(files)
          })
          .then(function()
          {
            console.log('[install] All required resources have been cached')
            console.log('Service Worker was successfully installed!')

            // Force activation
            return self.skipWaiting()
          })
      })
  )
})

self.addEventListener('fetch', function(event)
{
  event.respondWith
  (
    caches
      .match(event.request)
      .then(function(response)
      {
        if (response)
        {
          console.log('[fetch] Returning from Service Worker cache: %s', event.request.url)
          return response
        }

        console.log('[fetch] Returning from server: %s', event.request.url)

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        var fetchRequest = event.request.clone()

        return fetch(fetchRequest)
          .then(function(response)
          {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic')
            {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();

            caches
              .open(CACHE_NAME)
              .then(function(cache)
              {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
      })
  )
})

self.addEventListener('activate', function(event)
{
  var upToDateCaches = [CACHE_NAME];
  event.waitUntil
  (
    caches
      .keys()
      .then(function(cacheNames)
      {
        return Promise.all
        (
          cacheNames.map(function(cacheName)
          {
            if (upToDateCaches.indexOf(cacheName) === -1)
            {
              console.log('[activate] Clean up old cache: %s', cacheName)
              return caches.delete(cacheName);
            }
          })
        )
      })
  )

  console.log('[activate] Activating service worker!')
  console.log('[activate] Claiming this service worker!')
  event.waitUntil(self.clients.claim())


})
