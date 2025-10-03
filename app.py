import os
from flask import Flask, redirect, url_for
from app.routes.main import main_bp
from app.routes.auth import auth_bp
from app.routes.inventario import inventario_bp
from app.routes.cuenta import cuenta_bp


BASE_DIR = os.path.abspath(os.path.dirname(__file__))   # carpeta donde está el archivo app.py
STATIC_DIR = os.path.join(BASE_DIR, 'static')           # <proyecto>/static
TEMPLATE_DIR = os.path.join(BASE_DIR, 'app', 'templates')  # <proyecto>/app/templates

app = Flask(
    __name__, 
    static_folder=STATIC_DIR,
    template_folder=TEMPLATE_DIR
    )
app.register_blueprint(main_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(inventario_bp)
app.register_blueprint(cuenta_bp)


@app.route("/")
def root():
    return redirect(url_for("auth.login"))

if __name__ == '__main__':
    app.run(debug=True)
