// static/js/flash.js
document.addEventListener('DOMContentLoaded', () => {
  const flashes = Array.from(document.querySelectorAll('.flash-item'));
  if (flashes.length === 0) return;

  flashes.forEach(el => {
    // asegurar estado inicial
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';

    // tiempo visible antes de iniciar la transición
    setTimeout(() => {
      el.style.transition = 'opacity 350ms ease, transform 350ms ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';

      // cuando termine la transición, remover el nodo del DOM
      el.addEventListener('transitionend', (ev) => {
        // comprobación defensiva
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, { once: true });
    }, 5000); // 5s visible
  });
});
