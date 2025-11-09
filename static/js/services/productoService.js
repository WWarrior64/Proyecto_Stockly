// static/js/services/productoService.js
window.productoService = {
  async get(id) {
    const resp = await fetch(`/inventario/api/productos/${id}`);
    if (!resp.ok) throw new Error('Producto no encontrado');
    return await resp.json();
  },

  async listCategorias() {
    const resp = await fetch('/inventario/api/categorias');
    if (!resp.ok) throw new Error('No se pudieron cargar categorías');
    return await resp.json();
  },

  async create(payload) {
    const resp = await fetch('/inventario/api/productos', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('Error creando producto');
    return await resp.json();
  },

  async update(id, payload) {
    const resp = await fetch(`/inventario/api/productos/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('Error actualizando producto');
    return await resp.json();
  }
};
