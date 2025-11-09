// static/js/views/modalControllers.js
(function () {
  window.modalControllers = {
    /**
     * Inicializa el modal inyectado.
     * containerEl: el elemento DOM del modal (por ejemplo document.querySelector('[data-modal-type="ap_productos"]'))
     * opts: { productId, vueApp }
     */
    initModal(containerEl, opts = {}) {
      if (!containerEl) return;
      const type = containerEl.getAttribute('data-modal-type');
      const productId = containerEl.getAttribute('data-product-id') || opts.productId || null;
      const vueApp = opts.vueApp || window.inventarioApp || null;

      if (type === 'ap_productos') {
        initAssignProveedor(containerEl, { productId, vueApp });
      } else if (type === 'ce_productos') {
        initCeProductos(containerEl, { productId, vueApp });
      } else if (type === 'registrar_movimiento') {
        initRegistrarMovimiento(containerEl, { productId, vueApp });
      }
    }
  };

  /* --------- Helpers/initializers --------- */

  async function initAssignProveedor(container, { productId, vueApp }) {
    const form = container.querySelector('#assignProveedorForm');
    const proveedorSelect = container.querySelector('#ap_proveedor');
    const productoField = container.querySelector('#ap_producto');
    const tableBody = container.querySelector('#ap_asignaciones_table tbody');
    const closeBtn = container.querySelector('#ap_close_btn');

    // cargar lista de proveedores
    try {
      const proveedores = await window.proveedorService.list();
      proveedorSelect.innerHTML = '<option value="">Seleccione</option>' +
        proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    } catch (e) {
      proveedorSelect.innerHTML = '<option value="">(error cargando proveedores)</option>';
      console.error(e);
    }

    // cargar datos producto si viene id
    if (productId) {
      try {
        const prod = await window.productoService.get(productId);
        productoField.value = `${prod.nombre} (${prod.sku || ''})`;
        container.querySelector('#ap_producto_nombre').textContent = prod.nombre;
        // cargar asignaciones existentes (endpoint ejemplo)
        await refreshAsignaciones(productId, tableBody);
      } catch (e) {
        productoField.value = 'Producto (error al cargar)';
        console.error(e);
      }
    } else {
      productoField.value = '(No especificado)';
      container.querySelector('#ap_producto_nombre').textContent = '(No especificado)';
    }

    // submit
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const payload = {
        producto_id: productId,
        proveedor_id: proveedorSelect.value,
        precio_compra: parseFloat(container.querySelector('#ap_precio').value || 0),
        plazo_entrega: parseInt(container.querySelector('#ap_plazo').value || 0, 10),
        pedido_minimo: parseInt(container.querySelector('#ap_pedido_minimo').value || 0, 10),
        preferido: !!container.querySelector('#ap_preferido').checked
      };
      try {
        const resp = await fetch('/inventario/api/asignaciones', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error('Error al asignar proveedor');
        // refresh table
        await refreshAsignaciones(productId, tableBody);
        // si hay app Vue, actualizar listado si corresponde
        if (vueApp && typeof vueApp.loadProducts === 'function') await vueApp.loadProducts();
        alert('Proveedor asignado correctamente');
        // limpiar formulario
        form.reset();
      } catch (err) {
        console.error(err);
        alert('Error al asignar proveedor: ' + err.message);
      }
    });

    // close btn
    closeBtn && closeBtn.addEventListener('click', () => {
      // disparar el botón de cerrar del modal en la app (busca el contenedor modal)
      const close = document.querySelector('[data-modal-urls]')?.__vueCloseModal;
      // en caso de que no exista, simplemente recargar la página o cerrar manualmente
      document.querySelector('.v-overlay')?.remove && document.querySelector('.v-overlay').remove();
      // preferible llamar a vueApp.closeModal si se expuso
      if (vueApp && typeof vueApp.closeModal === 'function') vueApp.closeModal();
    });

    // helper para refrescar asignaciones
    async function refreshAsignaciones(productId, tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-sm text-gray-500">Cargando...</td></tr>';
      try {
        const resp = await fetch(`/inventario/api/asignaciones?producto_id=${encodeURIComponent(productId)}`);
        if (!resp.ok) throw new Error('No se pudieron cargar asignaciones');
        const list = await resp.json();
        if (!Array.isArray(list) || list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-sm text-gray-500">No tiene proveedores asignados.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(a => `
          <tr>
            <td class="px-3 py-2">${a.proveedor_nombre}</td>
            <td class="px-3 py-2">${a.precio_compra ? '$' + Number(a.precio_compra).toFixed(2) : ''}</td>
            <td class="px-3 py-2">${a.plazo_entrega || ''}</td>
            <td class="px-3 py-2">${a.pedido_minimo || ''}</td>
            <td class="px-3 py-2">${a.preferido ? '<span class="text-orange-600 font-semibold">Sí</span>' : 'No'}</td>
            <td class="px-3 py-2 text-right">
              <button data-id="${a.id}" class="ap_edit text-blue-600 mr-3">Editar</button>
              <button data-id="${a.id}" class="ap_delete text-red-600">Eliminar</button>
            </td>
          </tr>
        `).join('');

        // attach handlers for edit/delete
        tbody.querySelectorAll('.ap_delete').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Eliminar asignación?')) return;
            const id = btn.getAttribute('data-id');
            const r = await fetch(`/inventario/api/asignaciones/${id}`, { method: 'DELETE' });
            if (!r.ok) return alert('Error al eliminar');
            await refreshAsignaciones(productId, tbody);
          });
        });

        tbody.querySelectorAll('.ap_edit').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const r = await fetch(`/inventario/api/asignaciones/${id}`);
            if (!r.ok) return alert('Error al obtener asignación');
            const asign = await r.json();
            // rellenar form con datos para editar (puedes cambiar a PUT en submit)
            proveedorSelect.value = asign.proveedor_id || '';
            container.querySelector('#ap_precio').value = asign.precio_compra || '';
            container.querySelector('#ap_plazo').value = asign.plazo_entrega || '';
            container.querySelector('#ap_pedido_minimo').value = asign.pedido_minimo || '';
            container.querySelector('#ap_preferido').checked = !!asign.preferido;
            // opcional: almacenar asign_id en form.dataset para actualizar
            form.dataset.editing = id;
          });
        });

      } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-sm text-red-600">Error cargando asignaciones</td></tr>';
      }
    }
  }

  async function initCeProductos(container, { productId, vueApp }) {
    const form = container.querySelector('#productForm');
    const sku = container.querySelector('#prod_sku');
    const nombre = container.querySelector('#prod_nombre');
    const precio = container.querySelector('#prod_precio');
    const estado = container.querySelector('#prod_estado');
    const categoria = container.querySelector('#prod_categoria');
    const descripcion = container.querySelector('#prod_descripcion');
    const cancelBtn = container.querySelector('#prod_cancel');

    // cargar categorias
    try {
      const cats = await window.productoService.listCategorias();
      categoria.innerHTML = '<option value="">Seleccione</option>' + cats.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
    } catch (e) {
      categoria.innerHTML = '<option value="">(error)</option>';
      console.error(e);
    }

    // Si viene productId, cargar producto
    if (productId) {
      try {
        const p = await window.productoService.get(productId);
        sku.value = p.sku || '';
        nombre.value = p.nombre || '';
        precio.value = p.precio || '';
        estado.value = p.estado || '';
        categoria.value = p.categoria_id || '';
        descripcion.value = p.descripcion || '';
      } catch (e) {
        console.error(e);
      }
    }

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const payload = {
        sku: sku.value,
        nombre: nombre.value,
        precio: precio.value,
        estado: estado.value,
        categoria_id: categoria.value,
        descripcion: descripcion.value
      };
      try {
        if (productId) {
          await window.productoService.update(productId, payload);
        } else {
          await window.productoService.create(payload);
        }
        alert('Guardado correctamente');
        if (vueApp && typeof vueApp.loadProducts === 'function') await vueApp.loadProducts();
        if (vueApp && typeof vueApp.closeModal === 'function') vueApp.closeModal();
      } catch (err) {
        console.error(err);
        alert('Error guardando: ' + err.message);
      }
    });

    cancelBtn && cancelBtn.addEventListener('click', () => {
      if (vueApp && typeof vueApp.closeModal === 'function') vueApp.closeModal();
    });
  }

// Reemplaza SOLO esta función en modalControllers.js
async function initRegistrarMovimiento(container, { productId, vueApp }) {
  const form = container.querySelector('#movimientoForm');
  const tipo = container.querySelector('#mov_tipo');
  const usuario = container.querySelector('#mov_usuario');

  const selecProducto = container.querySelector('#mov_producto');
  const selecLote = container.querySelector('#mov_lote');
  const inputCantidad = container.querySelector('#mov_cantidad');

  const seccionPedido = container.querySelector('#mov_seccion_pedido');
  const selecPedido = container.querySelector('#mov_pedido');
  const selecDetalle = container.querySelector('#mov_detalle');
  const inputDetalleProducto = container.querySelector('#mov_detalle_producto');
  const inputDetalleSolicitado = container.querySelector('#mov_detalle_solicitado');
  const inputCantidadRecibida = container.querySelector('#mov_cantidad_recibida');

  const inputLoteCodigo = container.querySelector('#mov_lote_codigo');
  const inputFechaFab = container.querySelector('#mov_fecha_fabricacion');
  const inputFechaVen = container.querySelector('#mov_fecha_vencimiento');
  const inputNotaPedido = container.querySelector('#mov_nota_pedido');

  const btnCancelar = container.querySelector('#mov_cancel');
  const btnAgregarOtro = container.querySelector('#mov_agregar_otro');
  const btnCerrarSmall = container.querySelector('#mov_close_small');

  const msgError = container.querySelector('#mov_msg_error');
  const msgSuccess = container.querySelector('#mov_msg_success');

  function showError(text) {
    console.warn('[mov][error]', text);
    if (msgSuccess) msgSuccess.classList.add('hidden');
    if (msgError) { msgError.textContent = text; msgError.classList.remove('hidden'); }
  }
  function showSuccess(text) {
    console.info('[mov][success]', text);
    if (msgError) msgError.classList.add('hidden');
    if (msgSuccess) { msgSuccess.textContent = text; msgSuccess.classList.remove('hidden'); }
  }
  function clearMsgs() {
    if (msgError) { msgError.classList.add('hidden'); msgError.textContent = ''; }
    if (msgSuccess) { msgSuccess.classList.add('hidden'); msgSuccess.textContent = ''; }
  }

  console.debug('[initRegistrarMovimiento] start', { productId });

  // --- cargar usuario actual desde /cuenta/api/user (tu blueprint lo expone ahí) ---
  try {
    const respUser = await fetch('/cuenta/api/user');
    if (respUser.ok) {
      const u = await respUser.json();
      // Agregado fallback extra por si las claves del JSON son snake_case o diferentes
      usuario.value = u.fullName || u.full_name || u.nombre || u.name || u.email || '(Usuario no identificado)';
      console.debug('[usuario] cargado', u);
    } else {
      console.warn('[usuario] /cuenta/api/user status', respUser.status);
      usuario.value = '(Error cargando usuario)';
    }
  } catch (e) {
    console.error('[usuario] fetch error', e);
    usuario.value = '(Error cargando usuario)';
  }

  // --- cargar productos ---
  async function loadProductos() {
    try {
      const resp = await fetch('/inventario/api/productos');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const list = await resp.json();
      selecProducto.innerHTML = '<option value="">Seleccione producto</option>' +
        list.map(p => `<option value="${p.id}">${p.nombre || p.name}</option>`).join('');
      console.debug('[productos] cargados', list.length);
      if (productId) selecProducto.value = productId;
    } catch (e) {
      console.error('[productos] error', e);
      selecProducto.innerHTML = '<option value="">(error cargando productos)</option>';
    }
  }
  await loadProductos();

  // --- cargar lotes para un producto (usa movimientoService si existe) ---
  async function loadLotes(productoId) {
    try {
      if (!productoId) { selecLote.innerHTML = '<option value="">No asignar lote</option>'; return; }
      selecLote.innerHTML = '<option value="">Cargando lotes...</option>';
      let lotes = [];
      if (window.movimientoService && typeof window.movimientoService.listLotes === 'function') {
        lotes = await window.movimientoService.listLotes(productoId);
      } else {
        const r = await fetch(`/inventario/api/productos/${encodeURIComponent(productoId)}/lotes`);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        lotes = await r.json();
      }
      if (!Array.isArray(lotes) || lotes.length === 0) {
        selecLote.innerHTML = '<option value="">No hay lotes</option>';
      } else {
        selecLote.innerHTML = '<option value="">No asignar lote</option>' + lotes.map(l => `<option value="${l.id}">${l.codigo || l.id}</option>`).join('');
      }
      console.debug('[lotes] cargados', (lotes && lotes.length) || 0);
    } catch (e) {
      console.error('[lotes] error', e);
      selecLote.innerHTML = '<option value="">(error)</option>';
    }
  }

  // attach change to product select
  selecProducto.addEventListener('change', () => {
    const pid = selecProducto.value;
    console.debug('[select producto] change ->', pid);
    loadLotes(pid);
  });

  // --- cargar pedidos pendientes (usa movimientoService si existe) ---
  async function loadPedidosPendientes() {
    if (!selecPedido) return [];
    selecPedido.innerHTML = '<option value="">Cargando pedidos...</option>';
    try {
      let pedidos = [];
      if (window.movimientoService && typeof window.movimientoService.listPedidosPendientes === 'function') {
        pedidos = await window.movimientoService.listPedidosPendientes();
      } else {
        const resp = await fetch('/inventario/api/pedidos/pendientes');
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        pedidos = await resp.json();
      }
      if (!Array.isArray(pedidos) || pedidos.length === 0) {
        selecPedido.innerHTML = '<option value="">No hay pedidos pendientes</option>';
        console.debug('[pedidos pendientes] no hay datos');
        return [];
      }
      selecPedido.innerHTML = '<option value="">Seleccione pedido</option>' + pedidos.map(pd => `<option value="${pd.id}">${pd.codigo || 'Pedido #' + pd.id}</option>`).join('');
      console.debug('[pedidos pendientes] cargados', pedidos.length);
      return pedidos;
    } catch (e) {
      console.error('[pedidos pendientes] error', e);
      selecPedido.innerHTML = '<option value="">(error cargando pedidos)</option>';
      return [];
    }
  }

  // cuando cambia pedido -> cargar detalles
  selecPedido && selecPedido.addEventListener('change', async () => {
    const pid = selecPedido.value;
    console.debug('[pedido] change', pid);
    selecDetalle.innerHTML = '<option value="">Cargando ítems...</option>';
    if (!pid) { selecDetalle.innerHTML = '<option value="">Seleccione ítem</option>'; return; }
    try {
      const resp = await fetch(`/inventario/api/pedidos/${encodeURIComponent(pid)}/detalles`);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const detalles = await resp.json();
      if (!Array.isArray(detalles) || detalles.length === 0) {
        selecDetalle.innerHTML = '<option value="">No hay ítems</option>'; return;
      }
      // Agregado data-producto_id por si el backend necesita producto_id en el payload (asumiendo que detalles tiene producto_id)
      selecDetalle.innerHTML = '<option value="">Seleccione ítem</option>' +
        detalles.map(d => `<option value="${d.id}" data-nombre="${d.producto_nombre}" data-cantidad="${d.cantidad_solicitada}" data-producto_id="${d.producto_id || ''}">${d.producto_nombre} — ${d.cantidad_solicitada}</option>`).join('');
      console.debug('[detalles pedido] cargados', detalles.length);
    } catch (e) {
      console.error('[detalles pedido] error', e);
      selecDetalle.innerHTML = '<option value="">(error)</option>';
    }
  });

  // cuando seleccionan detalle -> rellenar info
  selecDetalle && selecDetalle.addEventListener('change', () => {
    const opt = selecDetalle.selectedOptions[0];
    if (!opt) { inputDetalleProducto.value = ''; inputDetalleSolicitado.value = ''; return; }
    inputDetalleProducto.value = opt.dataset.nombre || '';
    inputDetalleSolicitado.value = opt.dataset.cantidad || '';
    inputCantidadRecibida.value = '';
    console.debug('[detalle seleccionado]', { nombre: inputDetalleProducto.value, cantidad: inputDetalleSolicitado.value });
  });

  // --- mostrar/ocultar sección pedido ---
  const handleTipo = async () => {
    clearMsgs();
    console.debug('[tipo] value=', tipo.value);
    if (tipo.value === 'recepcion_de_pedido') {
      seccionPedido && seccionPedido.classList.remove('hidden');
      // cargar pedidos cuando se muestra
      await loadPedidosPendientes();
    } else {
      seccionPedido && seccionPedido.classList.add('hidden');
    }
  };

  // escucha BOTH change e input para mayor compatibilidad
  tipo.addEventListener('change', handleTipo);
  tipo.addEventListener('input', handleTipo);

  // forzar estado inicial (por si el select ya viene con valor)
  try {
    await Promise.resolve();
    await handleTipo();
  } catch (e) { console.error('[init] handleTipo error', e); }

  // agregar otro ítem
  btnAgregarOtro && btnAgregarOtro.addEventListener('click', () => {
    clearMsgs();
    if (tipo.value === 'recepcion_de_pedido') {
      selecDetalle.value = '';
      inputDetalleProducto.value = '';
      inputDetalleSolicitado.value = '';
      inputCantidadRecibida.value = '';
      inputLoteCodigo.value = '';
      inputFechaFab.value = '';
      inputFechaVen.value = '';
      inputNotaPedido.value = '';
    } else {
      inputCantidad.value = '';
      inputLoteCodigo.value = '';
      inputNotaPedido.value = '';
    }
    showSuccess('Campos listos para nuevo ítem');
  });

  // cancelar / cerrar
  btnCancelar && btnCancelar.addEventListener('click', () => { if (vueApp && vueApp.closeModal) vueApp.closeModal(); });
  btnCerrarSmall && btnCerrarSmall.addEventListener('click', () => { if (vueApp && vueApp.closeModal) vueApp.closeModal(); });

  // submit
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearMsgs();
    try {
      if (!tipo.value) return showError('Seleccione el tipo de movimiento.');
      if (tipo.value === 'recepcion_de_pedido') {
        if (!selecPedido.value) return showError('Seleccione un pedido.');
        if (!selecDetalle.value) return showError('Seleccione un ítem del pedido.');
        const max = Number(inputDetalleSolicitado.value || 0);
        const recibida = Number(inputCantidadRecibida.value || 0);
        if (recibida < 0) return showError('Cantidad recibida debe ser >= 0.');
        if (recibida > max) return showError('La cantidad recibida no puede superar la solicitada.');
      } else {
        if (!selecProducto.value) return showError('Seleccione un producto.');
        const cant = Number(inputCantidad.value || 0);
        if (isNaN(cant) || cant === 0) return showError('Ingrese una cantidad válida (no 0).');
        if (tipo.value === 'ajuste' && (!inputNotaPedido.value || inputNotaPedido.value.trim() === '')) return showError('Ingrese una nota para el ajuste.');
      }

      // Obtener productId desde data-producto_id si es recepcion (agregado para robustez)
      let productoId = tipo.value === 'recepcion_de_pedido' ? 
        (selecDetalle.selectedOptions[0] ? selecDetalle.selectedOptions[0].dataset.producto_id || null : null) : 
        selecProducto.value || null;

      const payload = {
        tipo: tipo.value,
        usuario_nombre: usuario.value || null,
        producto_id: productoId,
        lote_id: selecLote.value || null,
        cantidad: (tipo.value === 'recepcion_de_pedido') ? Number(inputCantidadRecibida.value || 0) : Number(inputCantidad.value || 0),
        pedido_id: tipo.value === 'recepcion_de_pedido' ? selecPedido.value : null,
        detalle_pedido_id: tipo.value === 'recepcion_de_pedido' ? selecDetalle.value : null,
        lote_codigo: inputLoteCodigo.value || null,
        fecha_fabricacion: inputFechaFab.value || null,
        fecha_vencimiento: inputFechaVen.value || null,
        nota: (inputNotaPedido.value || null)
      };

      await window.movimientoService.crear(payload);
      showSuccess('Movimiento guardado correctamente.');
      if (vueApp && typeof vueApp.loadProducts === 'function') await vueApp.loadProducts();
      setTimeout(() => { if (vueApp && vueApp.closeModal) vueApp.closeModal(); }, 700);
    } catch (e) {
      console.error('[submit] error', e);
      showError('Error guardando movimiento: ' + (e.message || e));
    }
  });

  // si vino productId preseleccionado, cargar lotes
  if (productId) {
    selecProducto.value = productId;
    loadLotes(productId);
  }
}

})();
