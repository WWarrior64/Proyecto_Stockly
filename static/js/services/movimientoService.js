// static/js/services/movimientoService.js
window.movimientoService = {
  async crear(payload) {
    const resp = await fetch('/inventario/api/movimientos', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('Error registrando movimiento');
    return await resp.json();
  },

  // endpoints auxiliares si tu partial lo necesita
  async listPedidosPendientes() {
    const resp = await fetch('/inventario/api/pedidos/pendientes');
    if (!resp.ok) throw new Error('No se pudieron cargar pedidos');
    return await resp.json();
  },

  async listLotes(productoId) {
    const resp = await fetch(`/inventario/api/productos/${productoId}/lotes`);
    if (!resp.ok) throw new Error('No se pudieron cargar lotes');
    return await resp.json();
  }
};
