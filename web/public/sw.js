/*
 * PWA só instalável (spec 007, ADR 0010): este service worker existe porque o Chrome exige um fetch
 * handler para mostrar o ícone de instalar. Não guarda nada (sem Cache Storage) e nunca intercepta
 * /api nem métodos diferentes de GET: o navegador vai à rede como se ele não existisse.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Sem respondWith de propósito. Se o Chrome deixar de contar um handler vazio, a troca é:
  // if (event.request.mode === "navigate" && event.request.method === "GET") event.respondWith(fetch(event.request));
});
