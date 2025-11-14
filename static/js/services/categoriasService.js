// static/js/services/categoriasService.js
export const categoriasService = {
  async list() {
    const resp = await fetch('/configuraciones/api/categorias');
    if (!resp.ok) {
      throw new Error(`Error HTTP: ${resp.status}`);
    }
    return await resp.json();
  },
  async getById(id) {
    const resp = await fetch(`/configuraciones/api/categorias/${id}`);
    if (!resp.ok) {
      throw new Error(`Error HTTP: ${resp.status}`);
    }
    return await resp.json();
  },
  async create(payload) {
    const resp = await fetch('/configuraciones/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      throw new Error(`Error HTTP: ${resp.status}`);
    }
    return await resp.json();
  },
  async update(id, payload) {
    const resp = await fetch(`/configuraciones/api/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      throw new Error(`Error HTTP: ${resp.status}`);
    }
    return await resp.json();
  },
  async delete(id) {
    const resp = await fetch(`/configuraciones/api/categorias/${id}`, {
      method: 'DELETE'
    });
    if (!resp.ok) {
      throw new Error(`Error HTTP: ${resp.status}`);
    }
    return true;
  }
};
