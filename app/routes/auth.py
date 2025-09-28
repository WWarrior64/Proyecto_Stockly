from flask import Blueprint, redirect, render_template, request, url_for

auth_bp = Blueprint('auth', __name__, url_prefix="/auth")

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Aquí se pondrá la validación de usuario y contraseña
        return redirect(url_for('main.home'))
    return render_template('auth/login.html')

@auth_bp.route('/register')
def register():
    return render_template('auth/register.html')
