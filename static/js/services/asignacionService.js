export async function fetchProveedores() {
  const response = await fetch('/inventario/api/proveedores');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchAsignaciones(producto_id) {
  const response = await fetch(`/inventario/api/asignaciones?producto_id=${producto_id}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchAsignacion(producto_id, proveedor_id) {
  const response = await fetch(`/inventario/api/asignaciones/${producto_id}/${proveedor_id}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function createAsignacion(data) {
  const response = await fetch('/inventario/api/asignaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function updateAsignacion(producto_id, proveedor_id, data) {
  const response = await fetch(`/inventario/api/asignaciones/${producto_id}/${proveedor_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function deleteAsignacion(producto_id, proveedor_id) {
  const response = await fetch(`/inventario/api/asignaciones/${producto_id}/${proveedor_id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  // 204 No Content doesn't have a response body
  if (response.status === 204) {
    return {};
  }
  return await response.json();
}
