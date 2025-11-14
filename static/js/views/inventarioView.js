<<<<<<< HEAD
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
=======
// static/js/views/inventarioView.js
(function () {
  function init() {
    const el = document.getElementById('inventarioApp');
    if (!el) return console.warn('No se encontró #inventarioApp');

    const modalUrlsAttr = el.getAttribute('data-modal-urls') || '{}';
    let modalUrls = {};
    try { modalUrls = JSON.parse(modalUrlsAttr); } catch (e) { console.error(e); }

    const app = Vue.createApp({
      data() {
        return {
          products: [],
          query: '',
          isModalOpen: false,
          modalContent: '',
          modalTitle: '',
          loadingModal: false
        };
      },
      computed: {
        filteredProducts() {
          const q = this.query && this.query.toLowerCase();
          if (!q) return this.products;
          return this.products.filter(p => {
            return (String(p.name || '').toLowerCase().includes(q)) ||
                   (String(p.category_name || '').toLowerCase().includes(q));
          });
        }
      },
      methods: {
        formatCurrency(value) {
          if (value == null || value === '') return '';
          const n = Number(value);
          if (Number.isNaN(n)) return value;
          return '$' + n.toFixed(2);
        },
        async loadProducts() {
          try {
            const resp = await fetch('/inventario/api/productos');
            if (!resp.ok) throw new Error('No se pudo cargar productos');
            this.products = await resp.json();
          } catch (err) {
            console.error(err);
            this.products = [
              { id: 1, name: 'Producto demo', category_name: 'Categoría', stock: 10, price: 15.5, available: true, image: '/static/images/Producto.png' }
            ];
          }
        },

        // abrir modal: fetch sanitized html, inyectar, esperar nextTick y llamar initModal
        async openModal(name, id = null) {
          const base = modalUrls[name] || modalUrls['producto_detalle'] || null;
          if (!base) { console.error('No URL para modal', name); return; }
          let url = base;
          if (id !== null) {
            url = base.endsWith('=') ? base + encodeURIComponent(id) : (base.includes('?') ? `${base}&id=${encodeURIComponent(id)}` : `${base}?id=${encodeURIComponent(id)}`);
          }

          this.loadingModal = true;
          this.modalContent = '';
          this.modalTitle = (name === 'productos' ? (id ? 'Editar Producto' : 'Agregar Producto') : (name === 'asignar_proveedores' ? 'Asignar Proveedores' : 'Registrar Movimiento'));

          try {
            const html = await window.inventarioService.fetchSanitizedModalHtml(url);
            this.modalContent = html;
            this.isModalOpen = true;

            // esperar que Vue haya inyectado el HTML
            await this.$nextTick();

            // buscar el container inyectado con attribute data-modal-type
            const modalRoot = document.querySelector('[data-modal-type]');
            if (modalRoot && window.modalControllers && typeof window.modalControllers.initModal === 'function') {
              // pasar referencia a la instancia Vue para que los controllers puedan llamar loadProducts/closeModal
              window.modalControllers.initModal(modalRoot, { productId: id, vueApp: this });
            }
          } catch (err) {
            console.error(err);
            this.modalContent = `<div class="p-4 text-red-600">Error cargando contenido: ${err.message}</div>`;
            this.isModalOpen = true;
          } finally {
            this.loadingModal = false;
          }
        },

        closeModal() {
          this.isModalOpen = false;
          this.modalContent = '';
          this.modalTitle = '';
          this.loadingModal = false;
        }
      },
      mounted() { this.loadProducts(); }
    });

    const vm = app.mount('#inventarioApp');
    // Exponer la instancia para que modal controllers puedan llamarla
    window.inventarioApp = vm;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
>>>>>>> origin/main
