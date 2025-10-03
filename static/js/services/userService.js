// static/js/services/userService.js
export const userService = {
  async getUser() {
    try {
      const res = await fetch('/cuenta/api/user');
      if (!res.ok) throw new Error('Error al obtener usuario');
      return await res.json();
    } catch (e) {
      // fallback a datos estáticos si hay error
      return {
        fullName: "Nombre de usuario",
        role: "Administrador",
        email: "correo@ejemplo.com",
        address: "Av. Central #102, ...",
        phone: "(+503) 1234 5678",
        avatar: "/static/images/avatar_placeholder.png",
        extraFields: []
      };
    }
  },

  logout() {
    const meta = document.querySelector('meta[name="login-url"]');
    const loginUrl = meta ? meta.content : '/login'; // fallback simple
    window.location.href = loginUrl;
  }
};
