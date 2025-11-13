import { fetchProducts } from "/static/js/services/productService.js";
import {
  fetchPedidosPendientes,
  fetchDetallesPedido,
  fetchLotes,
  createMovimiento,
  fetchRecepcionesPedido,
  fetchCurrentUser,
} from "/static/js/services/movimientoService.js";

let currentUser = null;
let itemsTemporales = [];

export async function initMovimientoModal(id) {
  console.log("Inicializando modal de movimiento");

  try {
    currentUser = await fetchCurrentUser();
    document.getElementById("mov_usuario").value =
      currentUser.nombre || "Usuario Actual";
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    document.getElementById("mov_usuario").value = "Usuario Actual";
  }

  const products = await fetchProducts();
  const selectProducto = document.getElementById("mov_producto");
  selectProducto.innerHTML =
    '<option value="">Seleccione</option>' +
    products.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");

  const pendientes = await fetchPedidosPendientes();
  const selectPedido = document.getElementById("mov_pedido");
  selectPedido.innerHTML =
    '<option value="">Seleccione</option>' +
    pendientes
      .map(
        (p) =>
          `<option value="${p.id}">${p.codigo} - ${p.proveedor_nombre}</option>`
      )
      .join("");

  const selectTipo = document.getElementById("mov_tipo");
  const btnAgregarOtro = document.getElementById("mov_agregar_otro");
  const selectDetalle = document.getElementById("mov_detalle");
  const form = document.getElementById("movimientoForm");

  selectTipo.addEventListener("change", (e) => {
    const isRecepcion = e.target.value === "recepcion_de_pedido";
    document
      .getElementById("mov_seccion_general")
      .classList.toggle("hidden", isRecepcion);
    document
      .getElementById("mov_seccion_pedido")
      .classList.toggle("hidden", !isRecepcion);

    if (isRecepcion) {
      btnAgregarOtro.classList.remove("hidden");
    } else {
      btnAgregarOtro.classList.add("hidden");
      itemsTemporales = [];
    }
  });

  selectProducto.addEventListener("change", async (e) => {
    const prodId = e.target.value;
    if (prodId) {
      try {
        const lotes = await fetchLotes(prodId);
        const selectLote = document.getElementById("mov_lote");
        selectLote.innerHTML =
          '<option value="">No asignar</option>' +
          lotes
            .map(
              (l) =>
                `<option value="${l.id}">${l.codigo} (Stock: ${l.stock})</option>`
            )
            .join("");
      } catch (error) {
        console.error("Error al cargar lotes:", error);
      }
    }
  });

  selectPedido.addEventListener("change", async (e) => {
    const pedId = e.target.value;
    if (pedId) {
      try {
        const detalles = await fetchDetallesPedido(pedId);
        selectDetalle.innerHTML =
          '<option value="">Seleccione</option>' +
          detalles
            .map(
              (d) =>
                `<option value="${d.producto_id}" data-solicitado="${d.cantidad_solicitada}" data-nombre="${d.producto_nombre}">${d.producto_nombre} (${d.cantidad_solicitada})</option>`
            )
            .join("");

        itemsTemporales = [];
        const tbody = document.getElementById("mov_recepciones_tbody");
        tbody.innerHTML =
          '<tr><td colspan="6" class="px-4 py-4 text-center text-sm text-gray-500">No hay items agregados</td></tr>';
      } catch (error) {
        console.error("Error al cargar detalles:", error);
      }
    }
  });

  selectDetalle.addEventListener("change", (e) => {
    const option = e.target.options[e.target.selectedIndex];
    if (option.value) {
      const nombreProducto =
        option.dataset.nombre || option.text.split(" (")[0];
      document.getElementById("mov_detalle_producto").value = nombreProducto;
      const solicitado = parseFloat(option.dataset.solicitado) || 0;
      document.getElementById("mov_detalle_solicitado").value = solicitado;
      document.getElementById("mov_cantidad_recibida").value = "";
      document.getElementById("mov_cantidad_recibida").disabled = false;
      document.getElementById("mov_msg_error").classList.add("hidden");
    }
  });

  const showError = (message) => {
    const errorDiv = document.getElementById("mov_msg_error");
    const successDiv = document.getElementById("mov_msg_success");
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
    successDiv.classList.add("hidden");
  };

  const showSuccess = (message) => {
    const errorDiv = document.getElementById("mov_msg_error");
    const successDiv = document.getElementById("mov_msg_success");
    successDiv.textContent = message;
    successDiv.classList.remove("hidden");
    errorDiv.classList.add("hidden");
  };

  const handleSubmit = async () => {
    const tipo = selectTipo.value;

    if (!tipo) {
      showError("Por favor seleccione un tipo de movimiento");
      return false;
    }

    let data = {};

    if (tipo === "recepcion_de_pedido") {
      const pedidoId = document.getElementById("mov_pedido").value;
      const productoId = selectDetalle.value;
      const cantidadRecibida = parseFloat(
        document.getElementById("mov_cantidad_recibida").value
      );

      if (!pedidoId) {
        showError("Debe seleccionar un pedido");
        return false;
      }
      if (!productoId) {
        showError("Debe seleccionar un ítem del pedido");
        return false;
      }
      if (!cantidadRecibida || cantidadRecibida <= 0) {
        showError("La cantidad recibida debe ser mayor que 0");
        return false;
      }

      const fechaFabricacion = document.getElementById(
        "mov_fecha_fabricacion"
      ).value;
      const fechaVencimiento = document.getElementById(
        "mov_fecha_vencimiento"
      ).value;

      if (
        fechaFabricacion &&
        fechaVencimiento &&
        new Date(fechaVencimiento) < new Date(fechaFabricacion)
      ) {
        showError(
          "La fecha de vencimiento no puede ser anterior a la fecha de fabricación"
        );
        return false;
      }

      data = {
        tipo_movimiento: tipo,
        producto_id: parseInt(productoId),
        cantidad: cantidadRecibida,
        pedido_id: parseInt(pedidoId),
        nota: document.getElementById("mov_nota_pedido").value || "",
        fecha_fabricacion: fechaFabricacion || null,
        fecha_vencimiento: fechaVencimiento || null,
        lote_codigo: document.getElementById("mov_lote_codigo").value || "",
      };
    } else {
      const productoId = selectProducto.value;
      const cantidad = parseFloat(
        document.getElementById("mov_cantidad").value
      );

      if (!productoId) {
        showError("Debe seleccionar un producto");
        return false;
      }
      if (!cantidad || cantidad === 0) {
        showError("La cantidad debe ser diferente de 0");
        return false;
      }

      data = {
        tipo_movimiento: tipo,
        producto_id: parseInt(productoId),
        cantidad: cantidad,
        lote_id: parseInt(document.getElementById("mov_lote").value) || null,
        nota: document.getElementById("mov_nota_general").value || "",
      };
    }

    try {
      console.log("Enviando datos:", data);
      const result = await createMovimiento(data);
      console.log("Respuesta del servidor:", result);

      showSuccess("Movimiento registrado exitosamente.");
      return true;
    } catch (err) {
      console.error("Error completo:", err);
      showError("Error al registrar movimiento: " + err.message);
      return false;
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Submit del formulario");

    const tipo = selectTipo.value;

    if (tipo === "recepcion_de_pedido") {
      // Para recepción, enviar todos los items temporales
      if (itemsTemporales.length === 0) {
        showError("Debe agregar al menos un ítem antes de guardar");
        return;
      }

      let todosExitosos = true;
      for (const item of itemsTemporales) {
        try {
          console.log("Enviando item:", item);
          await createMovimiento(item);
        } catch (err) {
          console.error("Error al registrar item:", err);
          showError(
            `Error al registrar ${item.producto_nombre}: ${err.message}`
          );
          todosExitosos = false;
          break;
        }
      }

      if (todosExitosos) {
        showSuccess(
          `Se registraron ${itemsTemporales.length} items exitosamente`
        );
        itemsTemporales = [];
        setTimeout(() => {
          document
            .querySelector('[id="modalInner"]')
            ?.closest(".fixed")
            ?.querySelector("button")
            ?.click();
        }, 1500);
      }
    } else {
      // Para otros tipos, usar la lógica normal
      const success = await handleSubmit();
      if (success) {
        setTimeout(() => {
          document
            .querySelector('[id="modalInner"]')
            ?.closest(".fixed")
            ?.querySelector("button")
            ?.click();
        }, 1500);
      }
    }
  });

  document.getElementById("mov_cancel").addEventListener("click", () => {
    document
      .querySelector('[id="modalInner"]')
      ?.closest(".fixed")
      ?.querySelector("button")
      ?.click();
  });

  document.getElementById("mov_close_small")?.addEventListener("click", () => {
    document
      .querySelector('[id="modalInner"]')
      ?.closest(".fixed")
      ?.querySelector("button")
      ?.click();
  });

  btnAgregarOtro.addEventListener("click", () => {
    console.log("Click en Agregar otro ítem");
    const tipo = selectTipo.value;

    if (tipo !== "recepcion_de_pedido") {
      showError(
        'La opción "Agregar otro ítem" solo está disponible para recepción de pedido'
      );
      return;
    }

    const pedidoId = document.getElementById("mov_pedido").value;
    const productoId = selectDetalle.value;
    const cantidadRecibida = parseFloat(
      document.getElementById("mov_cantidad_recibida").value
    );
    const option = selectDetalle.options[selectDetalle.selectedIndex];
    const productoNombre = option.dataset.nombre || option.text.split(" (")[0];

    if (!pedidoId) {
      showError("Debe seleccionar un pedido");
      return;
    }
    if (!productoId) {
      showError("Debe seleccionar un ítem del pedido");
      return;
    }
    if (!cantidadRecibida || cantidadRecibida <= 0) {
      showError("La cantidad recibida debe ser mayor que 0");
      return;
    }

    const fechaFabricacion = document.getElementById(
      "mov_fecha_fabricacion"
    ).value;
    const fechaVencimiento = document.getElementById(
      "mov_fecha_vencimiento"
    ).value;

    if (
      fechaFabricacion &&
      fechaVencimiento &&
      new Date(fechaVencimiento) < new Date(fechaFabricacion)
    ) {
      showError(
        "La fecha de vencimiento no puede ser anterior a la fecha de fabricación"
      );
      return;
    }

    const itemData = {
      tipo_movimiento: tipo,
      producto_id: parseInt(productoId),
      cantidad: cantidadRecibida,
      pedido_id: parseInt(pedidoId),
      nota: document.getElementById("mov_nota_pedido").value || "",
      fecha_fabricacion: fechaFabricacion || null,
      fecha_vencimiento: fechaVencimiento || null,
      lote_codigo: document.getElementById("mov_lote_codigo").value || "",
      producto_nombre: productoNombre,
    };

    itemsTemporales.push(itemData);
    console.log("Items temporales:", itemsTemporales);

    const tbody = document.getElementById("mov_recepciones_tbody");
    const container = document.getElementById("mov_recepciones_container");

    tbody.innerHTML = itemsTemporales
      .map(
        (item, index) => `
      <tr class="bg-blue-50 hover:bg-blue-100 transition-colors">
        <td class="px-4 py-3 text-sm text-gray-900">${item.producto_nombre}</td>
        <td class="px-4 py-3 text-sm font-semibold text-gray-900">${
          item.cantidad
        }</td>
        <td class="px-4 py-3 text-sm text-gray-700">${
          item.lote_codigo || "Autogenerado"
        }</td>
        <td class="px-4 py-3 text-sm text-gray-700">Hoy</td>
        <td class="px-4 py-3 text-sm text-gray-700">${
          currentUser?.nombre || "Usuario Actual"
        }</td>
        <td class="px-4 py-3">
          <button type="button" onclick="window.eliminarItemTemporal(${index})" 
                  class="text-red-600 hover:text-red-800 text-sm font-medium">
            Eliminar
          </button>
        </td>
      </tr>
    `
      )
      .join("");
    container.classList.remove("hidden");

    selectDetalle.value = "";
    document.getElementById("mov_detalle_producto").value = "";
    document.getElementById("mov_detalle_solicitado").value = "";
    document.getElementById("mov_cantidad_recibida").value = "";
    document.getElementById("mov_lote_codigo").value = "";
    document.getElementById("mov_fecha_fabricacion").value = "";
    document.getElementById("mov_fecha_vencimiento").value = "";
    document.getElementById("mov_nota_pedido").value = "";
    document.getElementById("mov_msg_error").classList.add("hidden");

    showSuccess(
      `Ítem agregado (${itemsTemporales.length} items en total). Click "Guardar" para registrar.`
    );
  });

  window.eliminarItemTemporal = function (index) {
    itemsTemporales.splice(index, 1);
    const tbody = document.getElementById("mov_recepciones_tbody");
    const container = document.getElementById("mov_recepciones_container");

    if (itemsTemporales.length > 0) {
      tbody.innerHTML = itemsTemporales
        .map(
          (item, i) => `
        <tr class="bg-blue-50 hover:bg-blue-100 transition-colors">
          <td class="px-4 py-3 text-sm text-gray-900">${
            item.producto_nombre
          }</td>
          <td class="px-4 py-3 text-sm font-semibold text-gray-900">${
            item.cantidad
          }</td>
          <td class="px-4 py-3 text-sm text-gray-700">${
            item.lote_codigo || "Autogenerado"
          }</td>
          <td class="px-4 py-3 text-sm text-gray-700">Hoy</td>
          <td class="px-4 py-3 text-sm text-gray-700">${
            currentUser?.nombre || "Usuario Actual"
          }</td>
          <td class="px-4 py-3">
            <button type="button" onclick="window.eliminarItemTemporal(${i})" 
                    class="text-red-600 hover:text-red-800 text-sm font-medium">
              Eliminar
            </button>
          </td>
        </tr>
      `
        )
        .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="6" class="px-4 py-4 text-center text-sm text-gray-500">No hay items agregados</td></tr>';
    }
  };

  console.log("Modal de movimiento inicializado correctamente");
}
