# app/routes/pedidos.py
from flask import Blueprint, flash, redirect, render_template, request, jsonify, url_for
from flask_login import login_required, current_user
from app.controllers.pedido_controller import list_pedidos, get_pedido, create_pedido, update_pedido, list_proveedores, list_tipo_pagos, list_productos, list_productos_by_proveedor, get_producto_proveedor_precio, registrar_recepcion
import datetime

pedidos_bp = Blueprint('pedidos', __name__, url_prefix='/pedidos')

@pedidos_bp.route('/', methods=['GET'])
@login_required
def pedidos():
    return render_template('pedidos/pedidos.html')

@pedidos_bp.route('/crear_editar_pedido.html', methods=['GET'])
@login_required
def crear_editar_pedido_partial():
    pedido_id = request.args.get('id', '')
    fecha_actual = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    return render_template('pedidos/crear_editar_pedido.html', pedido_id=pedido_id, fecha_actual=fecha_actual)

@pedidos_bp.route('/api/list')
@login_required
def api_list_pedidos():
    return jsonify(list_pedidos())

@pedidos_bp.route('/api/<int:pedido_id>')
@login_required
def api_get_pedido(pedido_id):
    return jsonify(get_pedido(pedido_id))

@pedidos_bp.route('/api', methods=['POST'])
@login_required
def api_create_pedido():
    data = request.json
    try:
        result = create_pedido(data)
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@pedidos_bp.route('/api/<int:pedido_id>', methods=['PUT'])
@login_required
def api_update_pedido(pedido_id):
    data = request.json
    try:
        result = update_pedido(pedido_id, data)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@pedidos_bp.route('/api/proveedores', methods=['GET'])
@login_required
def api_list_proveedores():
    return jsonify(list_proveedores())

@pedidos_bp.route('/api/tipo_pagos', methods=['GET'])
@login_required
def api_list_tipo_pagos():
    return jsonify(list_tipo_pagos())

@pedidos_bp.route('/api/productos', methods=['GET'])
@login_required
def api_list_productos():
    return jsonify(list_productos())

@pedidos_bp.route('/api/productos_por_proveedor/<int:proveedor_id>', methods=['GET'])
@login_required
def api_list_productos_por_proveedor(proveedor_id):
    return jsonify(list_productos_by_proveedor(proveedor_id))

@pedidos_bp.route('/api/producto_proveedor_precio', methods=['GET'])
@login_required
def api_get_producto_proveedor_precio():
    producto_id = request.args.get('producto_id')
    proveedor_id = request.args.get('proveedor_id')
    if not producto_id or not proveedor_id:
        return jsonify({'error': 'Parámetros requeridos'}), 400
    return jsonify(get_producto_proveedor_precio(producto_id, proveedor_id))

@pedidos_bp.route('/api/<int:pedido_id>/registrar-recepcion', methods=['POST'])
@login_required
def api_registrar_recepcion(pedido_id):
    try:
        result = registrar_recepcion(pedido_id, current_user.usuario_id)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@pedidos_bp.route('/crear', methods=['GET', 'POST'])
def crear_pedido():
    if request.method == 'POST':
        flash('Pedido creado (simulado).', 'success')
        return redirect(url_for('pedidos.pedidos'))
    return render_template('pedidos/crear_pedido.html')

@pedidos_bp.route('/<int:pedido_id>', methods=['GET'])
def ver_pedido(pedido_id):
    return render_template('pedidos/ver_pedido.html', pedido_id=pedido_id)

@pedidos_bp.route('/<int:pedido_id>/editar', methods=['GET', 'POST'])
def editar_pedido(pedido_id):
    if request.method == 'POST':
        flash(f'Pedido {pedido_id} actualizado (simulado).', 'success')
        return redirect(url_for('pedidos.ver_pedido', pedido_id=pedido_id))
    return render_template('pedidos/editar_pedido.html', pedido_id=pedido_id)

@pedidos_bp.route('/<int:pedido_id>/eliminar', methods=['POST'])
def eliminar_pedido(pedido_id):
    flash(f'Pedido {pedido_id} eliminado (simulado).', 'warning')
    return redirect(url_for('pedidos.pedidos'))