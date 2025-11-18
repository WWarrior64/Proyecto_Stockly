import {
  fetchProducts,
  fetchProduct,
  updateProduct,
  deleteProduct,
  fetchCategorias,
} from "/static/js/services/productService.js";

const { createApp } = Vue;

const DEFAULT_MODAL_URLS = {
  productos: "/inventario/ce_productos.html",
  asignar_proveedores: "/inventario/ap_productos.html",
  registrar_movimiento: "/inventario/registrar_movimiento.html",
  // si quieres un endpoint con id por defecto:
  producto_detalle: "/inventario/ce_productos.html?id=",
};

const app = createApp({
  data() {
    return {
      searchQuery: "",
      products: [],
      filteredProducts: [],
      categories: [],
      filterCategory: "",
      filterAvailability: "",
      filterStock: "",
      showSettings: false,
      isModalOpen: false,
      modalTitle: "",
      modalContent: "",
      loadingModal: false,
      modalUrls: {},
    };
  },
  mounted() {
    try {
      this.modalUrls = Object.assign({}, DEFAULT_MODAL_URLS, this.modalUrls);
    } catch (err) {
      console.error("Error parseando data-modal-urls", err);
      this.modalUrls = {};
    }
    this.loadProducts();
    this.loadCategories();
  },
  methods: {
    async loadProducts() {
      console.log("Llamando fetchProducts...");
      try {
        const prods = await fetchProducts();
        console.log("fetchProducts result:", prods);
        this.products = prods || [];
        this.applyFilters();
      } catch (err) {
        console.error("Error en loadProducts:", err);
        this.products = [];
        this.filteredProducts = [];
      }
    },
    async loadCategories() {
      try {
        const cats = await fetchCategorias();
        this.categories = cats || [];
      } catch (err) {
        console.error("Error cargando categorías:", err);
        this.categories = [];
      }
    },
    applyFilters() {
      let filtered = [...this.products];

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.category_name && p.category_name.toLowerCase().includes(query))
        );
      }

      if (this.filterCategory) {
        filtered = filtered.filter(
          (p) =>
            p.category_name ===
            this.categories.find((c) => c.id == this.filterCategory)?.nombre
        );
      }

      if (this.filterAvailability === "available") {
        filtered = filtered.filter((p) => p.available === true);
      } else if (this.filterAvailability === "unavailable") {
        filtered = filtered.filter((p) => p.available === false);
      }

      if (this.filterStock === "low") {
        filtered = filtered.filter((p) => p.stock <= 10);
      } else if (this.filterStock === "medium") {
        filtered = filtered.filter((p) => p.stock > 10 && p.stock <= 50);
      } else if (this.filterStock === "high") {
        filtered = filtered.filter((p) => p.stock > 50);
      }

      this.filteredProducts = filtered;
    },
    clearFilters() {
      this.searchQuery = "";
      this.filterCategory = "";
      this.filterAvailability = "";
      this.filterStock = "";
      this.applyFilters();
    },
    toggleSettings() {
      this.showSettings = !this.showSettings;
    },
    formatCurrency(val) {
      try {
        return new Intl.NumberFormat("es-CL", {
          style: "currency",
          currency: "CLP",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val);
      } catch {
        return val;
      }
    },
    async toggleAvailable(product) {
      const estado = product.available ? "activo" : "inactivo";
      try {
        await updateProduct(product.id, { estado });
      } catch (err) {
        console.error(err);
      }
    },
    async confirmDelete(product) {
      if (!confirm("¿Seguro que desea eliminar este producto?")) return;
      try {
        await deleteProduct(product.id);
        await this.loadProducts();
      } catch (err) {
        console.error(err);
        alert("Error al eliminar (ver consola).");
      }
    },
    getModalTitle(type, id) {
      if (type === "productos")
        return id ? "Editar Producto" : "Nuevo Producto";
      if (type === "asignar_proveedores") return "Asignar Proveedores";
      if (type === "registrar_movimiento") return "Registrar Movimiento";
      return "";
    },
    openModal(type, id = null) {
      console.log("openModal", { type, id, modalUrls: this.modalUrls });
      let url = this.modalUrls ? this.modalUrls[type] : undefined;
      if (!url) {
        console.error("Modal URL not found for", type);
        alert("Error: modal URL no encontrada");
        return;
      }

      // si hay id lo añadimos como query param (?id=)
      if (id !== null && id !== undefined && String(id).length > 0) {
        url += (url.includes("?") ? "&" : "?") + "id=" + encodeURIComponent(id);
      }

      this.modalTitle = this.getModalTitle(type, id);
      this.loadingModal = true;
      this.isModalOpen = true;

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((html) => {
          this.modalContent = html;
          this.loadingModal = false;
          this.$nextTick(async () => {
            try {
              if (type === "productos") {
                const { initProductosModal } = await import(
                  "/static/js/views/ceProductos.js"
                );
                await initProductosModal(id);
              }
              if (type === "asignar_proveedores") {
                const { initAsignarModal } = await import(
                  "/static/js/views/apProductos.js"
                );
                await initAsignarModal(id);
              }
              if (type === "registrar_movimiento") {
                const { initMovimientoModal } = await import(
                  "/static/js/views/registrarMovimiento.js"
                );
                await initMovimientoModal(id);
              }
            } catch (err) {
              console.error("Error al inicializar modal", err);
              alert("Error al cargar el modal: " + err.message);
            }
          });
        })
        .catch((err) => {
          console.error("Error al cargar modal", err);
          this.loadingModal = false;
          this.isModalOpen = false;
          alert("No se pudo abrir el modal (ver consola).");
        });
    },
    closeModal() {
      this.isModalOpen = false;
      this.modalContent = "";
      this.loadProducts();
    },
  },
});

const mountedApp = app.mount("#inventarioApp");
window.vueAppInstance = mountedApp;
