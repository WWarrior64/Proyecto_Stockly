// static/js/views/proveedores.js
import { proveedoresService } from '/static/js/services/proveedoresService.js';

const app = Vue.createApp({
  delimiters: ['[[', ']]'],
  data() {
    return {
      providers: [],
      showProviderModal: false,
      editingProvider: null,
      providerForm: { proveedor_id: null, proveedor_codigo: '', proveedor_nombre: '', numerotelefono: '', email: '', direccion: '' }
    };
  },
  async created() {
    await this.loadProviders();
  },
  methods: {
    async loadProviders() {
      try {
        this.providers = (await proveedoresService.list()) || [];
      } catch (e) {
        console.error('Error cargando proveedores:', e);
        this.providers = [];
      }
    },
    openProviderModal(p) {
      this.editingProvider = p ? { ...p } : null;
      this.providerForm = this.editingProvider ? { ...this.editingProvider } : { proveedor_id: null, proveedor_codigo:'', proveedor_nombre:'', numerotelefono:'', email:'', direccion:'' };
      this.showProviderModal = true;
    },
    closeProviderModal() {
      this.showProviderModal = false;
      this.editingProvider = null;
      this.providerForm = { proveedor_id: null, proveedor_codigo:'', proveedor_nombre:'', numerotelefono:'', email:'', direccion:'' };
    },
    async saveProvider() {
      if (!this.providerForm.proveedor_codigo || !this.providerForm.proveedor_nombre) {
        return alert('Código y nombre obligatorios');
      }
      try {
        if (this.editingProvider && this.editingProvider.proveedor_id) {
          await proveedoresService.update(this.editingProvider.proveedor_id, this.providerForm);
        } else {
          await proveedoresService.create(this.providerForm);
        }
        await this.loadProviders();
        this.closeProviderModal();
      } catch (e) {
        console.error('Error guardando proveedor:', e);
        alert('Error al guardar proveedor');
      }
    },
    async removeProvider(id) {
      if (!confirm('¿Eliminar proveedor?')) return;
      try {
        await proveedoresService.delete(id);
        await this.loadProviders();
      } catch (e) {
        console.error('Error eliminando proveedor:', e);
        alert('No se pudo eliminar el proveedor');
      }
    }
  }
});

app.mount('#vm-proveedores');