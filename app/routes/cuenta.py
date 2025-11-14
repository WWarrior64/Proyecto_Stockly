import os
import time
from flask import Blueprint, current_app, render_template, jsonify, request, redirect, url_for
from werkzeug.utils import secure_filename
from flask_login import login_required, current_user
from app.controllers.cuenta_controller import (
    get_user_json, get_users_json, get_user_by_id,
    create_user, update_user, delete_user,
    get_roles_json, create_role, update_role, delete_role, is_admin,
    save_user_avatar, _avatar_url_for
)

cuenta_bp = Blueprint('cuenta', __name__, url_prefix='/cuenta')


@cuenta_bp.route('/', methods=['GET'])
@login_required
def cuenta():
    # renderiza la plantilla: templates/user/usuario.html
    return render_template('user/usuario.html')


@cuenta_bp.route('/editar', methods=['GET', 'POST'])
@login_required
def editar_cuenta():
    """
    GET: muestra la plantilla con el formulario.
    POST: fallback desde el formulario HTML (cuando la API PUT no esté disponible o produzca 403).
    El POST actualiza solo al usuario autenticado (current_user).
    """
    if request.method == 'POST':
        # recogemos datos del form (fallback)
        form = request.form or {}
        data = {
            "nombre": form.get('nombre'),
            "apellido": form.get('apellido'),
            "email": form.get('email'),
            "numerotelefono": form.get('numerotelefono'),
            "direccion": form.get('direccion')
        }
        # contraseña opcional
        if form.get('contrasena'):
            data['contrasena'] = form.get('contrasena')

        try:
            # actualizar solo al propio usuario
            update_user(getattr(current_user, 'usuario_id'), data)
            return redirect(url_for('cuenta.cuenta'))
        except ValueError as e:
            # mostrar error en la misma página
            return render_template('user/cuenta_editar.html', error=str(e)), 400

    # GET -> render template
    return render_template('user/cuenta_editar.html')


# Endpoint API para datos del usuario (JSON)
@cuenta_bp.route('/api/user', methods=['GET'])
@login_required
def api_get_user():
    return jsonify(get_user_json(current_user))


# Endpoint API para lista de usuarios (solo admin)
@cuenta_bp.route('/api/usuarios', methods=['GET', 'POST'])
@login_required
def api_usuarios():
    if not is_admin(current_user):
        return jsonify({"message": "Acceso denegado"}), 403

    if request.method == 'GET':
        return jsonify(get_users_json())
    elif request.method == 'POST':
        data = request.get_json() or {}
        try:
            nuevo_id = create_user(data)
            return jsonify({"message": "Usuario creado", "usuario_id": nuevo_id}), 201
        except ValueError as e:
            return jsonify({"message": str(e)}), 400


# Endpoint para GET/PUT/DELETE de un usuario por id
@cuenta_bp.route('/api/usuarios/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def api_usuario(id):
    # GET -> permitimos al propio usuario o admin ver los detalles
    if request.method == 'GET':
        if not (is_admin(current_user) or getattr(current_user, "usuario_id", None) == id):
            return jsonify({"message": "Acceso denegado"}), 403

        user = get_user_by_id(id)
        if not user:
            return jsonify({"message": "Usuario no encontrado"}), 404
        return jsonify(get_user_json(user))

    # PUT/DELETE -> DELETE: solo admin
    if request.method == 'PUT':
        # permitimos PUT si es admin o el propio usuario
        if not (is_admin(current_user) or getattr(current_user, "usuario_id", None) == id):
            return jsonify({"message": "Acceso denegado"}), 403

        data = request.get_json() or {}

        # si no es admin, evitar que cambie rol_id (y cualquier otro campo sensible)
        if not is_admin(current_user):
            data.pop('rol_id', None)

        try:
            update_user(id, data)
            return jsonify({"message": "Usuario actualizado"})
        except ValueError as e:
            return jsonify({"message": str(e)}), 400

    if request.method == 'DELETE':
        # solo admin puede eliminar usuarios
        if not is_admin(current_user):
            return jsonify({"message": "Acceso denegado"}), 403

        deleted = delete_user(id)
        if deleted:
            return jsonify({"message": "Usuario eliminado"})
        return jsonify({"message": "Usuario no encontrado"}), 404


# Endpoint API para lista de roles (solo admin)
@cuenta_bp.route('/api/roles', methods=['GET', 'POST'])
@login_required
def api_roles():
    if not is_admin(current_user):
        return jsonify({"message": "Acceso denegado"}), 403

    if request.method == 'GET':
        return jsonify(get_roles_json())
    elif request.method == 'POST':
        data = request.get_json() or {}
        try:
            nuevo_id = create_role(data)
            return jsonify({"message": "Rol creado", "rol_id": nuevo_id}), 201
        except ValueError as e:
            return jsonify({"message": str(e)}), 400


@cuenta_bp.route('/api/roles/<int:id>', methods=['PUT', 'DELETE'])
@login_required
def api_rol(id):
    if not is_admin(current_user):
        return jsonify({"message": "Acceso denegado"}), 403

    if request.method == 'PUT':
        data = request.get_json() or {}
        try:
            update_role(id, data)
            return jsonify({"message": "Rol actualizado"})
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
    elif request.method == 'DELETE':
        deleted = delete_role(id)
        if deleted:
            return jsonify({"message": "Rol eliminado"})
        return jsonify({"message": "Rol no encontrado"}), 404
    
@cuenta_bp.route('/api/usuarios/<int:id>/avatar', methods=['POST'])
@login_required
def api_upload_avatar(id):
    # permitir si es admin o el propio usuario
    if not (is_admin(current_user) or getattr(current_user, "usuario_id", None) == id):
        return jsonify({"message": "Acceso denegado"}), 403

    if 'avatar' not in request.files:
        return jsonify({"message": "No se encontró el archivo 'avatar' en la petición."}), 400

    file = request.files['avatar']
    try:
        filename = save_user_avatar(id, file)  # guarda y actualiza user.avatar (retorna filename)
        # calcula mtime para cache-busting
        upload_folder = current_app.config.get(
            "AVATAR_UPLOAD_PATH",
            os.path.join(current_app.root_path, "static", "uploads", "avatars")
        )
        file_path = os.path.join(upload_folder, secure_filename(filename))
        try:
            v = int(os.path.getmtime(file_path)) if os.path.exists(file_path) else int(time.time())
        except Exception:
            v = int(time.time())

        avatar_url = url_for('static', filename=f'uploads/avatars/{filename}', _external=False) + f'?v={v}'
        current_app.logger.info(f"Avatar uploaded: user={id} url={avatar_url}")
        return jsonify({"message": "Avatar actualizado", "avatar": avatar_url})
    except ValueError as e:
        current_app.logger.warning(f"Avatar upload validation error: {e}")
        return jsonify({"message": str(e)}), 400
    except Exception:
        current_app.logger.exception("Error al subir avatar")
        return jsonify({"message": "Error interno al subir avatar"}), 500

@cuenta_bp.route('/api/user', methods=['GET'])
def api_user():
    if current_user.is_authenticated:
        return jsonify({
            'nombre': current_user.nombre,
            'apellido': current_user.apellido or '',
            'email': current_user.email or ''
        })
    else:
        return jsonify({'nombre': 'Usuario Anónimo'}), 401
