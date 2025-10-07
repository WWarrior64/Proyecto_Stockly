// static/js/services/userService.js
export const userService = {
  async getUser() {
    try {
      const res = await fetch('/cuenta/api/user', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Error al obtener usuario');
      return await res.json();
    } catch (e) {
      // fallback a datos estáticos si hay error
      return {
        fullName: "Nombre de usuario",
        role: "Invitado",
        email: "correo@ejemplo.com",
        address: "Av. Central #102, ...",
        phone: "(+503) 1234 5678",
        avatar: "/static/images/avatar_placeholder.png",
        extraFields: []
      };
    }
  },

    async logout() {
    try {
      // Intentamos logout por POST (más seguro); si el servidor solo soporta GET, adaptarlo.
      const res = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // si el servidor responde 200/302 etc, redirigimos al login según meta tag en la plantilla
      const loginUrlMeta = document.querySelector('meta[name="login-url"]');
      const loginUrl = loginUrlMeta ? loginUrlMeta.content : '/auth/login';
      window.location.href = loginUrl;
    } catch (e) {
      // fallback a redirección directa
      const loginUrlMeta = document.querySelector('meta[name="login-url"]');
      const loginUrl = loginUrlMeta ? loginUrlMeta.content : '/auth/login';
      window.location.href = loginUrl;
    }
  }
};
