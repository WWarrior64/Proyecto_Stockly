# app/controllers/categoria_controller.py
from flask import abort
from app.extensions import db
from app.models.categoria import Categoria  # Asumiendo que los modelos están en app/models/ y se importan así; ajusta según tu estructura real

def list_categorias():
    return Categoria.query.all()

def get_categoria(id):
    cat = Categoria.query.get(id)
    if not cat:
        abort(404, description="Categoría no encontrada")
    return cat

def create_categoria(data):
    if not data or 'nombre' not in data:
        abort(400, description="Datos inválidos")
    new_cat = Categoria(
        categoria_nombre=data['nombre'],
        descripcion=data.get('descripcion')
    )
    db.session.add(new_cat)
    db.session.commit()
    return new_cat

def update_categoria(id, data):
    cat = get_categoria(id)
    if 'nombre' in data:
        cat.categoria_nombre = data['nombre']
    if 'descripcion' in data:
        cat.descripcion = data['descripcion']
    db.session.commit()
    return cat

def delete_categoria(id):
    cat = get_categoria(id)
    db.session.delete(cat)
    db.session.commit()