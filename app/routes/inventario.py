from flask import Blueprint, render_template

inventario_bp = Blueprint('inventario', __name__, url_prefix="/inventario")

@inventario_bp.route('/')
def inventario():
    return render_template('inventario/inventario.html')

@inventario_bp.route('/registrar')
def registrar_movimiento():
    return render_template('inventario/registrar_movimiento.html')
