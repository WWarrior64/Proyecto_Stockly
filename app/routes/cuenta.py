# app/routes/cuenta.py
from flask import Blueprint, render_template, jsonify, request, redirect, url_for

# usamos url_prefix para que todas las rutas queden bajo /cuenta
cuenta_bp = Blueprint('cuenta', __name__, url_prefix='/cuenta')

@cuenta_bp.route('/', methods=['GET'])
def cuenta():
    # renderiza la plantilla: templates/user/usuario.html
    return render_template('user/usuario.html')

@cuenta_bp.route('/editar', methods=['GET', 'POST'])
def editar_cuenta():
    if request.method == 'POST':
        # TODO: procesar request.form y persistir cuando exista DB
        return redirect(url_for('cuenta.cuenta'))
    # crear esta plantilla en templates/user/cuenta_editar.html en el futuro
    return render_template('user/cuenta_editar.html')

# Endpoint API para datos del usuario (JSON) - útil para que Vue haga fetch
@cuenta_bp.route('/api/user', methods=['GET'])
def api_get_user():
    # NOTE: por ahora devolvemos datos de ejemplo; en el futuro leer desde la BD
    user_data = {
        "fullName": "Nombre de usuario",
        "role": "Administrador",
        "email": "correo@ejemplo.com",
        "address": "Av. Central #102, Zona Empresarial El Roble, San Salvador, El Salvador",
        "phone": "(+503) 1234 5678",
        "avatar": url_for('static', filename='images/avatar_placeholder.png'),
        "extraFields": [
            {"label": "Campo", "value": "Información"},
            {"label": "Campo", "value": "Información"}
        ]
    }
    return jsonify(user_data)
