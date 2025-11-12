import { fetchProduct } from '/static/js/services/productService.js';
import { fetchProveedores, fetchAsignaciones, fetchAsignacion, createAsignacion, updateAsignacion, deleteAsignacion } from '/static/js/services/asignacionService.js';

let editMode = null;

export async function initAsignarModal(productId) {
  if (!productId) return;

  const product = await fetchProduct(productId);
  document.getElementById('ap_producto_nombre').textContent = product.nombre;
  document.getElementById('ap_producto').value = product.nombre;

  const proveedores = await fetchProveedores();
  const selectProveedor = document.getElementById('ap_proveedor');
  selectProveedor.innerHTML = '<option value="">Seleccione</option>' + proveedores.map(p => `<option value="${p.proveedor_id}">${p.proveedor_nombre}</option>`).join('');

  await renderAsignaciones(productId);

  const form = document.getElementById('assignProveedorForm');
  const formHandler = async (e) => {
    e.preventDefault();
    
    if (!form.reportValidity()) {
      return;
    }

    const proveedorId = parseInt(selectProveedor.value);
    if (!proveedorId) return;

    const data = {
      producto_id: productId,
      proveedor_id: proveedorId,
      precio_compra: parseFloat(document.getElementById('ap_precio').value) || null,
      plazo_entrega: parseInt(document.getElementById('ap_plazo').value) || null,
      pedido_minimo: parseInt(document.getElementById('ap_pedido_minimo').value) || 1,
      preferido: document.getElementById('ap_preferido').checked,
    };

    try {
      if (editMode) {
        await updateAsignacion(productId, editMode, data);
        editMode = null;
      } else {
        await createAsignacion(data);
      }
      await renderAsignaciones(productId);
      form.reset();
    } catch (error) {
      alert('Error al guardar asignación: ' + error.message);
    }
  };

  form.removeEventListener('submit', formHandler);
  form.addEventListener('submit', formHandler);

  document.getElementById('ap_close_btn').addEventListener('click', () => {
    document.querySelector('[id="modalInner"]').closest('.fixed').querySelector('button').click();
  });
}

async function renderAsignaciones(productId) {
  try {
    const asignaciones = await fetchAsignaciones(productId);
    const tbody = document.querySelector('#ap_asignaciones_table tbody');
    tbody.innerHTML = asignaciones.map(a => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 font-medium text-gray-900">${a.proveedor_nombre}</td>
        <td class="px-4 py-3 text-gray-700">$${a.precio.toFixed(2)}</td>
        <td class="px-4 py-3 text-gray-700">${a.plazo ? a.plazo + ' días' : 'N/A'}</td>
        <td class="px-4 py-3">
          ${a.preferido ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Preferido</span>' : '<span class="text-gray-500 text-sm">No</span>'}
        </td>
        <td class="px-4 py-3 text-gray-700">${a.pedido_minimo}</td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center gap-2 justify-end">
            <button class="edit-btn w-8 h-8 rounded-lg flex items-center justify-center hover:bg-brandOrange/10 text-gray-600 hover:text-brandOrange transition-all" data-proveedor-id="${a.proveedor_id}" title="Editar">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
            <button class="delete-btn w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all" data-proveedor-id="${a.proveedor_id}" title="Eliminar">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M10 11v6" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M14 11v6" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        try {
          const provId = e.target.dataset.proveedorId;
          const asign = await fetchAsignacion(productId, provId);
          const selectProveedor = document.getElementById('ap_proveedor');
          selectProveedor.value = asign.proveedor_id;
          document.getElementById('ap_precio').value = asign.precio_compra || '';
          document.getElementById('ap_plazo').value = asign.plazo_entrega || '';
          document.getElementById('ap_pedido_minimo').value = asign.pedido_minimo || 1;
          document.getElementById('ap_preferido').checked = asign.preferido;
          editMode = provId;
        } catch (error) {
          alert('Error al cargar asignación: ' + error.message);
        }
      });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (confirm('¿Seguro que desea eliminar esta asignación?')) {
          try {
            const provId = e.target.dataset.proveedorId;
            await deleteAsignacion(productId, provId);
            await renderAsignaciones(productId);
          } catch (error) {
            alert('Error al eliminar asignación: ' + error.message);
          }
        }
      });
    });
  } catch (error) {
    alert('Error al cargar asignaciones: ' + error.message);
  }
}
