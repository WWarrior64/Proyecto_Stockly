// static/js/services/categoriasService.js
export const categoriasService = {
  async list() {
    // TODO: reemplaza con fetch('/api/categorias') real cuando esté listo
    return [
      { id: '1', nombre: 'Bebidas', descripcion: 'Productos líquidos' },
      { id: '2', nombre: 'Snacks', descripcion: 'Aperitivos' }
    ];
  },
  async getById(id) {
    const list = await this.list();
    return list.find(s => String(s.id) === String(id)) || null;
  },
  async create(payload) {
    console.log('crear categoria', payload);
    // Implementa un POST real aquí
    return true;
  },
  async update(id, payload) {
    console.log('update categoria', id, payload);
    return true;
  },
  async delete(id) {
    console.log('delete categoria', id);
    return true;
  }
};
