// static/js/views/cuenta_editar.js
import { userService } from '/static/js/services/userService.js';

const { createApp } = Vue;

createApp({
  delimiters: ['[[', ']]'],
  data() {
    return {
      user: null,
      form: {
        nombre: '',
        apellido: '',
        email: '',
        numerotelefono: '',
        direccion: '',
        contrasena: ''
      },
      avatarFile: null,
      avatarPreview: document.querySelector('meta[name="avatar-placeholder"]').content || '/static/images/avatar_placeholder.png',
      loading: true,
      avatarPreview: null,
      saving: false,
      message: '',
      messageType: ''
    };
  },

  computed: {
    // propiedad única para el <img> en la plantilla
    currentAvatar() {
        // priorizamos: preview local (cuando usuario seleccionó fichero) ->
        // avatar del user (lo que devuelve backend, ya normalizado) -> placeholder
        if (this.avatarPreview) return this.avatarPreview;
        if (this.user && this.user.avatar) return this.user.avatar;
        return this.avatarPlaceholder;
    }
},
  async created() {
    this.loading = true;
    try {
      const u = await userService.getUser();
      if (!u) {
        this.message = 'No se pudo cargar el usuario. Redirigiendo al login...';
        this.messageType = 'error';
        setTimeout(()=>{ window.location.href = document.querySelector('meta[name="login-url"]').content || '/auth/login'; }, 1200);
        return;
      }
        this.user = u;
    // nombre: preferimos campos explícitos si vienen, si no usamos fullName
        this.form.nombre = u.nombre || (u.fullName ? u.fullName.split(' ')[0] : '') || '';
        // apellido: si no vino, tomar resto de fullName (todo después del primer espacio)
        if (u.apellido && u.apellido.length) {
        this.form.apellido = u.apellido;
        } else if (u.fullName) {
        const parts = u.fullName.split(' ');
        this.form.apellido = parts.length > 1 ? parts.slice(1).join(' ') : '';
        } else {
        this.form.apellido = '';
        }

        this.form.email = u.email || '';
        this.form.numerotelefono = u.numerotelefono || u.phone || '';
        this.form.direccion = u.direccion || u.address || '';

    } catch (e) {
      console.error(e);
      this.message = 'Error cargando datos del usuario.';
      this.messageType = 'error';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    onAvatarChange(e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      this.avatarFile = f;
      const reader = new FileReader();
      reader.onload = (ev) => { this.avatarPreview = ev.target.result; };
      reader.readAsDataURL(f);
    },

    // dentro de createApp methods:
async submit() {
  if (!this.user || !this.user.usuario_id) {
    this.message = 'Usuario inválido.';
    this.messageType = 'error';
    return;
  }

  this.saving = true;
  this.message = '';
  this.messageType = '';

  const payload = {
    nombre: this.form.nombre,
    apellido: this.form.apellido,
    email: this.form.email,
    numerotelefono: this.form.numerotelefono,
    direccion: this.form.direccion
  };
  if (this.form.contrasena && this.form.contrasena.length > 0) payload.contrasena = this.form.contrasena;

  try {
    // actualizar datos vía API
    await userService.updateUser(this.user.usuario_id, payload);

    // subir avatar (si existe) y **esperar la respuesta**
    if (this.avatarFile) {
    const resp = await userService.uploadAvatar(this.user.usuario_id, this.avatarFile);
    // backend devuelve {avatar: "/static/uploads/avatars/..jpg?v=.."} según logs
    if (resp && resp.avatar) {
        // actualizar user.avatar para que currentAvatar lo use
        if (!this.user) this.user = {};
        this.user.avatar = resp.avatar;
        // también limpiar preview para que no “tenga preferencia”
        this.avatarPreview = null;
    } else if (resp && resp.filename) {
        this.user.avatar = '/static/uploads/avatars/' + resp.filename + '?t=' + Date.now();
        this.avatarPreview = null;
    }
    // opcional: refrescar getUser para asegurar consistencia (con ?v=mtime)
    const fresh = await userService.getUser();
    if (fresh) { this.user = fresh; this.avatarPreview = null; }
    }

    // refrescar el usuario desde backend para obtener la URL actualizada (con ?v=...)
    try {
      const fresh = await userService.getUser();
      if (fresh) {
        this.user = fresh;
        // asignar avatarPreview desde user (por si user.avatar tiene ?v=timestamp)
        this.avatarPreview = fresh.avatar || this.avatarPreview;
      }
    } catch (e) {
      console.warn('No se pudo refrescar user tras upload:', e);
    }

    this.message = 'Perfil actualizado correctamente.';
    this.messageType = 'success';

    // redirigir (pequeña espera para que el usuario vea el mensaje)
    setTimeout(() => {
      const accountMeta = document.querySelector('meta[name="account-url"]');
      const accountUrl = accountMeta ? accountMeta.content : '/cuenta';
      window.location.href = accountUrl;
    }, 700);
  } catch (err) {
    console.error('Error al actualizar (API):', err);
    this.message = 'No se pudo actualizar vía API. Intentando fallback por formulario...';
    this.messageType = 'error';

    // fallback POST (igual que ya tenías)
    try {
      const formEl = document.getElementById('fallback-post-form');
      if (formEl) {
        const setValue = (name, value) => {
          let inp = formEl.querySelector(`input[name="${name}"]`);
          if (!inp) {
            inp = document.createElement('input');
            inp.type = 'hidden';
            inp.name = name;
            formEl.appendChild(inp);
          }
          inp.value = value || '';
        };
        setValue('nombre', this.form.nombre);
        setValue('apellido', this.form.apellido);
        setValue('email', this.form.email);
        setValue('numerotelefono', this.form.numerotelefono);
        setValue('direccion', this.form.direccion);
        setValue('contrasena', this.form.contrasena);
        formEl.submit();
        return;
      } else {
        this.message += ' Fallback no disponible.';
        this.messageType = 'error';
      }
    } catch (e2) {
      console.error('Fallback POST failed:', e2);
      this.message += ' Fallback failed.';
      this.messageType = 'error';
    }
  } finally {
    this.saving = false;
  }
},
  }
}).mount('#vm-edit');
