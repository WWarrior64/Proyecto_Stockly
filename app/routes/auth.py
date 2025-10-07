from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app.controllers.auth_controller import registrar_usuario, autenticar_usuario
from app.models.usuario import Usuario
from app.extensions import db

auth_bp = Blueprint('auth', __name__, url_prefix="/auth")

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
        # si ya está logueado, redirigir al home
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
    
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['contrasena']
        usuario = autenticar_usuario(email, password)
        if usuario:
            #Para flask-login:
            try:
                login_user(usuario)
            except Exception:

                pass

            flash('Inicio de sesión exitoso.', 'success')
            return redirect(url_for('main.home')) 
        else:
            # no existe o contraseña incorrecta
            flash('Correo o contraseña incorrectos.', 'danger')
            # volver a mostrar la página con el mensaje
    return render_template('auth/login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()

        # chequeo básico de existencia antes de llamar al controlador
        if Usuario.query.filter_by(email=email).first():
            flash('Ya existe un usuario con ese correo.', 'warning')
            return redirect(url_for('auth.register'))

        try:
            usuario = registrar_usuario(request.form)
        except Exception as e:
            # captura errores del controlador (por ejemplo constraints DB)
            flash(f'Error al crear el usuario: {str(e)}', 'danger')
            return redirect(url_for('auth.register'))

        flash('Usuario registrado exitosamente. Por favor inicia sesión.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('auth/register.html')

@auth_bp.route('/logout', methods=['POST', 'GET'])
@login_required
def logout():
    # Hacemos logout para POST (recomendado) y GET (compatibilidad)
    logout_user()
    flash('Sesión cerrada', 'info')
    return redirect(url_for('auth.login'))