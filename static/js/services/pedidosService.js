// static/js/views/modalControllers_pedidos.js
// Inicializador del modal Crear / Editar Pedido (archivo separado para evitar conflictos)
window.initCrearEditarPedido = async function initCrearEditarPedido(container, { pedidoId = null, vueApp = null } = {}) {
  // container: elemento donde se inyectó el partial
  if (!container) {
    console.warn('initCrearEditarPedido: container no encontrado');
    return;
  }

  // buscar elementos del partial
  const form = container.querySelector('#pedidoForm');
  const inputCodigo = container.querySelector('#pedido_codigo');
  const btnSave = container.querySelector('#pedido_save');

  // cargar datos si viene pedidoId
  if (pedidoId) {
    try {
      if (window.pedidosService && typeof window.pedidosService.get === 'function') {
        const data = await window.pedidosService.get(pedidoId);
        // mapear datos a inputs (ajusta según respuesta real)
        inputCodigo && (inputCodigo.value = data.codigo || '');
        // ... poblar resto ...
      } else {
        // demo fill
        inputCodigo && (inputCodigo.value = 'PED-' + String(pedidoId).padStart(3, '0'));
      }
    } catch (e) {
      console.error('Error cargando pedido', e);
    }
  }

  // evento submit
  form && form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try {
      const payload = {
        codigo: inputCodigo ? inputCodigo.value : '',
        // recoger resto de campos...
      };
      if (pedidoId) {
        if (!window.pedidosService || typeof window.pedidosService.update !== 'function') {
          throw new Error('Servicio pedidosService.update no disponible');
        }
        await window.pedidosService.update(pedidoId, payload);
      } else {
        if (!window.pedidosService || typeof window.pedidosService.create !== 'function') {
          throw new Error('Servicio pedidosService.create no disponible');
        }
        await window.pedidosService.create(payload);
      }
      // refrescar lista en la app padre
      if (vueApp && typeof vueApp.loadPedidos === 'function') await vueApp.loadPedidos();
      // cerrar modal
      if (vueApp && typeof vueApp.closeModal === 'function') vueApp.closeModal();
    } catch (e) {
      console.error('Error guardando pedido', e);
      // muestra mensaje simple; puedes mejorar con un contenedor de errores en el modal
      alert('Error guardando pedido: ' + (e.message || e));
    }
  });

  // botones close (por si no fueron enlazados desde la vista principal)
  container.querySelectorAll('.close-modal-small').forEach(btn => btn.addEventListener('click', () => {
    if (vueApp && typeof vueApp.closeModal === 'function') vueApp.closeModal();
  }));
};
