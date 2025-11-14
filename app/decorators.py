from functools import wraps
from flask import jsonify
from flask_login import current_user

def api_login_required(f):
    """
    Decorador para rutas de API que requieren autenticación.
    Devuelve JSON en lugar de redirigir cuando el usuario no está autenticado.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'description': 'Autenticación requerida. Por favor, inicia sesión.'}), 401
        return f(*args, **kwargs)
    return decorated_function
