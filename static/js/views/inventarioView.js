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
