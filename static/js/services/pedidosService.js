// static/js/services/pedidosService.js
window.pedidosService = {
  async list() {
    const resp = await fetch('/pedidos/api/list', { credentials: 'same-origin' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  },
  async get(id) {
    const resp = await fetch(`/pedidos/api/${id}`, { credentials: 'same-origin' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  },
  async create(payload) {
    const resp = await fetch('/pedidos/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  },
  async update(id, payload) {
    const resp = await fetch(`/pedidos/api/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  },
  async listProveedores() {
    const resp = await fetch('/pedidos/api/proveedores', { credentials: 'same-origin' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  },
  async listTipoPagos() {
    const resp = await fetch('/pedidos/api/tipo_pagos', { credentials: 'same-origin' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  },
  async listProductos() {
    const resp = await fetch('/pedidos/api/productos', { credentials: 'same-origin' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  }
};