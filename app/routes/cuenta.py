# app/routes/cuenta.py
from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user
from app.controllers.cuenta_controller import get_user_json

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
    # devuelve JSON con los datos del usuario autenticado
    return jsonify(get_user_json(current_user))
