// static/js/services/movimientoService.js

export async function fetchPedidosPendientes() {
  const response = await fetch('/inventario/api/pedidos/pendientes');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchDetallesPedido(pedidoId) {
  const response = await fetch(`/inventario/api/pedidos/${pedidoId}/detalles`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchLotes(productId) {
  const response = await fetch(`/inventario/api/productos/${productId}/lotes`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function createMovimiento(data) {
  const response = await fetch('/inventario/api/movimientos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.description || `HTTP ${response.status}`);
  }
  return json;
}

export async function fetchRecepcionesPedido(pedidoId) {
  const response = await fetch(`/inventario/api/pedidos/${pedidoId}/recepciones`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}