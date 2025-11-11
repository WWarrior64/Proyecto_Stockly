# app/controllers/pedido_controller.py
from app.extensions import db
from app.models import Pedido, DetallePedido, Proveedor, TipoPago, Producto, ProductoProveedor, Lote, Stock, MovimientoInventario
from sqlalchemy.orm import joinedload
import datetime

def list_pedidos():
    pedidos = Pedido.query.options(
        joinedload(Pedido.proveedor),
        joinedload(Pedido.detalle_pedidos)
    ).all()
    result = []
    for p in pedidos:
        cantidad = sum(d.cantidad_solicitada for d in p.detalle_pedidos)
        total = sum(d.cantidad_solicitada * (d.precio_unitario or 0) for d in p.detalle_pedidos)
        result.append({
            'id': p.pedido_id,
            'codigo': p.pedido_codigo,
            'proveedor_nombre': p.proveedor.proveedor_nombre if p.proveedor else '',
            'fecha': p.pedido_fecha.isoformat() if p.pedido_fecha else '',
            'cantidad': cantidad,
            'total': total,
            'estado': p.estado
        })
    return result

def get_pedido(id):
    pedido = Pedido.query.options(
        joinedload(Pedido.proveedor),
        joinedload(Pedido.tipo_pago),
        joinedload(Pedido.detalle_pedidos)
    ).get_or_404(id)
    detalles = [{
        'producto_id': d.producto_id,
        'cantidad': d.cantidad_solicitada,
        'precio_unitario': d.precio_unitario
    } for d in pedido.detalle_pedidos]
    return {
        'id': pedido.pedido_id,
        'codigo': pedido.pedido_codigo,
        'fecha': pedido.pedido_fecha.isoformat() if pedido.pedido_fecha else '',
        'estado': pedido.estado,
        'proveedor_id': pedido.proveedor_id,
        'tipo_pago_id': pedido.tipo_pago_id,
        'detalles': detalles
    }

def create_pedido(data):
    if not data or not data.get('proveedor_id'):
        raise ValueError('Proveedor requerido')
    pedido = Pedido(
        pedido_codigo=data.get('codigo'),
        estado=data.get('estado', 'pendiente'),
        proveedor_id=data['proveedor_id'],
        tipo_pago_id=data.get('tipo_pago_id')
    )
    db.session.add(pedido)
    db.session.commit()
    if not pedido.pedido_codigo:
        pedido.pedido_codigo = f'PED-{pedido.pedido_id:06d}'
        db.session.commit()
    detalles = data.get('detalles', [])
    if not detalles:
        raise ValueError('Al menos un detalle requerido')
    for det in detalles:
        if not det.get('producto_id') or not det.get('cantidad'):
            continue
        detalle = DetallePedido(
            pedido_id=pedido.pedido_id,
            producto_id=det['producto_id'],
            cantidad_solicitada=det['cantidad'],
            precio_unitario=det.get('precio_unitario')
        )
        db.session.add(detalle)
    db.session.commit()
    return {'id': pedido.pedido_id, 'codigo': pedido.pedido_codigo}

def update_pedido(id, data):
    pedido = Pedido.query.get_or_404(id)
    if not data:
        raise ValueError('Datos requeridos')
    if 'proveedor_id' in data:
        pedido.proveedor_id = data['proveedor_id']
    if 'tipo_pago_id' in data:
        pedido.tipo_pago_id = data['tipo_pago_id']
    if 'estado' in data:
        pedido.estado = data['estado']
    if 'codigo' in data:
        pedido.pedido_codigo = data['codigo']
    DetallePedido.query.filter_by(pedido_id=id).delete()
    detalles = data.get('detalles', [])
    for det in detalles:
        if not det.get('producto_id') or not det.get('cantidad'):
            continue
        detalle = DetallePedido(
            pedido_id=pedido.pedido_id,
            producto_id=det['producto_id'],
            cantidad_solicitada=det['cantidad'],
            precio_unitario=det.get('precio_unitario')
        )
        db.session.add(detalle)
    db.session.commit()
    return {'id': pedido.pedido_id, 'codigo': pedido.pedido_codigo}

def list_proveedores():
    proveedores = Proveedor.query.all()
    return [{'id': p.proveedor_id, 'nombre': p.proveedor_nombre} for p in proveedores]

def list_tipo_pagos():
    tipos = TipoPago.query.all()
    return [{'id': t.tipo_pago_id, 'nombre': t.nombre} for t in tipos]

def list_productos():
    productos = Producto.query.all()
    return [{'id': p.producto_id, 'nombre': p.nombre, 'preciounitario': p.preciounitario} for p in productos]

def get_producto_proveedor_precio(producto_id, proveedor_id):
    pp = ProductoProveedor.query.filter_by(producto_id=producto_id, proveedor_id=proveedor_id).first()
    if pp and pp.precio_compra is not None:
        return {'precio': pp.precio_compra}
    return {'precio': None}

def registrar_recepcion(id, user_id):
    pedido = Pedido.query.options(joinedload(Pedido.detalle_pedidos)).get_or_404(id)
    if pedido.estado == 'entregado':
        raise ValueError('Pedido ya entregado')
    pedido.estado = 'entregado'
    for det in pedido.detalle_pedidos:
        lote_codigo = f'LOT-{det.producto_id}-{pedido.pedido_id}-{datetime.datetime.now().strftime("%Y%m%d%H%M%S")}'
        lote = Lote(
            producto_id=det.producto_id,
            pedido_id=pedido.pedido_id,
            fecha_fabricacion=datetime.date.today(),
            fecha_vencimiento=None,
            lote_codigo=lote_codigo
        )
        db.session.add(lote)
        db.session.commit()
        stock = Stock(
            cantidad=det.cantidad_solicitada,
            stock_minimo=0,
            lote_id=lote.lote_id
        )
        db.session.add(stock)
        mov = MovimientoInventario(
            producto_id=det.producto_id,
            lote_id=lote.lote_id,
            tipo_movimiento='recepcion',
            cantidad=det.cantidad_solicitada,
            pedido_id=pedido.pedido_id,
            usuario_id=user_id,
            nota='Recepción de pedido'
        )
        db.session.add(mov)
    db.session.commit()
    return {'success': True}