import {
  fetchCategorias,
  fetchProduct,
  createProduct,
  updateProduct,
} from "/static/js/services/productService.js";

function generateSKU() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `SKU-${timestamp}-${random}`.toUpperCase();
}

export async function initProductosModal(id) {
  const categorias = await fetchCategorias();
  const selectCategoria = document.getElementById("prod_categoria");
  selectCategoria.innerHTML =
    '<option value="">Seleccione</option>' +
    categorias
      .map((c) => `<option value="${c.id}">${c.nombre}</option>`)
      .join("");

  if (id) {
    const product = await fetchProduct(id);
    document.getElementById("prod_sku").value = product.sku || "";
    document.getElementById("prod_nombre").value = product.nombre || "";
    document.getElementById("prod_precio").value = product.precio || "";
    document.getElementById("prod_estado").value = product.estado || "";
    document.getElementById("prod_categoria").value =
      product.categoria_id || "";
    document.getElementById("prod_descripcion").value =
      product.descripcion || "";
  }

  const form = document.getElementById("productForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    let sku = document.getElementById("prod_sku").value.trim();

    if (!sku && !id) {
      sku = generateSKU();
      document.getElementById("prod_sku").value = sku;
      console.log("SKU autogenerado:", sku);
    }

    const data = {
      sku: sku || null,
      nombre: document.getElementById("prod_nombre").value,
      precio: parseFloat(document.getElementById("prod_precio").value) || null,
      estado: document.getElementById("prod_estado").value || null,
      categoria_id:
        parseInt(document.getElementById("prod_categoria").value) || null,
      descripcion: document.getElementById("prod_descripcion").value,
    };

    try {
      if (id) {
        await updateProduct(id, data);
        console.log("Producto actualizado exitosamente");
      } else {
        await createProduct(data);
        console.log("Producto creado exitosamente");
      }

      const closeButton = document
        .querySelector('[id="modalInner"]')
        ?.closest(".fixed")
        ?.querySelector("button");
      if (closeButton) {
        closeButton.click();
      }

      if (
        window.vueAppInstance &&
        typeof window.vueAppInstance.loadProducts === "function"
      ) {
        setTimeout(() => {
          window.vueAppInstance.loadProducts();
        }, 100);
      }
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert("Error al guardar producto: " + error.message);
    }
  });

  document.getElementById("prod_cancel").addEventListener("click", () => {
    document
      .querySelector('[id="modalInner"]')
      ?.closest(".fixed")
      ?.querySelector("button")
      ?.click();
  });
}
