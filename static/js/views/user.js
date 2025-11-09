// static/js/views/user.js
import { userService } from '/static/js/services/userService.js';

const { createApp } = Vue;

const app = createApp({
  delimiters: ['[[', ']]'],
  data() {
    return {
      user: { fullName: '', role: '', email: '', address: '', phone: '', avatar: '', extraFields: [] },
      loading: true, error: null,
      avatarPlaceholder: document.querySelector('meta[name="avatar-placeholder"]')?.content || '/static/images/avatar_placeholder.png',

      // admin data
      isAdmin: false,
      users: [],
      roles: [],

      // manager panels (slideovers)
      showUserManager: false,
      showRoleManager: false,

      // small modals (create/edit)
      showUserModal: false,
      editingUser: null,
      userForm: { nombre: '', apellido: '', numerotelefono: '', email: '', direccion: '', contrasena: '', rol_id: null },

      showRoleModal: false,
      editingRole: null,
      roleForm: { nombre: '' }
    };
  },
  computed: {
    currentAvatar() {
      return (this.user && this.user.avatar) ? this.user.avatar : this.avatarPlaceholder;
    }
  },

  async created() {
    this.loading = true;
    try {
      const data = await userService.getUser();
      if (!data) { this.loading = false; return; }
      this.user = data;
      this.isAdmin = (data.role || '').toLowerCase().includes('admin') || (data.role || '').toLowerCase().includes('administrador');
      if (this.isAdmin) {
        await Promise.all([this.fetchRoles(), this.fetchUsers()]);
      }
      window.addEventListener('keydown', this._onKeydown);
    } catch (e) {
      console.error('Error init:', e);
      this.error = e.message || 'Error';
    } finally {
      this.loading = false;
    }
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this._onKeydown);
  },

  methods: {
    _onKeydown(e) {
      if (e.key === 'Escape') {
        if (this.showUserModal) this.closeUserModal();
        if (this.showRoleModal) this.closeRoleModal();
        if (this.showUserManager) this.closeUserManager();
        if (this.showRoleManager) this.closeRoleManager();
      }
    },

    async logout() { await userService.logout(); },

    async openUserManager() {
      this.showUserManager = true;
      await this.fetchUsers();
      this.$nextTick(() => {
        const btn = document.querySelector('[data-focus-new-user]');
        if (btn) btn.focus();
      });
    },
    closeUserManager() { this.showUserManager = false; },

    async openRoleManager() {
      this.showRoleManager = true;
      await this.fetchRoles();
      this.$nextTick(() => {
        const btn = document.querySelector('[data-focus-new-role]');
        if (btn) btn.focus();
      });
    },
    closeRoleManager() { this.showRoleManager = false; },

    async fetchUsers() {
      try { this.users = await userService.getUsers(); } catch (e) { console.error(e); alert(e.message || 'Error al obtener usuarios'); }
    },
    async fetchRoles() {
      try { this.roles = await userService.getRoles(); } catch (e) { console.error(e); alert(e.message || 'Error al obtener roles'); }
    },

    // ---------- OPEN USER MODAL (AHORA PIDE DETALLE SI HACE FALTA) ----------
    async openUserModal(u) {
      let userData = u;

      // Si recibimos un objeto incompleto desde la tabla, solicitamos el detalle
      if (u && (u.numerotelefono === undefined || u.direccion === undefined || u.numerotelefono === '' || u.direccion === '')) {
        try {
          userData = await userService.getUserById(u.usuario_id);
        } catch (err) {
          console.warn('No se pudo obtener detalle del usuario, usando datos parciales.', err);
          userData = u;
        }
      }

      if (userData) {
        this.editingUser = userData;
        const match = this.roles.find(r => r.rol_id === userData.rol_id) || this.roles.find(r => r.nombre === userData.rol_nombre);
        this.userForm = {
          nombre: userData.nombre || '',
          apellido: userData.apellido || '',
          numerotelefono: userData.numerotelefono || userData.phone || '',
          email: userData.email || '',
          direccion: userData.direccion || userData.address || '',
          contrasena: '',
          rol_id: match ? match.rol_id : (this.roles[0] ? this.roles[0].rol_id : null)
        };
      } else {
        this.editingUser = null;
        this.userForm = { nombre: '', apellido: '', numerotelefono: '', email: '', direccion: '', contrasena: '', rol_id: (this.roles[0] && this.roles[0].rol_id) || null };
      }

      this.showUserModal = true;
      this.$nextTick(() => {
        const el = document.querySelector('input[placeholder="Nombre"]');
        if (el) el.focus();
      });
    },

    closeUserModal() { this.showUserModal = false; },

    async saveUser() {
      const payload = {
        nombre: this.userForm.nombre,
        apellido: this.userForm.apellido,
        numerotelefono: this.userForm.numerotelefono,
        email: this.userForm.email,
        direccion: this.userForm.direccion,
        rol_id: this.userForm.rol_id
      };
      if (this.userForm.contrasena) payload.contrasena = this.userForm.contrasena;

      try {
        if (this.editingUser && this.editingUser.usuario_id) {
          await userService.updateUser(this.editingUser.usuario_id, payload);
          alert('Usuario actualizado');
        } else {
          await userService.createUser(payload);
          alert('Usuario creado');
        }
        await this.fetchUsers();
        this.closeUserModal();
      } catch (e) {
        console.error(e);
        alert(e.message || 'Error guardando usuario');
      }
    },

    async deleteUser(id) {
      if (!confirm('¿Eliminar usuario?')) return;
      try { await userService.deleteUser(id); await this.fetchUsers(); } catch (e) { console.error(e); alert(e.message || 'Error eliminando usuario'); }
    },

    openRoleModal(r) {
      if (r) { this.editingRole = r; this.roleForm = { nombre: r.nombre || '' }; }
      else { this.editingRole = null; this.roleForm = { nombre: '' }; }
      this.showRoleModal = true;
      this.$nextTick(() => {
        const el = document.querySelector('input[placeholder="Nombre"]');
        if (el) el.focus();
      });
    },
    closeRoleModal() { this.showRoleModal = false; },

    async saveRole() {
      const payload = { nombre: this.roleForm.nombre };
      try {
        if (this.editingRole && this.editingRole.rol_id) {
          await userService.updateRole(this.editingRole.rol_id, payload);
          alert('Rol actualizado');
        } else {
          await userService.createRole(payload);
          alert('Rol creado');
        }
        await this.fetchRoles();
        this.closeRoleModal();
      } catch (e) {
        console.error(e);
        alert(e.message || 'Error guardando rol');
      }
    },

    async deleteRole(id) {
      if (!confirm('¿Eliminar rol?')) return;
      try { await userService.deleteRole(id); await this.fetchRoles(); } catch (e) { console.error(e); alert(e.message || 'Error eliminando rol'); }
    }
  }
});

app.mount('#vm');
