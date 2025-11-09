from flask import Blueprint, render_template, jsonify, request

inventario_bp = Blueprint('inventario', __name__, url_prefix='/inventario')

@inventario_bp.route('/')
def inventario():
    # página completa del inventario
    return render_template('inventario/inventario.html')

# Rutas para los "modales" — devuelven los templates que usarás con fetch
@inventario_bp.route('/ce_productos.html')
def ce_productos():
    # Crear/Editar producto (mejor como partial)
    return render_template('inventario/ce_productos.html')

@inventario_bp.route('/ap_productos.html')
def ap_productos():
    # Asignar proveedores a producto (partial)
    return render_template('inventario/ap_productos.html')

@inventario_bp.route('/registrar_movimiento.html')
def registrar_movimiento():
    # Registrar movimiento (partial)
    return render_template('inventario/registrar_movimiento.html')

# Opcional: endpoint API de ejemplo para pruebas (ajusta según tu API real)
@inventario_bp.route('/api/productos')
def api_productos():
    # retorna una lista de prueba; reemplaza con queries reales
    productos_demo = [
        {"id": 1, "name": "Producto demo A", "category_name": "Cat A", "stock": 12, "price": 10.5, "available": True, "image": "/static/images/Producto.png"},
        {"id": 2, "name": "Producto demo B", "category_name": "Cat B", "stock": 4, "price": 25.0, "available": False, "image": "/static/images/Producto.png"}
    ]
    return jsonify(productos_demo)


@inventario_bp.route('/api/pedidos/pendientes')
def api_pedidos_pendientes():
    return jsonify([
        {"id": 1, "codigo": "PED-1001"},
        {"id": 2, "codigo": "PED-1002"}
    ])

@inventario_bp.route('/api/pedidos/<int:pedido_id>/detalles')
def api_pedidos_detalles(pedido_id):
    return jsonify([
        {"id": 10, "producto_nombre": "Producto A", "cantidad_solicitada": 5},
        {"id": 11, "producto_nombre": "Producto B", "cantidad_solicitada": 2}
    ])

