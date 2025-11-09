# app/routes/pedidos.py
from flask import Blueprint, flash, redirect, render_template, request, jsonify, url_for
from flask_login import login_required

pedidos_bp = Blueprint('pedidos', __name__, url_prefix='/pedidos')

@pedidos_bp.route('/', methods=['GET'])
@login_required
def pedidos():
    # renderiza la vista principal (templates/pedidos/pedidos.html)
    return render_template('pedidos/pedidos.html')

# Ruta que sirve el partial (fragmento) para crear/editar pedido
@pedidos_bp.route('/crear_editar_pedido.html', methods=['GET'])
@login_required
def crear_editar_pedido_partial():
    # Si llega ?id=... puedes pasarlo a la plantilla
    pedido_id = request.args.get('id', '')
    # render_template carga templates/pedidos/crear_editar_pedido.html
    return render_template('pedidos/crear_editar_pedido.html', pedido_id=pedido_id)


@pedidos_bp.route('/api/list')
def api_list_pedidos():
    # TODO: devolver lista real desde BD
    return jsonify([ ... ])

@pedidos_bp.route('/api/<int:pedido_id>')
def api_get_pedido(pedido_id):
    return jsonify({...})

@pedidos_bp.route('/api', methods=['POST'])
def api_create_pedido():
    data = request.get_json()
    # crear y devolver
    return jsonify(data), 201

@pedidos_bp.route('/api/<int:pedido_id>', methods=['PUT'])
def api_update_pedido(pedido_id):
    data = request.get_json()
    # actualizar y devolver
    return jsonify(data), 200


@pedidos_bp.route('/crear', methods=['GET', 'POST'])
def crear_pedido():
    """Formulario para crear un pedido (stub sin DB)."""
    if request.method == 'POST':
        # ejemplo: obtener datos del formulario
        # nombre = request.form.get('nombre')
        # guardar en BD cuando exista
        flash('Pedido creado (simulado).', 'success')
        return redirect(url_for('pedidos.pedidos'))
    return render_template('pedidos/crear_pedido.html')


@pedidos_bp.route('/<int:pedido_id>', methods=['GET'])
def ver_pedido(pedido_id):
    """Ver detalle de un pedido (stub)."""
    # en producción: pedido = Pedido.query.get_or_404(pedido_id)
    return render_template('pedidos/ver_pedido.html', pedido_id=pedido_id)


@pedidos_bp.route('/<int:pedido_id>/editar', methods=['GET', 'POST'])
def editar_pedido(pedido_id):
    """Editar pedido (stub)."""
    if request.method == 'POST':
        # aplicar cambios en BD cuando exista
        flash(f'Pedido {pedido_id} actualizado (simulado).', 'success')
        return redirect(url_for('pedidos.ver_pedido', pedido_id=pedido_id))
    return render_template('pedidos/editar_pedido.html', pedido_id=pedido_id)


@pedidos_bp.route('/<int:pedido_id>/eliminar', methods=['POST'])
def eliminar_pedido(pedido_id):
    """Eliminar pedido (stub)."""
    # en producción: eliminar registro y commit
    flash(f'Pedido {pedido_id} eliminado (simulado).', 'warning')
    return redirect(url_for('pedidos.pedidos'))
