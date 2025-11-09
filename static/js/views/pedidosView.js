// static/js/views/pedidosView.js
(() => {
  const { createApp } = Vue;

  const app = createApp({
    delimiters: ['[[', ']]'],
    data() {
      return {
        pedidos: [],
        query: '',
        isModalOpen: false,
        modalContent: '',
        loadingModal: false,
        modalTitle: '',
        modalUrls: {}
      };
    },
    computed: {
      filteredPedidos() {
        if (!this.query) return this.pedidos;
        const q = this.query.toLowerCase();
        return this.pedidos.filter(p =>
          (p.codigo && p.codigo.toLowerCase().includes(q)) ||
          (p.proveedor_nombre && p.proveedor_nombre.toLowerCase().includes(q))
        );
      }
    },
    async mounted() {
      const root = document.getElementById('pedidosApp');
      try {
        this.modalUrls = JSON.parse(root.getAttribute('data-modal-urls') || '{}');
      } catch (e) {
        this.modalUrls = {};
      }
      await this.loadPedidos();
    },
    methods: {
      async loadPedidos() {
        try {
          if (window.pedidosService && typeof window.pedidosService.list === 'function') {
            this.pedidos = await window.pedidosService.list();
          } else {
            this.pedidos = [
              { id: 1, codigo: '001', proveedor_nombre: 'Proveedor A', fecha: '2025-11-01', cantidad: 5, total: 120.00, estado: 'pendiente' },
              { id: 2, codigo: '002', proveedor_nombre: 'Proveedor B', fecha: '2025-11-03', cantidad: 2, total: 50.00, estado: 'entregado' }
            ];
          }
        } catch (e) {
          console.error('Error cargando pedidos', e);
          this.pedidos = [];
        }
      },

      async openModal(name, id = null) {
        try {
          const root = document.getElementById('pedidosApp');
          const urls = JSON.parse(root.getAttribute('data-modal-urls') || '{}');
          if (!urls || !urls[name]) {
            console.error('modal URL no encontrada para', name);
            this.modalContent = `<div class="p-4 text-center text-red-600">Modal URL no configurada para ${name}</div>`;
            this.isModalOpen = true;
            return;
          }

          let url = urls[name];
          if (id) url += (url.includes('?') ? '&' : '?') + 'id=' + encodeURIComponent(id);

          this.loadingModal = true;
          this.isModalOpen = true;
          this.modalTitle = (name === 'crear_editar_pedido' ? (id ? 'Editar Pedido' : 'Crear Pedido') : 'Modal');
          this.modalContent = '';

          const resp = await fetch(url, { credentials: 'same-origin' });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const html = await resp.text();
          this.modalContent = html;
          this.loadingModal = false;

          // inicializador: esperar a que v-html haya insertado el HTML
          this.$nextTick(() => {
            // ref modalRoot en tu template (v-html div debe tener ref="modalRoot")
            const modalRoot = this.$refs.modalRoot;
            // si no hay ref, buscar el fragment inyectado
            let container = null;
            if (modalRoot) {
              // buscar el partial dentro del nodo ref
              container = modalRoot.querySelector('[data-modal-type]') || modalRoot.firstElementChild || modalRoot;
            } else {
              container = document.querySelector('[data-modal-type]') || document.querySelector('.bg-white.rounded-lg .p-4');
            }

            if (!container) {
              console.warn('initCrearEditarPedido: no se encontró contenedor tras v-html');
              return;
            }

            // determinar id preferentemente desde data attribute
            let parsedId = id;
            const dataAttrEl = container.querySelector('[data-pedido-id]') || container;
            if (dataAttrEl && dataAttrEl.dataset && dataAttrEl.dataset.pedidoId) {
              parsedId = parsedId || dataAttrEl.dataset.pedidoId || null;
            } else {
              // fallback: extraer id del querystring del url
              try {
                const u = new URL(url, window.location.origin);
                parsedId = parsedId || u.searchParams.get('id') || null;
              } catch (e) {}
            }

            if (window.initCrearEditarPedido && typeof window.initCrearEditarPedido === 'function') {
              window.initCrearEditarPedido(container, { pedidoId: parsedId, vueApp: this });
            } else {
              console.debug('initCrearEditarPedido no encontrado');
            }
          });

        } catch (e) {
          console.error('Error cargando modal:', e);
          this.modalContent = `<div class="p-4 text-center text-red-600">Error cargando contenido: ${e.message}</div>`;
          this.loadingModal = false;
          this.isModalOpen = true;
        }
      },

      closeModal() {
        this.isModalOpen = false;
        this.modalContent = '';
      }
    }
  });

  app.mixin({
    mounted() {
      // placeholder para $refs
    }
  });

  app.mount('#pedidosApp');
})();
