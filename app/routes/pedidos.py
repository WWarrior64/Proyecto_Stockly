# app/routes/pedidos.py
from flask import Blueprint, render_template, request, redirect, url_for, flash

pedidos_bp = Blueprint('pedidos', __name__, url_prefix='/pedidos')

@pedidos_bp.route('/', methods=['GET'])
def pedidos():
    """Lista / vista principal de pedidos"""
    # Aquí en el futuro pasaremos la lista real desde la base de datos:
    # pedidos = Pedido.query.all()
    return render_template('pedidos/pedidos.html')


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
