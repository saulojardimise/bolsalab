// Service worker de despedida: substitui o do app antigo neste endereço,
// apaga a cópia guardada e recarrega a página, que leva para https://bolsalab.app/
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    const chaves = await caches.keys();
    await Promise.all(chaves.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const j of janelas) {
      try { await j.navigate(j.url); } catch { /* a página de despedida resolve na próxima abertura */ }
    }
  })());
});
