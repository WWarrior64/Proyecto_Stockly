import { fetchCategorias, fetchProduct, createProduct, updateProduct } from '/static/js/services/productService.js';

export async function initProductosModal(id) {
  const categorias = await fetchCategorias();
  const selectCategoria = document.getElementById('prod_categoria');
  selectCategoria.innerHTML = '<option value="">Seleccione</option>' + categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

  if (id) {
    const product = await fetchProduct(id);
    document.getElementById('prod_sku').value = product.sku || '';
    document.getElementById('prod_nombre').value = product.nombre || '';
    document.getElementById('prod_precio').value = product.precio || '';
    document.getElementById('prod_estado').value = product.estado || '';
    document.getElementById('prod_categoria').value = product.categoria_id || '';
    document.getElementById('prod_descripcion').value = product.descripcion || '';
  }

  const form = document.getElementById('productForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!form.reportValidity()) {
      return;
    }

    const data = {
      sku: document.getElementById('prod_sku').value,
      nombre: document.getElementById('prod_nombre').value,
      precio: parseFloat(document.getElementById('prod_precio').value) || null,
      estado: document.getElementById('prod_estado').value || null,
      categoria_id: parseInt(document.getElementById('prod_categoria').value) || null,
      descripcion: document.getElementById('prod_descripcion').value,
    };

    try {
      if (id) {
        await updateProduct(id, data);
      } else {
        await createProduct(data);
      }
      document.querySelector('[id="modalInner"]').closest('.fixed').querySelector('button').click();
    } catch (error) {
      alert('Error al guardar producto: ' + error.message);
    }
  });

  document.getElementById('prod_cancel').addEventListener('click', () => {
    document.querySelector('[id="modalInner"]').closest('.fixed').querySelector('button').click();
  });
}