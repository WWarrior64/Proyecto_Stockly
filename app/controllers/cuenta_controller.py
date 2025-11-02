from flask import url_for, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError

from app.models import Usuario, Rol  # Asumiendo SQLAlchemy
from app.extensions import db  # Importa db desde extensions.py


def _avatar_url_for(user):
    avatar_field = getattr(user, "avatar", None)
    if avatar_field:
        if avatar_field.startswith("http://") or avatar_field.startswith("https://"):
            return avatar_field
        return url_for('static', filename=f'images/{avatar_field}')
    return url_for('static', filename='images/avatar_placeholder.png')


def get_user_json(user):
    if not user or getattr(user, "usuario_id", None) is None:
        return {
            "fullName": "Invitado",
            "role": "Invitado",
            "email": "Ninguno",
            "address": "Ninguno",
            "phone": "Ninguno",
            "avatar": url_for('static', filename='images/avatar_placeholder.png'),
            "extraFields": []
        }

    rol_nombre = "Empleado"
    if getattr(user, "rol", None):
        try:
            rol_nombre = user.rol.nombre
        except Exception:
            rol_nombre = str(user.rol)

    extra_fields = getattr(user, "extra_fields", []) or []

    return {
        "usuario_id": getattr(user, "usuario_id", None),
        "fullName": f"{getattr(user, 'nombre', '')} {getattr(user, 'apellido', '')}".strip(),
        "role": rol_nombre,
        "email": getattr(user, "email", ""),
        "address": getattr(user, "direccion", ""),
        "phone": getattr(user, "numerotelefono", ""),
        "avatar": _avatar_url_for(user),
        "extraFields": extra_fields
    }


def get_users_json():
    """
    Devuelve lista de usuarios en JSON con campos suficientes para editar.
    """
    users = Usuario.query.all()
    resultado = []
    for u in users:
        rol_nombre = "Sin rol"
        try:
            if getattr(u, "rol", None):
                rol_nombre = u.rol.nombre
        except Exception:
            rol_nombre = str(u.rol)

        resultado.append({
            "usuario_id": u.usuario_id,
            "nombre": getattr(u, "nombre", ""),
            "apellido": getattr(u, "apellido", ""),
            "email": getattr(u, "email", ""),
            "numerotelefono": getattr(u, "numerotelefono", "") or "",
            "direccion": getattr(u, "direccion", "") or "",
            "rol_id": getattr(u, "rol_id", None),
            "rol_nombre": rol_nombre
        })
    return resultado


def get_user_by_id(id):
    return Usuario.query.get(id)


def create_user(data):
    if not data.get('nombre') or not data.get('email') or not data.get('contrasena'):
        raise ValueError("Faltan campos obligatorios: 'nombre', 'email' o 'contrasena'.")

    hashed = generate_password_hash(data['contrasena'])

    nuevo = Usuario(
        nombre=data['nombre'],
        apellido=data.get('apellido', ''),
        numerotelefono=data.get('numerotelefono', ''),
        email=data['email'],
        direccion=data.get('direccion', ''),
        contrasena=hashed,
        rol_id=data.get('rol_id')
    )
    db.session.add(nuevo)
    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.exception("Error creando usuario - posible duplicado.")
        raise ValueError("No se pudo crear el usuario (dato duplicado o error de integridad).") from e

    return nuevo.usuario_id


def update_user(id, data):
    user = Usuario.query.get(id)
    if not user:
        raise ValueError("Usuario no encontrado.")

    user.nombre = data.get('nombre', user.nombre)
    user.apellido = data.get('apellido', user.apellido)
    user.numerotelefono = data.get('numerotelefono', user.numerotelefono)
    user.email = data.get('email', user.email)
    user.direccion = data.get('direccion', user.direccion)
    if 'contrasena' in data and data['contrasena']:
        user.contrasena = generate_password_hash(data['contrasena'])
    user.rol_id = data.get('rol_id', user.rol_id)

    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.exception("Error actualizando usuario.")
        raise ValueError("No se pudo actualizar el usuario (error de integridad).") from e

    return True


def delete_user(id):
    user = Usuario.query.get(id)
    if user:
        db.session.delete(user)
        db.session.commit()
        return True
    return False


def get_roles_json():
    roles = Rol.query.all()
    return [{"rol_id": r.rol_id, "nombre": r.nombre} for r in roles]


def create_role(data):
    if not data.get('nombre'):
        raise ValueError("El nombre del rol es obligatorio.")
    nuevo = Rol(nombre=data['nombre'])
    db.session.add(nuevo)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ValueError("No se pudo crear el rol (posible duplicado).")
    return nuevo.rol_id


def update_role(id, data):
    rol = Rol.query.get(id)
    if rol:
        rol.nombre = data.get('nombre', rol.nombre)
        db.session.commit()
        return True
    raise ValueError("Rol no encontrado.")


def delete_role(id):
    rol = Rol.query.get(id)
    if rol:
        db.session.delete(rol)
        db.session.commit()
        return True
    return False


def is_admin(user):
    if not user or getattr(user, "is_authenticated", False) is False:
        return False
    try:
        r = getattr(user, "rol", None)
        if r and getattr(r, "nombre", "").lower() in ("admin", "administrador", "superuser"):
            return True
    except Exception:
        pass
    return False
