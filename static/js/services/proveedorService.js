// static/js/services/proveedorService.js
window.proveedorService = {
  async list() {
    const resp = await fetch('/inventario/api/proveedores');
    if (!resp.ok) throw new Error('No se pudo cargar proveedores');
    return await resp.json();
  }
  // puedes agregar más métodos: get(id), create, etc.
};
