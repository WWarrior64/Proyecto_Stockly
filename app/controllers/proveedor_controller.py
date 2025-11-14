# app/controllers/proveedor_controller.py
from flask import abort
from app.extensions import db
from app.models import Proveedor  # Asumiendo que los modelos están en app/models/ y se importan así; ajusta según tu estructura real

def list_proveedores():
    return Proveedor.query.all()

def get_proveedor(id):
    prov = Proveedor.query.get(id)
    if not prov:
        abort(404, description="Proveedor no encontrado")
    return prov

def create_proveedor(data):
    if not data or 'proveedor_codigo' not in data or 'proveedor_nombre' not in data:
        abort(400, description="Datos inválidos")
    new_prov = Proveedor(
        proveedor_codigo=data['proveedor_codigo'],
        proveedor_nombre=data['proveedor_nombre'],
        numerotelefono=data.get('numerotelefono'),
        email=data.get('email'),
        direccion=data.get('direccion')
    )
    db.session.add(new_prov)
    db.session.commit()
    return new_prov

def update_proveedor(id, data):
    prov = get_proveedor(id)
    if 'proveedor_codigo' in data:
        prov.proveedor_codigo = data['proveedor_codigo']
    if 'proveedor_nombre' in data:
        prov.proveedor_nombre = data['proveedor_nombre']
    if 'numerotelefono' in data:
        prov.numerotelefono = data['numerotelefono']
    if 'email' in data:
        prov.email = data['email']
    if 'direccion' in data:
        prov.direccion = data['direccion']
    db.session.commit()
    return prov

def delete_proveedor(id):
    prov = get_proveedor(id)
    db.session.delete(prov)
    db.session.commit()