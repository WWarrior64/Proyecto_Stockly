// static/js/views/proveedores.js
import { proveedoresService } from '/static/js/services/proveedoresService.js';

const { createApp } = Vue;

try {
  const app = createApp({
    delimiters: ['[[', ']]'],
    data() {
      return {
        providers: [],
        showProviderModal: false,
        editingProvider: null,
        providerForm: { proveedor_id: null, proveedor_codigo: '', proveedor_nombre: '', numerotelefono: '', email: '', direccion: '' },
        loading: false,
        error: null
      };
    },
    async created() {
      try {
        this.loading = true;
        this.providers = await proveedoresService.list();
      } catch (e) {
        console.error('Error cargando proveedores', e);
        this.error = e.message || 'Error';
      } finally {
        this.loading = false;
      }
    },
    methods: {
      openProviderModal(prov = null) {
        this.editingProvider = prov ? Object.assign({}, prov) : null;
        this.providerForm = prov ? Object.assign({}, prov) : { proveedor_id: null, proveedor_codigo: '', proveedor_nombre: '', numerotelefono: '', email: '', direccion: '' };
        this.showProviderModal = true;
        this.$nextTick(() => {
          const el = document.getElementById('prov-codigo');
          if (el) el.focus();
        });
      },
      closeProviderModal() {
        this.showProviderModal = false;
        this.editingProvider = null;
        this.providerForm = { proveedor_id: null, proveedor_codigo: '', proveedor_nombre: '', numerotelefono: '', email: '', direccion: '' };
      },
      async saveProvider() {
        if (!this.providerForm.proveedor_codigo || !this.providerForm.proveedor_nombre) { alert('Código y nombre requeridos'); return; }
        try {
          if (this.editingProvider && this.editingProvider.proveedor_id) {
            await proveedoresService.update(this.editingProvider.proveedor_id, this.providerForm);
          } else {
            await proveedoresService.create(this.providerForm);
          }
          // refrescar
          this.providers = await proveedoresService.list();
          this.closeProviderModal();
        } catch (e) {
          console.error('Error guardando proveedor', e);
          alert(e.message || 'Error guardando proveedor');
        }
      },
      async removeProvider(id) {
        if (!confirm('Eliminar proveedor?')) return;
        try {
          await proveedoresService.delete(id);
          this.providers = await proveedoresService.list();
        } catch (e) {
          console.error('Error eliminando proveedor', e);
          alert(e.message || 'Error eliminando proveedor');
        }
      }
    }
  });

  app.mount('#vm-proveedores');
} catch (err) {
  console.error('Error inicializando proveedores.js:', err);
}