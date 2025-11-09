import time
from flask import url_for, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError

from app.models import Usuario, Rol  # Asumiendo SQLAlchemy
from app.extensions import db  # Importa db desde extensions.py
import os
from uuid import uuid4
from werkzeug.utils import secure_filename
from flask import current_app, url_for  # url_for ya importado en tu archivo

ALLOWED_AVATAR_EXT = {"png", "jpg", "jpeg", "gif", "webp"}  # añadí webp opcionalmente

def _allowed_avatar_filename(filename):
    if not filename or '.' not in filename:
        return False
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    return ext in ALLOWED_AVATAR_EXT

def _avatar_url_for(user):
    """
    Devuelve la URL pública del avatar del user.
    Si avatar es filename -> static/uploads/avatars/<filename>?v=<mtime>
    Si avatar ya es URL absoluta o empieza por '/' -> se devuelve tal cual.
    """
    avatar_field = getattr(user, "avatar", None)
    if not avatar_field:
        return url_for('static', filename='images/avatar_placeholder.png')

    # Si ya es URL absoluta -> devolverla
    if isinstance(avatar_field, str) and (avatar_field.startswith("http://") or avatar_field.startswith("https://")):
        return avatar_field

    # Si ya es un path absoluto (empieza con '/') -> devolverlo
    if isinstance(avatar_field, str) and avatar_field.startswith('/'):
        return avatar_field

    # Si es solo un nombre de archivo -> construimos ruta uploads + ?v=mtime
    filename = avatar_field
    upload_folder = current_app.config.get(
        "AVATAR_UPLOAD_PATH",
        os.path.join(current_app.root_path, "static", "uploads", "avatars")
    )
    file_path = os.path.join(upload_folder, secure_filename(filename))

    try:
        v = int(os.path.getmtime(file_path)) if os.path.exists(file_path) else int(time.time())
    except Exception:
        v = int(time.time())

    return url_for('static', filename=f'uploads/avatars/{filename}') + f'?v={v}'


# --- JSON helpers ---
def get_user_json(user):
    if not user or getattr(user, "usuario_id", None) is None:
        return {
            "usuario_id": None,
            "nombre": "",
            "apellido": "",
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

    nombre = getattr(user, "nombre", "") or ""
    apellido = getattr(user, "apellido", "") or ""

    return {
        "usuario_id": getattr(user, "usuario_id", None),
        "nombre": nombre,
        "apellido": apellido,
        "fullName": f"{nombre} {apellido}".strip() or getattr(user, "username", "") or "Usuario",
        "role": rol_nombre,
        "email": getattr(user, "email", ""),
        "address": getattr(user, "direccion", ""),
        "phone": getattr(user, "numerotelefono", ""),
        "avatar": _avatar_url_for(user),
        "extraFields": getattr(user, "extra_fields", []) or []
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

def save_user_avatar(user_id, file_storage):
    """
    Guarda el avatar (FileStorage) para el usuario dado y actualiza user.avatar con el filename.
    Retorna el filename guardado.
    Lanza ValueError en caso de validación.
    """
    if not file_storage:
        raise ValueError("No se proporcionó archivo.")

    filename = getattr(file_storage, "filename", None)
    if not filename:
        raise ValueError("Nombre de archivo inválido.")

    # Validar extension
    if not _allowed_avatar_filename(filename):
        raise ValueError("Tipo de archivo no permitido. Usa png/jpg/jpeg/gif (o webp).")

    # Validar mimetype básica (opcional pero recomendado)
    mimetype = getattr(file_storage, "mimetype", "") or ""
    if not mimetype.startswith("image/"):
        # algunos navegadores no siempre marcan el mimetype, así que no es 100% fiable
        current_app.logger.warning(f"Upload avatar: mimetype sospechoso ({mimetype}) para archivo {filename}")

    # generar nombre único
    ext = os.path.splitext(filename)[1].lower()
    new_name = f"{uuid4().hex}{ext}"

    # Ruta de upload configurable
    upload_folder = current_app.config.get(
        "AVATAR_UPLOAD_PATH",
        os.path.join(current_app.root_path, "static", "uploads", "avatars")
    )
    os.makedirs(upload_folder, exist_ok=True)

    save_path = os.path.join(upload_folder, secure_filename(new_name))
    try:
        file_storage.save(save_path)
        current_app.logger.info(f"Avatar guardado: user={user_id} path={save_path}")
    except Exception as e:
        current_app.logger.exception("Error guardando archivo de avatar.")
        raise ValueError("No se pudo guardar el avatar.") from e

    # Actualizar DB
    user = Usuario.query.get(user_id)
    if not user:
        # eliminar archivo si user no existe
        try:
            os.remove(save_path)
        except Exception:
            pass
        raise ValueError("Usuario no encontrado.")

    # eliminar avatar anterior (opcional)
    try:
        prev = getattr(user, "avatar", None)
        if prev:
            prev_path = os.path.join(upload_folder, secure_filename(prev))
            if os.path.exists(prev_path) and prev_path != save_path:
                try:
                    os.remove(prev_path)
                    current_app.logger.info(f"Avatar previo eliminado: {prev_path}")
                except Exception:
                    current_app.logger.warning(f"No se pudo eliminar avatar previo: {prev_path}")
    except Exception:
        pass

    # Guardamos sólo el nombre de archivo (no la ruta completa). get_user_json generará url con ?v
    user.avatar = new_name
    db.session.commit()
    current_app.logger.info(f"Avatar asociado al usuario {user_id}: filename={new_name}")

    return new_name