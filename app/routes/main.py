from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    return render_template('home.html')

@main_bp.route('/inventario')
def inventario():
    return render_template('inventario.html')

@main_bp.route('/login')
def login():
    return render_template('auth/login.html')
