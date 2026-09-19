/* Cache names include this app's scope, leaving sibling GitHub Pages apps alone.
   scripts/build-release.py updates RELEASE when any app-shell bytes change. */
const RELEASE = '868143c3d016';
const PREFIX = 'xiaoliu-fengshui:' + new URL(self.registration.scope).pathname + ':';
const CACHE = PREFIX + RELEASE;
const FILES = [
  'index.html','style.css','script.js','zibai.js','xuankong.js','xk-overlay.js',
  'xk-dashboard.css','xk-dashboard.js','xk-page.js','zb-dashboard.css','zb-dashboard.js',
  'app-tools.css','app-storage.js','pwa.js','manifest.webmanifest',
  'icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'
];
const URLS = FILES.map(file => new URL(file,self.registration.scope).href);
const INDEX = new URL('index.html',self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache=await caches.open(CACHE);
      await cache.addAll(URLS.map(url => new Request(url,{cache:'reload'})));
    } catch (error) { await caches.delete(CACHE); throw error; }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names=await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name!==CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type==='SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request=event.request;
  if (request.method!=='GET') return;
  const url=new URL(request.url), scope=new URL(self.registration.scope);
  if (url.origin!==scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  url.hash=''; url.search='';
  // Only the app root and index are shell navigations; other pages retain their URLs.
  const shell=request.mode==='navigate' && (url.href===scope.href || url.href===INDEX);
  const key=shell ? INDEX : url.href;
  if (!shell && !URLS.includes(key)) return;
  event.respondWith((async () => {
    const cache=await caches.open(CACHE);
    const cached=await cache.match(key);
    return cached || fetch(request);
  })());
});
