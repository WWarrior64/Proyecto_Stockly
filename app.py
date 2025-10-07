import os
from flask import Flask, redirect, url_for
from app.routes.main import main_bp
from app.routes.auth import auth_bp
from app.routes.inventario import inventario_bp
from app.routes.cuenta import cuenta_bp
from app.routes.pedidos import pedidos_bp
from app.routes.reportes import reportes_bp
from config import Config
from app.models import Usuario, Rol, Producto # Importa otros modelos según sea necesario #Importa el modelo aquí para evitar ciclos al inicio del módulo
from app.extensions import db, migrate, login_manager

# Configuración de rutas para archivos estáticos y plantillas


BASE_DIR = os.path.abspath(os.path.dirname(__file__))   # carpeta donde está el archivo app.py
STATIC_DIR = os.path.join(BASE_DIR, 'static')           # <proyecto>/static
TEMPLATE_DIR = os.path.join(BASE_DIR, 'app', 'templates')  # <proyecto>/app/templates

app = Flask(
    __name__, 
    static_folder=STATIC_DIR,
    template_folder=TEMPLATE_DIR
    )
# +++ Configuración para inicializar la Base de Datos +++
app.config.from_object(Config)
# Inicializar extensiones
db.init_app(app)
migrate.init_app(app, db)

# Inicializar Flask-Login
login_manager.init_app(app)
login_manager.login_view = "auth.login"

#-------------------------------------------------------------------------------
@login_manager.user_loader
def load_user(user_id):
    if not user_id:
        return None
    try:
        return Usuario.query.get(int(user_id))
    except Exception:
        return None
#------------------------------------------------------------------------------

app.register_blueprint(main_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(inventario_bp)
app.register_blueprint(cuenta_bp)
app.register_blueprint(pedidos_bp)
app.register_blueprint(reportes_bp)

@app.route("/")
def root():
    return redirect(url_for("auth.login"))

if __name__ == '__main__':
    app.run(debug=True)
