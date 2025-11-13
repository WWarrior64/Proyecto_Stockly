(() => {
  const { createApp } = Vue;

  const app = createApp({
    data() {
      return {
        pedidos: [],
        proveedores: [],

        query: '',
        isModalOpen: false,
        modalContent: '',
        loadingModal: false,
        modalTitle: '',
        modalUrls: {},

        // UI
        showSettings: false,
        showFilters: false,

        // filtros
        filters: {
          estado: '',
          proveedor_nombre: '',
          fecha_from: '',
          fecha_to: '',
          min_total: null,
          max_total: null
        }
      };
    },
    computed: {
      filteredPedidos() {
        // start with shallow copy
        let list = Array.isArray(this.pedidos) ? this.pedidos.slice() : [];

        // search query (buscar en varios campos)
        const q = String(this.query || '').trim().toLowerCase();
        if (q) {
          list = list.filter(p => {
            const codigo = String(p.codigo || '').toLowerCase();
            const proveedor = String(p.proveedor_nombre || '').toLowerCase();
            const fecha = String(p.fecha || '').toLowerCase();
            const estado = String(p.estado || '').toLowerCase();
            const totalStr = String(p.total != null ? p.total : '').toLowerCase();
            return codigo.includes(q) || proveedor.includes(q) || fecha.includes(q) || estado.includes(q) || totalStr.includes(q);
          });
        }

        // filtro: estado
        if (this.filters.estado) {
          const f = this.filters.estado.toLowerCase();
          list = list.filter(p => String(p.estado || '').toLowerCase() === f);
        }

        // filtro: proveedor por nombre (comparamos nombres)
        if (this.filters.proveedor_nombre) {
          const prov = String(this.filters.proveedor_nombre).toLowerCase();
          list = list.filter(p => String(p.proveedor_nombre || '').toLowerCase() === prov);
        }

        // filtro: rango de fechas (si p.fecha es ISO)
        if (this.filters.fecha_from) {
          const from = new Date(this.filters.fecha_from);
          if (!isNaN(from)) {
            list = list.filter(p => {
              if (!p.fecha) return false;
              const d = new Date(p.fecha);
              return !isNaN(d) && d >= from;
            });
          }
        }
        if (this.filters.fecha_to) {
          // incluir todo el día seleccionado (poner 23:59:59)
          const toDate = new Date(this.filters.fecha_to);
          if (!isNaN(toDate)) {
            toDate.setHours(23,59,59,999);
            list = list.filter(p => {
              if (!p.fecha) return false;
              const d = new Date(p.fecha);
              return !isNaN(d) && d <= toDate;
            });
          }
        }

        // filtro: min/max total (asegurar comparaciones numéricas)
        if (this.filters.min_total != null && this.filters.min_total !== '') {
          const min = Number(this.filters.min_total) || 0;
          list = list.filter(p => Number(p.total) >= min);
        }
        if (this.filters.max_total != null && this.filters.max_total !== '') {
          const max = Number(this.filters.max_total) || 0;
          list = list.filter(p => Number(p.total) <= max);
        }

        return list;
      }
    },
    async mounted() {
      const root = document.getElementById('pedidosApp');
      try {
        this.modalUrls = JSON.parse(root.getAttribute('data-modal-urls') || '{}');
      } catch (e) {
        this.modalUrls = {};
      }
      await Promise.all([ this.loadProveedores(), this.loadPedidos() ]);
    },
    methods: {
      formatCurrency(value) {
        const n = Number(value);
        if (!isFinite(n)) return '0.00';
        return n.toFixed(2);
      },

      formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
          const date = new Date(dateStr);
          if (isNaN(date)) return '—';
          return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          return '—';
        }
      },

      async loadProveedores() {
        try {
          const provs = await window.pedidosService.listProveedores();
          // esperar que el endpoint devuelva array {id,nombre}
          this.proveedores = Array.isArray(provs) ? provs : [];
        } catch (e) {
          console.error('Error cargando proveedores', e);
          this.proveedores = [];
        }
      },

      async loadPedidos() {
        try {
          const resp = await fetch('/pedidos/api/list', { credentials: 'same-origin' });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const contentType = resp.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            const txt = await resp.text();
            console.error('Respuesta no JSON en /pedidos/api/list:', txt.slice(0, 1000));
            throw new Error('Respuesta no JSON (posible redirección a login).');
          }
          // convertimos total a number inmediatamente para evitar errores en render
          const raw = await resp.json();
          this.pedidos = Array.isArray(raw)
            ? raw.map(p => ({ ...p, total: Number(p.total) || 0 }))
            : [];
          console.log('Pedidos cargados:', this.pedidos);
        } catch (e) {
          console.error('Error cargando pedidos', e);
          this.pedidos = [];
        }
      },

      // abrir modal (mantengo tu lógica)
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

          this.$nextTick(() => {
            let container = this.$refs.modalRoot ? this.$refs.modalRoot.querySelector('[data-modal-type]') || this.$refs.modalRoot.firstElementChild || this.$refs.modalRoot : document.querySelector('[data-modal-type]');

            if (!container) {
              console.warn('initCrearEditarPedido: no se encontró contenedor tras v-html');
              return;
            }

            let parsedId = id;
            const dataAttrEl = container.querySelector('[data-pedido-id]') || container;
            if (dataAttrEl && dataAttrEl.dataset && dataAttrEl.dataset.pedidoId) {
              parsedId = parsedId || dataAttrEl.dataset.pedidoId || null;
            } else {
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
      },

      toggleSettings() {
        this.showSettings = !this.showSettings;
      },

      toggleFilters() {
        this.showFilters = !this.showFilters;
      },

      applyFilters() {
        // la computada filteredPedidos aplicará los filtros automáticamente,
        // esta función sirve para poder cerrar/abrir o disparar acciones extra si se quiere
        // aquí solo forzamos una re-evaluación rápida dejando Vue reaccionar.
        // (no hace falta nada si usamos v-model y computed)
        // si quieres, podemos cerrar el panel:
        this.showFilters = true;
      },

      clearFilters() {
        this.filters = {
          estado: '',
          proveedor_nombre: '',
          fecha_from: '',
          fecha_to: '',
          min_total: null,
          max_total: null
        };
      }
    }
  });

  app.mount('#pedidosApp');
})();
