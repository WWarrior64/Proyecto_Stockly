// static/js/services/proveedoresService.js
export const proveedoresService = {
  async list() {
    // reemplaza por fetch('/api/proveedores')
    return [
      { proveedor_id: '1', proveedor_codigo: 'PROV001', proveedor_nombre: 'Proveedor A', numerotelefono: '1234-5678', email: 'a@d.com', direccion: '' },
      { proveedor_id: '2', proveedor_codigo: 'PROV002', proveedor_nombre: 'Proveedor B', numerotelefono: '8765-4321', email: 'b@c.com', direccion: '' }
    ];
  },
  async getById(id) {
    const list = await this.list();
    return list.find(x => String(x.proveedor_id) === String(id)) || null;
  },
  async create(payload) {
    console.log('crear proveedor', payload);
    return true;
  },
  async update(id, payload) {
    console.log('update proveedor', id, payload);
    return true;
  },
  async delete(id) {
    console.log('delete proveedor', id);
    return true;
  }
};