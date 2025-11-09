// static/js/views/categorias.js
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
        if (!categoriasService || typeof categoriasService.list !== 'function') {
          this.categories = [
            { id: 1, nombre: 'Bebidas', descripcion: 'Productos líquidos' },
            { id: 2, nombre: 'Snacks', descripcion: 'Aperitivos' }
          ];
        } else {
          this.categories = await categoriasService.list();
        }
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
            if (categoriasService && categoriasService.update) await categoriasService.update(this.editingCategory.id, this.categoryForm);
          } else {
            if (categoriasService && categoriasService.create) await categoriasService.create(this.categoryForm);
          }
          // refrescar
          if (categoriasService && categoriasService.list) {
            this.categories = await categoriasService.list();
          } else {
            // demo: actualizar local
            if (this.editingCategory && this.editingCategory.id) {
              const idx = this.categories.findIndex(c => String(c.id) === String(this.editingCategory.id));
              if (idx >= 0) this.categories.splice(idx, 1, Object.assign({}, this.categoryForm, { id: this.editingCategory.id }));
            } else {
              const newId = (this.categories.length ? Math.max(...this.categories.map(c => Number(c.id))) : 0) + 1;
              this.categories.push(Object.assign({ id: newId }, this.categoryForm));
            }
          }
          this.closeCategoryModal();
        } catch (e) {
          console.error('Error guardando categoría', e);
          alert(e.message || 'Error guardando categoría');
        }
      },
      async removeCategory(id) {
        if (!confirm('Eliminar categoría?')) return;
        try {
          if (categoriasService && categoriasService.delete) await categoriasService.delete(id);
          if (categoriasService && categoriasService.list) {
            this.categories = await categoriasService.list();
          } else {
            this.categories = this.categories.filter(c => String(c.id) !== String(id));
          }
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
