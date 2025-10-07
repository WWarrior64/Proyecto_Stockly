# app/controllers/cuenta_controller.py
from flask import url_for

def get_user_json(user):
    """
    Formatea los datos del usuario actual para la API.
    Recibe el objeto `user` (instancia de Usuario).
    """
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

    return {
        "fullName": f"{getattr(user, 'nombre', '')} {getattr(user, 'apellido', '')}".strip(),
        "role": getattr(user, "rol", {}).nombre if getattr(user, "rol", None) else "Empleado",
        "email": getattr(user, "email", ""),
        "address": getattr(user, "direccion", ""),
        "phone": getattr(user, "numerotelefono", ""),
        "avatar": url_for('static', filename='images/Usuario_avatar.png'),
        "extraFields": []  # poblar con campos extra si existen en el modelo
    }
