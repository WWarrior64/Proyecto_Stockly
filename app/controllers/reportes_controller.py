# app/controllers/reportes_controller.py
from datetime import datetime
from dateutil.relativedelta import relativedelta
from flask import abort
from sqlalchemy import func, desc
from app.extensions import db
from app.models import Categoria, Producto, Proveedor, Pedido, DetallePedido, Lote, Stock, MovimientoInventario

def get_stats():
    indicators = get_indicators()
    donut_data = get_category_distribution()
    bar_data = get_top_providers()
    line_data = get_monthly_movements()
    return {
        'indicators': indicators,
        'donut': donut_data,
        'bar': bar_data,
        'line': line_data
    }

def get_indicators():
    # Disponibilidad basada en productos activos
    total_productos = db.session.query(func.count(Producto.producto_id)).scalar() or 0
    productos_activos = db.session.query(func.count(Producto.producto_id)).filter(Producto.estado == 'activo').scalar() or 0
    availability = round((productos_activos / total_productos * 100) if total_productos else 0)

    # Total inventory value (FIXED: Use select_from and relationships)
    total_value = db.session.query(func.sum(Producto.preciounitario * Stock.cantidad)) \
                             .select_from(Stock) \
                             .join(Stock.lote) \
                             .join(Lote.producto) \
                             .scalar() or 0
    total_value = round(float(total_value), 2)  # Cambié a 2 decimales para valores monetarios; ajusta si necesitas 3

    # Average lot age in years
    current_date = func.curdate()
    avg_age_days = db.session.query(func.avg(func.datediff(current_date, Lote.fecha_fabricacion))).filter(Lote.fecha_fabricacion.isnot(None)).scalar() or 0
    avg_age_years = round(avg_age_days / 365)

    return {
        'availability': availability,
        'total_value': total_value,
        'avg_age': avg_age_years
    }

def get_category_distribution():
    results = db.session.query(Categoria.categoria_nombre, func.count(Producto.producto_id)).outerjoin(Producto, Categoria.categoria_id == Producto.categoria_id).group_by(Categoria.categoria_id).all()
    labels = [row[0] for row in results]
    data = [row[1] for row in results]
    return {'labels': labels, 'data': data}

def get_top_providers():
    top_provs = db.session.query(
        Proveedor.proveedor_nombre,
        func.count(Pedido.pedido_id),
        func.sum(DetallePedido.cantidad_solicitada)
    ).outerjoin(Pedido, Proveedor.proveedor_id == Pedido.proveedor_id
    ).outerjoin(DetallePedido, Pedido.pedido_id == DetallePedido.pedido_id
    ).group_by(Proveedor.proveedor_id
    ).order_by(desc(func.count(Pedido.pedido_id))
    ).limit(3).all()

    labels = [row[0] for row in top_provs]
    orders = [row[1] for row in top_provs]
    quantities = [float(row[2] or 0) for row in top_provs]

    return {
        'labels': labels,
        'datasets': [
            {'label': 'Número de Pedidos', 'data': orders},
            {'label': 'Cantidad Total', 'data': quantities}
        ]
    }

def get_monthly_movements():
    current = datetime.now()
    labels = []
    entries = []
    exits = []
    for i in range(5, -1, -1):
        month_start = current - relativedelta(months=i)
        month_end = month_start + relativedelta(months=1)
        label = month_start.strftime('%b')
        labels.append(label)

        entry_count = db.session.query(func.count(MovimientoInventario.movimiento_id)).filter(
            MovimientoInventario.tipo_movimiento.in_(['entrada', 'recepcion_de_pedido', 'actualizacion_de_stock']),
            MovimientoInventario.fecha.between(month_start, month_end)
        ).scalar() or 0

        exit_count = db.session.query(func.count(MovimientoInventario.movimiento_id)).filter(
            MovimientoInventario.tipo_movimiento.in_(['salida']),
            MovimientoInventario.fecha.between(month_start, month_end)
        ).scalar() or 0

        entries.append(entry_count)
        exits.append(exit_count)

    return {
        'labels': labels,
        'datasets': [
            {'label': 'Entradas', 'data': entries},
            {'label': 'Salidas', 'data': exits}
        ]
    }