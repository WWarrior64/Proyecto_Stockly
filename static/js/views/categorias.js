// static/js/views/categorias.js
// (El código proporcionado ya está completo y compatible con el service real; no requiere cambios adicionales ya que maneja el fallback automáticamente. Si quieres remover el mock fallback para forzar el uso del API, puedes editar el created así:)
import { categoriasService } from '/static/js/services/categoriasService.js';

const { createApp } = Vue;

try {
  const app = createApp({
    delimiters: ['[[', ']]'],
    data() {
      return {
        categories: [],
        showCategoryModal: false,
        editingCategory: null,
        categoryForm: { id: null, nombre: '', descripcion: '' },
        loading: false,
        error: null
      };
    },
    async created() {
      try {
        this.loading = true;
        this.categories = await categoriasService.list();
      } catch (e) {
        console.error('Error cargando categorías', e);
        this.error = e.message || 'Error';
      } finally {
        this.loading = false;
      }
    },
    methods: {
      openCategoryModal(cat = null) {
        this.editingCategory = cat ? Object.assign({}, cat) : null;
        this.categoryForm = cat ? Object.assign({}, cat) : { id: null, nombre: '', descripcion: '' };
        this.showCategoryModal = true;
        this.$nextTick(() => {
          const el = document.getElementById('cat-name');
          if (el) el.focus();
        });
      },
      closeCategoryModal() {
        this.showCategoryModal = false;
        this.editingCategory = null;
        this.categoryForm = { id: null, nombre: '', descripcion: '' };
      },
      async saveCategory() {
        if (!this.categoryForm.nombre) { alert('Nombre requerido'); return; }
        try {
          if (this.editingCategory && this.editingCategory.id) {
            await categoriasService.update(this.editingCategory.id, this.categoryForm);
          } else {
            await categoriasService.create(this.categoryForm);
          }
          // refrescar
          this.categories = await categoriasService.list();
          this.closeCategoryModal();
        } catch (e) {
          console.error('Error guardando categoría', e);
          alert(e.message || 'Error guardando categoría');
        }
      },
      async removeCategory(id) {
        if (!confirm('Eliminar categoría?')) return;
        try {
          await categoriasService.delete(id);
          this.categories = await categoriasService.list();
        } catch (e) {
          console.error('Error eliminando categoría', e);
          alert(e.message || 'Error eliminando categoría');
        }
      }
    }
  });

  app.mount('#vm-categorias');
} catch (err) {
  // Si Vue falla por cualquier razón, lo verás en la consola y el modal no debe mostrarse
  console.error('Error inicializando categorias.js:', err);
}
