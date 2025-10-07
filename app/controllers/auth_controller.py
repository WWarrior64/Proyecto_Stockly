from app.models.usuario import Usuario
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError

def registrar_usuario(form_data):
    contrasena_hash = generate_password_hash(form_data['contrasena'], method='scrypt')
    usuario = Usuario(
        nombre=form_data['nombre'],
        apellido=form_data.get('apellido'),
        numerotelefono=form_data.get('telefono'),
        direccion=form_data.get('direccion'),
        email=form_data['email'],
        contrasena=contrasena_hash
    )
    db.session.add(usuario)
    db.session.commit()
    return usuario

def autenticar_usuario(email, password):
    usuario = Usuario.query.filter_by(email=email).first()
    if usuario and check_password_hash(usuario.contrasena, password):
        return usuario
    return None
