// static/js/services/userService.js
// Servicio centralizado para todo lo relacionado con el usuario.
// Usa credentials: 'same-origin' para mantener cookies de sesión / CSRF.

function _getLoginUrlFallback() {
  const meta = document.querySelector('meta[name="login-url"]');
  return meta ? meta.content : '/auth/login';
}

function _getCsrfHeader() {
  // Busca token CSRF en meta tags (si usas Flask-WTF u otro middleware)
  const meta = document.querySelector('meta[name="csrf-token"]') || document.querySelector('meta[name="csrf_token"]');
  if (!meta) return {};
  const token = meta.content;
  return { 'X-CSRFToken': token, 'X-CSRF-Token': token };
}

function _normalizeAvatar(avatar) {
  if (!avatar) return '/static/images/avatar_placeholder.png';
  // Si es URL absoluta o ya comienza con /, devolver tal cual
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) {
    return avatar;
  }
  // Si guardas solo el filename (ej. 'usuario.png') asume carpeta static/images
  return `/static/images/${avatar}`;
}

async function _handleJSONResponse(res) {
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    // no JSON
  }
  return { ok: res.ok, status: res.status, body: json, text };
}

export const userService = {
  async getUser() {
    try {
      const res = await fetch('/cuenta/api/user', {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });

      const parsed = await _handleJSONResponse(res);

      if (parsed.status === 401) {
        // no autenticado -> redirigir al login
        window.location.href = _getLoginUrlFallback();
        return;
      }

      if (!parsed.ok) throw new Error(parsed.body?.message || 'Error al obtener usuario');

      const data = parsed.body || {};

      // Normalizar avatar y campos mínimos
      data.avatar = _normalizeAvatar(data.avatar);
      data.fullName = data.fullName || `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Invitado';
      data.email = data.email || 'Ninguno';
      data.address = data.address || 'Ninguno';
      data.phone = data.phone || 'Ninguno';
      data.extraFields = data.extraFields || [];

      return data;
    } catch (e) {
      // fallback local (útil en desarrollo sin backend)
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
      const headers = Object.assign({ 'Content-Type': 'application/json' }, _getCsrfHeader());
      const res = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers
      });

      // Si servidor devuelve 200/204/302 consideramos logout correcto.
      const loginUrl = _getLoginUrlFallback();
      window.location.href = loginUrl;
    } catch (e) {
      // fallback
      window.location.href = _getLoginUrlFallback();
    }
  },

  // --- Métodos útiles para la sección de administración (opcional) ---
  async getUsers() {
    const res = await fetch('/cuenta/api/usuarios', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
    const parsed = await _handleJSONResponse(res);
    if (parsed.status === 401) { window.location.href = _getLoginUrlFallback(); return []; }
    if (!parsed.ok) throw new Error(parsed.body?.message || 'Error al listar usuarios');
    return parsed.body || [];
  },

    // Obtener detalle de un usuario por id (nuevo)
  async getUserById(id) {
    const res = await fetch(`/cuenta/api/usuarios/${id}`, {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    });
    const parsed = await _handleJSONResponse(res);
    if (parsed.status === 401) { window.location.href = _getLoginUrlFallback(); }
    if (!parsed.ok) {
      throw new Error(parsed.body?.message || `Error obteniendo usuario ${id}`);
    }
    // Normalizar avatar si viene (consistente con getUser)
    const data = parsed.body || {};
    if (data.avatar) data.avatar = _normalizeAvatar(data.avatar);
    return data;
  },


  async createUser(payload) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, _getCsrfHeader());
    const res = await fetch('/cuenta/api/usuarios', {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(payload)
    });
    const parsed = await _handleJSONResponse(res);
    if (parsed.status === 401) { window.location.href = _getLoginUrlFallback(); }
    if (!parsed.ok) throw new Error(parsed.body?.message || 'Error creando usuario');
    return parsed.body || {};
  },

  async updateUser(id, payload) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, _getCsrfHeader());
    const res = await fetch(`/cuenta/api/usuarios/${id}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(payload)
    });
    const parsed = await _handleJSONResponse(res);
    if (parsed.status === 401) { window.location.href = _getLoginUrlFallback(); }
    if (!parsed.ok) throw new Error(parsed.body?.message || 'Error actualizando usuario');
    return parsed.body || {};
  },

  async deleteUser(id) {
    const headers = _getCsrfHeader();
    const res = await fetch(`/cuenta/api/usuarios/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers
    });
    const parsed = await _handleJSONResponse(res);
    if (parsed.status === 401) { window.location.href = _getLoginUrlFallback(); }
    if (!parsed.ok) throw new Error(parsed.body?.message || 'Error eliminando usuario');
    return parsed.body || {};
  },

  // Roles
  async getRoles() {
    const res = await fetch('/cuenta/api/roles', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
    const parsed = await _handleJSONResponse(res);
    if (parsed.status === 401) { window.location.href = _getLoginUrlFallback(); return []; }
    if (!parsed.ok) throw new Error(parsed.body?.message || 'Error al listar roles');
    return parsed.body || [];
  },

  async createRole(payload) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, _getCsrfHeader());
    const res = await fetch('/cuenta/api/roles', {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(payload)
    });
    const parsed = await _handleJSONResponse(res);
    if (parsed.status === 401) { window.location.href = _getLoginUrlFallback(); }
    if (!parsed.ok) throw new Error(parsed.body?.message || 'Error creando rol');
    return parsed.body || {};
  },

  async updateRole(id, payload) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, _getCsrfHeader());
    const res = await fetch(`/cuenta/api/roles/${id}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(payload)
    });
    const parsed = await _handleJSONResponse(res);
    if (parsed.status === 401) { window.location.href = _getLoginUrlFallback(); }
    if (!parsed.ok) throw new Error(parsed.body?.message || 'Error actualizando rol');
    return parsed.body || {};
  },

  async deleteRole(id) {
    const headers = _getCsrfHeader();
    const res = await fetch(`/cuenta/api/roles/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers
    });
    const parsed = await _handleJSONResponse(res);
    if (parsed.status === 401) { window.location.href = _getLoginUrlFallback(); }
    if (!parsed.ok) throw new Error(parsed.body?.message || 'Error eliminando rol');
    return parsed.body || {};
  }
};
