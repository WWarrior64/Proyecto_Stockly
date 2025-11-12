import { fetchProducts } from '/static/js/services/productService.js';
import { fetchPedidosPendientes, fetchDetallesPedido, fetchLotes, createMovimiento, fetchRecepcionesPedido } from '/static/js/services/movimientoService.js';

export async function initMovimientoModal(id) {
  document.getElementById('mov_usuario').value = 'Usuario Actual';

  const products = await fetchProducts();
  const selectProducto = document.getElementById('mov_producto');
  selectProducto.innerHTML = '<option value="">Seleccione</option>' + products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  const pendientes = await fetchPedidosPendientes();
  const selectPedido = document.getElementById('mov_pedido');
  selectPedido.innerHTML = '<option value="">Seleccione</option>' + pendientes.map(p => `<option value="${p.id}">${p.codigo} - ${p.proveedor_nombre}</option>`).join('');

  const selectTipo = document.getElementById('mov_tipo');
  selectTipo.addEventListener('change', (e) => {
    const isRecepcion = e.target.value === 'recepcion_de_pedido';
    document.getElementById('mov_seccion_general').classList.toggle('hidden', isRecepcion);
    document.getElementById('mov_seccion_pedido').classList.toggle('hidden', !isRecepcion);
  });

  selectProducto.addEventListener('change', async (e) => {
    const prodId = e.target.value;
    if (prodId) {
      const lotes = await fetchLotes(prodId);
      const selectLote = document.getElementById('mov_lote');
      selectLote.innerHTML = '<option value="">No asignar</option>' + lotes.map(l => `<option value="${l.id}">${l.codigo} (Stock: ${l.stock})</option>`).join('');
    }
  });

  selectPedido.addEventListener('change', async (e) => {
    const pedId = e.target.value;
    if (pedId) {
      const detalles = await fetchDetallesPedido(pedId);
      const selectDetalle = document.getElementById('mov_detalle');
      selectDetalle.innerHTML = '<option value="">Seleccione</option>' + detalles.map(d => `<option value="${d.producto_id}" data-solicitado="${d.cantidad_solicitada}">${d.producto_nombre} (${d.cantidad_solicitada})</option>`).join('');
      
      await loadRecepciones(pedId);
    }
  });

  async function loadRecepciones(pedidoId) {
    try {
      const recepciones = await fetchRecepcionesPedido(pedidoId);
      const container = document.getElementById('mov_recepciones_container');
      const tbody = document.getElementById('mov_recepciones_tbody');
      
      if (recepciones && recepciones.length > 0) {
        tbody.innerHTML = recepciones.map(r => `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 text-sm text-gray-900">${r.producto_nombre}</td>
            <td class="px-4 py-3 text-sm font-semibold text-gray-900">${r.cantidad_recibida}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${r.lote_codigo || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${r.fecha ? new Date(r.fecha).toLocaleDateString() : 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${r.usuario}</td>
          </tr>
        `).join('');
        container.classList.remove('hidden');
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500">No hay recepciones registradas aún</td></tr>';
        container.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error al cargar recepciones:', error);
    }
  }

  const selectDetalle = document.getElementById('mov_detalle');
  selectDetalle.addEventListener('change', (e) => {
    const option = e.target.options[e.target.selectedIndex];
    document.getElementById('mov_detalle_producto').value = option.text.split(' (')[0];
    const solicitado = parseFloat(option.dataset.solicitado) || 0;
    document.getElementById('mov_detalle_solicitado').value = solicitado;
    document.getElementById('mov_cantidad_recibida').max = solicitado;
  });

  const form = document.getElementById('movimientoForm');
  
  const handleSubmit = async () => {
    const tipo = selectTipo.value;

    if (!tipo) {
      alert('Por favor seleccione un tipo de movimiento');
      return false;
    }

    if (!form.reportValidity()) {
      return false;
    }

    const cantidadRecibida = parseFloat(document.getElementById('mov_cantidad_recibida').value);
    const solicitado = parseFloat(document.getElementById('mov_detalle_solicitado').value);

    if (tipo === 'recepcion_de_pedido' && cantidadRecibida > solicitado) {
      alert(`La cantidad recibida (${cantidadRecibida}) no puede exceder la cantidad solicitada (${solicitado})`);
      return false;
    }

    const data = {
      tipo_movimiento: tipo,
      producto_id: tipo === 'recepcion_de_pedido' ? parseInt(selectDetalle.value) : parseInt(selectProducto.value),
      cantidad: tipo === 'recepcion_de_pedido' ? cantidadRecibida : parseFloat(document.getElementById('mov_cantidad').value),
      lote_id: tipo !== 'recepcion_de_pedido' ? parseInt(document.getElementById('mov_lote').value) || null : null,
      pedido_id: tipo === 'recepcion_de_pedido' ? parseInt(selectPedido.value) : null,
      nota: tipo === 'recepcion_de_pedido' ? document.getElementById('mov_nota_pedido').value : '',
      fecha_fabricacion: tipo === 'recepcion_de_pedido' ? document.getElementById('mov_fecha_fabricacion').value || null : null,
      fecha_vencimiento: tipo === 'recepcion_de_pedido' ? document.getElementById('mov_fecha_vencimiento').value || null : null,
      lote_codigo: tipo === 'recepcion_de_pedido' ? document.getElementById('mov_lote_codigo').value : null,
    };

    if (isNaN(data.cantidad) || data.cantidad <= 0) {
      alert('La cantidad debe ser un número mayor que 0');
      return false;
    }

    try {
      await createMovimiento(data);
      document.getElementById('mov_msg_success').textContent = 'Movimiento registrado exitosamente.';
      document.getElementById('mov_msg_success').classList.remove('hidden');
      document.getElementById('mov_msg_error').classList.add('hidden');
      return true;
    } catch (err) {
      document.getElementById('mov_msg_error').textContent = 'Error al registrar movimiento: ' + err.message;
      document.getElementById('mov_msg_error').classList.remove('hidden');
      document.getElementById('mov_msg_success').classList.add('hidden');
      return false;
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const success = await handleSubmit();
    if (success) {
      form.reset();
    }
  });

  document.getElementById('mov_cancel').addEventListener('click', () => {
    document.querySelector('[id="modalInner"]').closest('.fixed').querySelector('button').click();
  });

  document.getElementById('mov_agregar_otro').addEventListener('click', async () => {
    const success = await handleSubmit();
    if (success) {
      const pedidoId = parseInt(selectPedido.value);
      if (pedidoId) {
        await loadRecepciones(pedidoId);
      }
      
      selectDetalle.value = '';
      document.getElementById('mov_detalle_producto').value = '';
      document.getElementById('mov_detalle_solicitado').value = '';
      document.getElementById('mov_cantidad_recibida').value = '';
      document.getElementById('mov_lote_codigo').value = '';
      document.getElementById('mov_fecha_fabricacion').value = '';
      document.getElementById('mov_fecha_vencimiento').value = '';
      document.getElementById('mov_nota_pedido').value = '';
    }
  });
}
