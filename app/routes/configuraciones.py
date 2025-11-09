#app/routes/configuraciones.py
from flask import Blueprint, render_template
config_bp = Blueprint('configuraciones', __name__, url_prefix='/configuraciones')

@config_bp.route('/proveedores')
def proveedores():
    return render_template('configuraciones/proveedores/proveedores.html')

@config_bp.route('/categorias')
def categorias():
    return render_template('configuraciones/categorias/categorias.html')