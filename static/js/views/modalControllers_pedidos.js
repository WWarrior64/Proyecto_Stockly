// static/js/views/modalControllers_pedidos.js
// Inicializador del modal Crear / Editar Pedido (archivo separado para evitar conflictos)
window.initCrearEditarPedido = async function initCrearEditarPedido(container, { pedidoId = null, vueApp = null } = {}) {
  if (!container) {
    console.warn('initCrearEditarPedido: container no encontrado');
    return;
  }

  // elements
  const form = container.querySelector('#pedidoForm');
  const inputCodigo = container.querySelector('#pedido_codigo');
  const inputFecha = container.querySelector('#pedido_fecha');
  const selectEstado = container.querySelector('#pedido_estado');
  const selectProveedor = container.querySelector('#pedido_proveedor');
  const selectTipoPago = container.querySelector('#pedido_tipo_pago');

  const btnAgregar = container.querySelector('#pedido_agregar_detalle');
  const tbody = container.querySelector('#pedido_detalles_tbody');
  const template = container.querySelector('#pedido_detalle_template');
  const totalEl = container.querySelector('#pedido_total');

  const btnRegistrarRecep = container.querySelector('#pedido_registrar_recepcion');
  const btnCancelar = container.querySelectorAll('.close-modal-small');

  const msgError = container.querySelector('#pedido_error');
  const msgSuccess = container.querySelector('#pedido_success');

  function showError(txt) {
    if (msgSuccess) { msgSuccess.classList.add('hidden'); msgSuccess.textContent = ''; }
    if (msgError) { msgError.textContent = txt; msgError.classList.remove('hidden'); }
  }
  function showSuccess(txt) {
    if (msgError) { msgError.classList.add('hidden'); msgError.textContent = ''; }
    if (msgSuccess) { msgSuccess.textContent = txt; msgSuccess.classList.remove('hidden'); }
  }
  function clearMsgs() {
    if (msgError) { msgError.classList.add('hidden'); msgError.textContent = ''; }
    if (msgSuccess) { msgSuccess.classList.add('hidden'); msgSuccess.textContent = ''; }
  }

  // util: poblar select con opciones (array de {id,nombre})
  function fillSelect(selectEl, items, placeholderText) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = placeholderText || 'Seleccione';
    selectEl.appendChild(ph);
    (items || []).forEach(it => {
      const o = document.createElement('option');
      o.value = it.id;
      o.textContent = it.nombre || it.name || it.descripcion || String(it.id);
      selectEl.appendChild(o);
    });
  }

  // obtener listados (proveedores, productos, tipoPagos)
  let cachedProductos = [];
  async function loadAuxData() {
    try {
      const provs = await window.pedidosService.listProveedores();
      fillSelect(selectProveedor, provs, 'Seleccione proveedor');
    } catch (e) {
      console.error('Error cargando proveedores', e);
    }

    try {
      const tipos = await window.pedidosService.listTipoPagos();
      fillSelect(selectTipoPago, tipos, 'Seleccione tipo');
    } catch (e) {
      console.error('Error cargando tipos de pago', e);
    }

    try {
      cachedProductos = await window.pedidosService.listProductos();
    } catch (e) {
      console.error('Error cargando productos', e);
      cachedProductos = [];
    }
  }

  // calculos
  function recalcRow(row) {
    const cantidadEl = row.querySelector('.detalle-cantidad');
    const precioEl = row.querySelector('.detalle-precio');
    const subtotalEl = row.querySelector('.detalle-subtotal');
    const cant = Number(cantidadEl?.value || 0);
    const precio = Number(precioEl?.value || 0);
    const sub = Math.max(0, cant * precio);
    if (subtotalEl) subtotalEl.textContent = sub.toFixed(2);
  }
  function recalcTotal() {
    let total = 0;
    (tbody.querySelectorAll('.detalle-row') || []).forEach(r => {
      const subEl = r.querySelector('.detalle-subtotal');
      const val = Number(subEl?.textContent || 0);
      total += val;
    });
    if (totalEl) totalEl.textContent = `Total: $${total.toFixed(2)}`;
    return total;
  }

  // agregar fila clonando template
  function addDetalleRow(prefill = {}) {
    if (!template) return;
    // remove placeholder row if present
    const placeholder = tbody.querySelector('.no-items-row');
    if (placeholder) placeholder.remove();

    const frag = template.content.cloneNode(true);
    const tr = frag.querySelector('tr');
    // append
    tbody.appendChild(frag);

    const newRow = tbody.querySelector('.detalle-row:last-of-type');
    const selectProd = newRow.querySelector('.detalle-producto');
    const cantidadEl = newRow.querySelector('.detalle-cantidad');
    const precioEl = newRow.querySelector('.detalle-precio');
    const subtotalEl = newRow.querySelector('.detalle-subtotal');
    const btnDel = newRow.querySelector('.detalle-eliminar');

    // populate product select
    fillSelect(selectProd, cachedProductos, 'Seleccione producto');
    if (prefill.producto_id) selectProd.value = prefill.producto_id;
    if (prefill.cantidad) cantidadEl.value = prefill.cantidad;
    if (prefill.precio_unitario) precioEl.value = Number(prefill.precio_unitario).toFixed(2);

    // events
    selectProd.addEventListener('change', async () => {
      const pid = selectProd.value;
      const provId = selectProveedor.value;
      let precio = 0;
      if (provId && pid) {
        try {
          const resp = await fetch(`/pedidos/api/producto_proveedor_precio?producto_id=${pid}&proveedor_id=${provId}`, { credentials: 'same-origin' });
          if (resp.ok) {
            const data = await resp.json();
            if (data.precio !== null && data.precio !== undefined) {
              precio = Number(data.precio);
            }
          }
        } catch (e) {
          console.error('Error fetching precio_compra', e);
        }
      }
      if (precio === 0) {
        // fallback to producto.preciounitario
        const prod = cachedProductos.find(p => String(p.id) === String(pid));
        if (prod && prod.preciounitario != null) {
          precio = Number(prod.preciounitario);
        }
      }
      precioEl.value = precio.toFixed(2);
      recalcRow(newRow);
      recalcTotal();
    });

    cantidadEl.addEventListener('input', () => {
      recalcRow(newRow);
      recalcTotal();
    });

    btnDel.addEventListener('click', () => {
      newRow.remove();
      // if no rows left, show placeholder
      if (!tbody.querySelector('.detalle-row')) {
        tbody.insertAdjacentHTML('afterbegin', '<tr class="no-items-row"><td colspan="5" class="text-center py-4 text-gray-500">Sin productos agregados.</td></tr>');
      }
      recalcTotal();
    });

    // initial calc
    recalcRow(newRow);
    recalcTotal();
  }

  // load existing pedido if editing
  async function loadPedidoIfNeeded() {
    if (!pedidoId) return;
    try {
      const data = await window.pedidosService.get(pedidoId);
      // map basic fields (ajusta según la estructura real)
      inputCodigo && (inputCodigo.value = data.codigo || '');
      inputFecha && (inputFecha.value = data.fecha || '');
      selectEstado && (selectEstado.value = data.estado || 'pendiente');
      if (selectProveedor && data.proveedor_id) selectProveedor.value = data.proveedor_id;
      if (selectTipoPago && data.tipo_pago_id) selectTipoPago.value = data.tipo_pago_id;

      // detalles si existen
      if (Array.isArray(data.detalles) && data.detalles.length) {
        // limpiar tbody
        tbody.innerHTML = '';
        for (const det of data.detalles) {
          addDetalleRow({
            producto_id: det.producto_id,
            cantidad: det.cantidad || 1,
            precio_unitario: det.precio_unitario || 0
          });
        }
      }
      // mostrar registrar recepcion si aplica
      if (btnRegistrarRecep && data.estado === 'pendiente') btnRegistrarRecep.style.display = '';
    } catch (e) {
      console.error('Error cargando pedido para edición', e);
      showError('No se pudo cargar el pedido (ver consola).');
    }
  }

  // agregar listeners
  btnAgregar && btnAgregar.addEventListener('click', () => addDetalleRow());

  // cancelar / close
  btnCancelar.forEach(b => b.addEventListener('click', (ev) => {
    ev.preventDefault();
    clearMsgs();
    if (vueApp && typeof vueApp.closeModal === 'function') vueApp.closeModal();
  }));

  // registrar recepción (solo marca UI, backend depende de tu API)
  btnRegistrarRecep && btnRegistrarRecep.addEventListener('click', async () => {
    // implementación simple: llamar a un endpoint si existe
    if (!pedidoId) return showError('Registro de recepción solo disponible en edición.');
    try {
      const resp = await fetch(`/pedidos/api/${encodeURIComponent(pedidoId)}/registrar-recepcion`, {
        method: 'POST',
        credentials: 'same-origin'
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      showSuccess('Recepción registrada.');
      if (vueApp && typeof vueApp.loadPedidos === 'function') await vueApp.loadPedidos();
      setTimeout(() => { if (vueApp && vueApp.closeModal) vueApp.closeModal(); }, 700);
    } catch (e) {
      console.error('Error registrando recepción', e);
      showError('Error registrando recepción.');
    }
  });

  // submit
  form && form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearMsgs();

    // validaciones básicas
    const codigo = inputCodigo ? inputCodigo.value.trim() : '';
    const proveedorId = selectProveedor ? selectProveedor.value : '';
    if (!proveedorId) return showError('Seleccione un proveedor.');

    // construir detalles arrays
    const filas = Array.from(tbody.querySelectorAll('.detalle-row'));
    if (filas.length === 0) return showError('Agregue al menos un producto al pedido.');

    const detalles = filas.map(r => {
      const pid = r.querySelector('.detalle-producto').value;
      const cantidad = Number(r.querySelector('.detalle-cantidad').value || 0);
      const precio = Number(r.querySelector('.detalle-precio').value || 0);
      return { producto_id: pid, cantidad, precio_unitario: precio };
    });

    const payload = {
      codigo: codigo || null,
      fecha: inputFecha ? inputFecha.value : null,
      estado: selectEstado ? selectEstado.value : 'pendiente',
      proveedor_id: proveedorId,
      tipo_pago_id: selectTipoPago ? selectTipoPago.value : null,
      detalles
    };

    try {
      if (pedidoId) {
        await window.pedidosService.update(pedidoId, payload);
        showSuccess('Pedido actualizado correctamente.');
      } else {
        await window.pedidosService.create(payload);
        showSuccess('Pedido creado correctamente.');
      }
      if (vueApp && typeof vueApp.loadPedidos === 'function') await vueApp.loadPedidos();
      setTimeout(() => { if (vueApp && typeof vueApp.closeModal === 'function') vueApp.closeModal(); }, 800);
    } catch (e) {
      console.error('Error guardando pedido', e);
      showError('Error guardando pedido: ' + (e.message || e));
    }
  });

  // inicialización: cargar auxiliares -> luego pedido (si aplica)
  try {
    await loadAuxData();
    await loadPedidoIfNeeded();
  } catch (e) {
    console.error('initCrearEditarPedido error', e);
  }
};