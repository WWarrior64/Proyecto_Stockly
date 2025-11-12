import { fetchProducts, fetchProduct, updateProduct, deleteProduct, fetchCategorias } from '/static/js/services/productService.js';

const { createApp } = Vue;

const DEFAULT_MODAL_URLS = {
  'productos': '/inventario/ce_productos.html',
  'asignar_proveedores': '/inventario/ap_productos.html',
  'registrar_movimiento': '/inventario/registrar_movimiento.html',
  // si quieres un endpoint con id por defecto:
  'producto_detalle': '/inventario/ce_productos.html?id='
};

const app = createApp({
  data() {
    return {
      query: '',
      products: [],
      filteredProducts: [],
      isModalOpen: false,
      modalTitle: '',
      modalContent: '',
      loadingModal: false,
      modalUrls: {},
    };
  },
  mounted() {
    try {
      this.modalUrls = Object.assign({}, DEFAULT_MODAL_URLS, this.modalUrls);
    } catch (err) {
      console.error('Error parseando data-modal-urls', err);
      this.modalUrls = {};
    }
    this.loadProducts();
  },
  methods: {
    async loadProducts() {
      console.log('Llamando fetchProducts...');
      try {
        const prods = await fetchProducts();
        console.log('fetchProducts result:', prods);
        this.products = prods || [];
        this.filteredProducts = this.products;
      } catch (err) {
        console.error('Error en loadProducts:', err);
        this.products = [];
        this.filteredProducts = [];
      }
    },
    applyFilter() {
      this.filteredProducts = this.products.filter(p =>
        p.name.toLowerCase().includes(this.query.toLowerCase())
      );
    },
    formatCurrency(val) {
      try {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
      } catch {
        return val;
      }
    },
    async toggleAvailable(product) {
      const estado = product.available ? 'activo' : 'inactivo';
      try { await updateProduct(product.id, { estado }); }
      catch (err) { console.error(err); }
    },
    async confirmDelete(product) {
      if (!confirm('¿Seguro que desea eliminar este producto?')) return;
      try { await deleteProduct(product.id); await this.loadProducts(); }
      catch (err) { console.error(err); alert('Error al eliminar (ver consola).'); }
    },
    getModalTitle(type, id) {
      if (type === 'productos') return id ? 'Editar Producto' : 'Nuevo Producto';
      if (type === 'asignar_proveedores') return 'Asignar Proveedores';
      if (type === 'registrar_movimiento') return 'Registrar Movimiento';
      return '';
    },
    openModal(type, id = null) {
      console.log('openModal', { type, id, modalUrls: this.modalUrls });
      let url = this.modalUrls ? this.modalUrls[type] : undefined;
      if (!url) { console.error('Modal URL not found for', type); alert('Error: modal URL no encontrada'); return; }

      // si hay id lo añadimos como query param (?id=)
      if (id !== null && id !== undefined && String(id).length > 0) {
        url += (url.includes('?') ? '&' : '?') + 'id=' + encodeURIComponent(id);
      }

      this.modalTitle = this.getModalTitle(type, id);
      this.loadingModal = true;
      this.isModalOpen = true;

      fetch(url)
        .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text(); })
        .then(html => {
          this.modalContent = html;
          this.loadingModal = false;
          this.$nextTick(async () => {
            try {
              if (type === 'productos') {
                const { initProductosModal } = await import('/static/js/views/ceProductos.js');
                await initProductosModal(id);
              }
              if (type === 'asignar_proveedores') {
                const { initAsignarModal } = await import('/static/js/views/apProductos.js');
                await initAsignarModal(id);
              }
              if (type === 'registrar_movimiento') {
                const { initMovimientoModal } = await import('/static/js/views/registrarMovimiento.js');
                await initMovimientoModal(id);
              }
            } catch (err) {
              console.error('Error al inicializar modal', err);
              alert('Error al cargar el modal: ' + err.message);
            }
          });
        })
        .catch(err => {
          console.error('Error al cargar modal', err);
          this.loadingModal = false;
          this.isModalOpen = false;
          alert('No se pudo abrir el modal (ver consola).');
        });
    },
    closeModal() {
      this.isModalOpen = false;
      this.modalContent = '';
      this.loadProducts();
    }
  }
});

app.mount('#inventarioApp');
