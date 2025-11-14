# app/routes/inventario.py (updated with APIs)
# app/routes/inventario.py (parte superior)
from flask import Blueprint, render_template, jsonify, request, abort
from flask_login import current_user, login_required

from app.extensions import db
from app.decorators import api_login_required
from app.controllers.inventario_controller import (
    get_asignacion, list_products, get_product, create_product, update_product, delete_product,
    list_asignaciones, create_asignacion, update_asignacion, delete_asignacion,
    list_pedidos_pendientes, list_detalles_pedido, list_lotes, create_movimiento,
    list_recepciones_pedido, check_and_create_auto_orders
)
from app.controllers.categoria_controller import list_categorias  # Import for categories
from app.controllers.proveedor_controller import list_proveedores  # Import for providers

inventario_bp = Blueprint('inventario', __name__, url_prefix='/inventario')

@inventario_bp.route('/')
def inventario():
    # página completa del inventario
    return render_template('inventario/inventario.html')

@inventario_bp.route('/ce_productos.html')
def ce_productos():
    return render_template('inventario/ce_productos.html')

@inventario_bp.route('/ap_productos.html')
def ap_productos():
    return render_template('inventario/ap_productos.html')

@inventario_bp.route('/registrar_movimiento.html')
def registrar_movimiento():
    return render_template('inventario/registrar_movimiento.html')

# API for products
@inventario_bp.route('/api/productos', methods=['GET'])
@api_login_required
def api_list_products():
    # Verificar y crear pedidos automáticos para productos con stock bajo
    check_and_create_auto_orders()
    
    products = list_products()
    return jsonify(products)

@inventario_bp.route('/api/productos/<int:id>', methods=['GET'])
def api_get_product(id):
    from sqlalchemy import func
    from app.models import Stock, Lote
    
    product = get_product(id)
    
    # Calcular stock total sumando todos los lotes del producto
    total_stock = db.session.query(func.sum(Stock.cantidad)).join(Lote).filter(Lote.producto_id == id).scalar() or 0
    
    return jsonify({
        'id': product.producto_id,
        'sku': product.sku,
        'nombre': product.nombre,
        'precio': float(product.preciounitario) if product.preciounitario else None,
        'estado': product.estado,
        'categoria_id': product.categoria_id,
        'descripcion': product.descripcion or '',
        'stock': float(total_stock)
    })

@inventario_bp.route('/api/productos', methods=['POST'])
def api_create_product():
    data = request.json
    new_product = create_product(data)
    return jsonify({'id': new_product.producto_id}), 201

@inventario_bp.route('/api/productos/<int:id>', methods=['PUT'])
def api_update_product(id):
    data = request.json
    updated_product = update_product(id, data)
    return jsonify({'id': updated_product.producto_id})

@inventario_bp.route('/api/productos/<int:id>', methods=['DELETE'])
def api_delete_product(id):
    delete_product(id)
    return '', 204

# Use imported from config controllers
@inventario_bp.route('/api/categorias', methods=['GET'])
def api_list_categorias_inv():
    cats = list_categorias()
    return jsonify([{'id': c.categoria_id, 'nombre': c.categoria_nombre} for c in cats])

@inventario_bp.route('/api/proveedores', methods=['GET'])
def api_list_proveedores_inv():
    provs = list_proveedores()
    # devolver claves que el frontend espera
    return jsonify([{'proveedor_id': p.proveedor_id, 'proveedor_nombre': p.proveedor_nombre} for p in provs])


# Asignaciones
@inventario_bp.route('/api/asignaciones', methods=['GET'])
def api_list_asignaciones():
    product_id = request.args.get('producto_id', type=int)
    if not product_id:
        abort(400, description="producto_id requerido")
    asigns = list_asignaciones(product_id)
    return jsonify(asigns)

@inventario_bp.route('/api/asignaciones/<int:product_id>/<int:proveedor_id>', methods=['GET'])
def api_get_asignacion(product_id, proveedor_id):
    asign = get_asignacion(product_id, proveedor_id)
    return jsonify({
        'producto_id': asign.producto_id,
        'proveedor_id': asign.proveedor_id,
        'precio_compra': float(asign.precio_compra) if asign.precio_compra else None,
        'plazo_entrega': asign.plazo_entrega_dias,
        'pedido_minimo': asign.pedido_minimo,
        'preferido': asign.preferido
    })

@inventario_bp.route('/api/asignaciones', methods=['POST'])
def api_create_asignacion():
    data = request.json
    new_asign = create_asignacion(data)
    return jsonify({'producto_id': new_asign.producto_id, 'proveedor_id': new_asign.proveedor_id}), 201

@inventario_bp.route('/api/asignaciones/<int:product_id>/<int:proveedor_id>', methods=['PUT'])
def api_update_asignacion(product_id, proveedor_id):
    data = request.json
    updated_asign = update_asignacion(product_id, proveedor_id, data)
    return jsonify({'producto_id': updated_asign.producto_id, 'proveedor_id': updated_asign.proveedor_id})

@inventario_bp.route('/api/asignaciones/<int:product_id>/<int:proveedor_id>', methods=['DELETE'])
def api_delete_asignacion(product_id, proveedor_id):
    delete_asignacion(product_id, proveedor_id)
    return '', 204

# Pedidos pendientes
@inventario_bp.route('/api/pedidos/pendientes', methods=['GET'])
def api_list_pedidos_pendientes():
    pendientes = list_pedidos_pendientes()
    return jsonify(pendientes)

# Detalles pedido
@inventario_bp.route('/api/pedidos/<int:pedido_id>/detalles', methods=['GET'])
def api_list_detalles_pedido(pedido_id):
    detalles = list_detalles_pedido(pedido_id)
    return jsonify(detalles)

# Lotes por producto
@inventario_bp.route('/api/productos/<int:product_id>/lotes', methods=['GET'])
def api_list_lotes(product_id):
    lotes = list_lotes(product_id)
    return jsonify(lotes)

# Crear movimiento
@inventario_bp.route('/api/movimientos', methods=['POST'])
@api_login_required
def api_create_movimiento():
    try:
        data = request.json
        if not data:
            return jsonify({'description': 'No se recibieron datos'}), 400
        
        new_mov = create_movimiento(data)
        return jsonify({'id': new_mov.movimiento_id}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_msg = str(e)
        if hasattr(e, 'description'):
            error_msg = e.description
        return jsonify({'description': error_msg}), getattr(e, 'code', 500)

# Recepciones de un pedido
@inventario_bp.route('/api/pedidos/<int:pedido_id>/recepciones', methods=['GET'])
def api_list_recepciones_pedido(pedido_id):
    recepciones = list_recepciones_pedido(pedido_id)
    return jsonify(recepciones)

# Usuario actual
@inventario_bp.route('/api/usuario/current', methods=['GET'])
@api_login_required
def api_current_user():
    return jsonify({
        'id': current_user.usuario_id,
        'nombre': current_user.nombre if hasattr(current_user, 'nombre') else 'Usuario',
        'email': current_user.email if hasattr(current_user, 'email') else ''
    })
