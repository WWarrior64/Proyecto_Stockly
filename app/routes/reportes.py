# app/routes/reportes.py
from flask import Blueprint, render_template

reportes_bp = Blueprint('reportes', __name__, url_prefix='/reportes')

@reportes_bp.route('/', methods=['GET'])
def reportes():
    """Página principal de reportes"""
    return render_template('reportes/reportes.html')
