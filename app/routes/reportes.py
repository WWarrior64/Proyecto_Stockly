# app/routes/reportes.py (updated with API)
from flask import Blueprint, render_template, jsonify
from app.controllers.reportes_controller import get_stats

reportes_bp = Blueprint('reportes', __name__, url_prefix='/reportes')

@reportes_bp.route('/', methods=['GET'])
def reportes():
    """Página principal de reportes"""
    return render_template('reportes/reportes.html')

@reportes_bp.route('/api/stats', methods=['GET'])
def api_stats():
    stats = get_stats()
    return jsonify(stats)