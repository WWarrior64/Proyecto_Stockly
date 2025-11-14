#app/routes/configuraciones.py
from flask import Blueprint, render_template, request, jsonify
from app.controllers.categoria_controller import list_categorias, get_categoria, create_categoria, update_categoria, delete_categoria
from app.controllers.proveedor_controller import list_proveedores, get_proveedor, create_proveedor, update_proveedor, delete_proveedor

config_bp = Blueprint('configuraciones', __name__, url_prefix='/configuraciones')

@config_bp.route('/proveedores')
def proveedores():
    return render_template('configuraciones/proveedores/proveedores.html')

@config_bp.route('/categorias')
def categorias():
    return render_template('configuraciones/categorias/categorias.html')

@config_bp.route('/api/categorias', methods=['GET'])
def api_list_categorias():
    cats = list_categorias()
    return jsonify([
        {
            'id': c.categoria_id,
            'nombre': c.categoria_nombre,
            'descripcion': c.descripcion or ''
        } for c in cats
    ])

@config_bp.route('/api/categorias/<int:id>', methods=['GET'])
def api_get_categoria(id):
    cat = get_categoria(id)
    return jsonify({
        'id': cat.categoria_id,
        'nombre': cat.categoria_nombre,
        'descripcion': cat.descripcion or ''
    })

@config_bp.route('/api/categorias', methods=['POST'])
def api_create_categoria():
    data = request.json
    new_cat = create_categoria(data)
    return jsonify({
        'id': new_cat.categoria_id,
        'nombre': new_cat.categoria_nombre,
        'descripcion': new_cat.descripcion or ''
    }), 201

@config_bp.route('/api/categorias/<int:id>', methods=['PUT'])
def api_update_categoria(id):
    data = request.json
    updated_cat = update_categoria(id, data)
    return jsonify({
        'id': updated_cat.categoria_id,
        'nombre': updated_cat.categoria_nombre,
        'descripcion': updated_cat.descripcion or ''
    })

@config_bp.route('/api/categorias/<int:id>', methods=['DELETE'])
def api_delete_categoria(id):
    delete_categoria(id)
    return '', 204

@config_bp.route('/api/proveedores', methods=['GET'])
def api_list_proveedores():
    provs = list_proveedores()
    return jsonify([
        {
            'proveedor_id': p.proveedor_id,
            'proveedor_codigo': p.proveedor_codigo,
            'proveedor_nombre': p.proveedor_nombre,
            'numerotelefono': p.numerotelefono or '',
            'email': p.email or '',
            'direccion': p.direccion or ''
        } for p in provs
    ])

@config_bp.route('/api/proveedores/<int:id>', methods=['GET'])
def api_get_proveedor(id):
    prov = get_proveedor(id)
    return jsonify({
        'proveedor_id': prov.proveedor_id,
        'proveedor_codigo': prov.proveedor_codigo,
        'proveedor_nombre': prov.proveedor_nombre,
        'numerotelefono': prov.numerotelefono or '',
        'email': prov.email or '',
        'direccion': prov.direccion or ''
    })

@config_bp.route('/api/proveedores', methods=['POST'])
def api_create_proveedor():
    data = request.json
    new_prov = create_proveedor(data)
    return jsonify({
        'proveedor_id': new_prov.proveedor_id,
        'proveedor_codigo': new_prov.proveedor_codigo,
        'proveedor_nombre': new_prov.proveedor_nombre,
        'numerotelefono': new_prov.numerotelefono or '',
        'email': new_prov.email or '',
        'direccion': new_prov.direccion or ''
    }), 201

@config_bp.route('/api/proveedores/<int:id>', methods=['PUT'])
def api_update_proveedor(id):
    data = request.json
    updated_prov = update_proveedor(id, data)
    return jsonify({
        'proveedor_id': updated_prov.proveedor_id,
        'proveedor_codigo': updated_prov.proveedor_codigo,
        'proveedor_nombre': updated_prov.proveedor_nombre,
        'numerotelefono': updated_prov.numerotelefono or '',
        'email': updated_prov.email or '',
        'direccion': updated_prov.direccion or ''
    })

@config_bp.route('/api/proveedores/<int:id>', methods=['DELETE'])
def api_delete_proveedor(id):
    delete_proveedor(id)
    return '', 204