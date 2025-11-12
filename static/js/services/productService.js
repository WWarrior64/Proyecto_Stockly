// static/js/services/productService.js

export async function fetchProducts() {
  const response = await fetch('/inventario/api/productos');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchProduct(id) {
  const response = await fetch(`/inventario/api/productos/${id}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function createProduct(data) {
  const response = await fetch('/inventario/api/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function updateProduct(id, data) {
  const response = await fetch(`/inventario/api/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}

export async function deleteProduct(id) {
  const response = await fetch(`/inventario/api/productos/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
}

export async function fetchCategorias() {
  const response = await fetch('/inventario/api/categorias');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || `HTTP ${response.status}`);
  }
  return await response.json();
}