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
  
  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      errorMsg = json.description || json.message || errorMsg;
    } catch (e) {
      const text = await response.text();
      if (text.includes('login') || text.includes('Login')) {
        errorMsg = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else {
        errorMsg = `Error del servidor: ${response.status}`;
      }
    }
    throw new Error(errorMsg);
  }
  
  return await response.json();
}

export async function fetchRecepcionesPedido(pedidoId) {
  const response = await fetch(`/inventario/api/pedidos/${pedidoId}/recepciones`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchCurrentUser() {
  const response = await fetch('/inventario/api/usuario/current');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchProductStock(productId) {
  const response = await fetch(`/inventario/api/productos/${productId}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}
