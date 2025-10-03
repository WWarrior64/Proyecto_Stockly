from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/home')
def home():
    return render_template('home.html')

@main_bp.route('/pedidos')
def pedidos():
    return render_template('pedidos.html')

@main_bp.route('/reportes')
def reportes():
    return render_template('reportes/reportes.html')

@main_bp.route('/cuenta')
def cuenta():
    return render_template('cuenta.html')
