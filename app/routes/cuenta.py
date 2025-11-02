from flask import Blueprint, render_template, jsonify, request, redirect, url_for
from flask_login import login_required, current_user
from app.controllers.cuenta_controller import (
    get_user_json, get_users_json, get_user_by_id,
    create_user, update_user, delete_user,
    get_roles_json, create_role, update_role, delete_role, is_admin
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
    if request.method == 'POST':
        # Puedes procesar request.form aquí para actualizar current_user.
        # Por simplicidad, redirigimos (el frontend hace fetch a /api/usuarios/<id>).
        return redirect(url_for('cuenta.cuenta'))
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

    # PUT/DELETE -> solo admin
    if not is_admin(current_user):
        return jsonify({"message": "Acceso denegado"}), 403

    if request.method == 'PUT':
        data = request.get_json() or {}
        try:
            update_user(id, data)
            return jsonify({"message": "Usuario actualizado"})
        except ValueError as e:
            return jsonify({"message": str(e)}), 400

    if request.method == 'DELETE':
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
