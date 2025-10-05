from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.controllers.auth_controller import registrar_usuario, autenticar_usuario

auth_bp = Blueprint('auth', __name__, url_prefix="/auth")

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['contrasena']
        usuario = autenticar_usuario(email, password)
        if usuario:
            session['user_id'] = usuario.usuario_id
            session['user_name'] = usuario.nombre
            flash('Inicio de sesión exitoso', 'success')
            return redirect(url_for('main.home'))
        else:
            flash('Email o contraseña incorrectos', 'danger')
    return render_template('auth/login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        registrar_usuario(request.form)
        flash('Usuario registrado exitosamente', 'success')
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html')
