# app/controllers/inventario_controller.py

from flask import abort
from flask_login import current_user
from sqlalchemy import func
from datetime import date
from decimal import Decimal
import random
import string

from app.extensions import db
from app.models import (
    Producto, ProductoProveedor, Pedido, DetallePedido, Lote, Stock,
    MovimientoInventario, Usuario
)  # Asumiendo que los modelos están en app.models y todos importados aquí

def generate_lote_codigo():
    """Genera un código de lote único, e.g., LOT-XXXXXX"""
    while True:
        code = 'LOT-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Lote.query.filter_by(lote_codigo=code).first():
            return code

def list_products():
    products = Producto.query.all()
    result = []
    for p in products:
        total_stock = db.session.query(func.sum(Stock.cantidad)).join(Lote).filter(Lote.producto_id == p.producto_id).scalar() or 0
        category_name = p.categoria.categoria_nombre if p.categoria else 'Sin categoría'
        result.append({
            'id': p.producto_id,
            'name': p.nombre,
            'category_name': category_name,
            'stock': float(total_stock),
            'price': float(p.preciounitario) if p.preciounitario else 0.0,
            'available': p.estado == 'activo' if p.estado else False,
            'image': ''  # No hay campo de imagen en el modelo, se deja vacío
        })
    return result

def get_product(id):
    return Producto.query.get_or_404(id)

def create_product(data):
    estado = data.get('estado')
    precio = data.get('precio')
    
    new_product = Producto(
        sku=data.get('sku'),
        nombre=data['nombre'],
        descripcion=data.get('descripcion'),
        preciounitario=precio if precio else None,
        estado=estado if estado else None,
        categoria_id=data.get('categoria_id')
    )
    db.session.add(new_product)
    db.session.commit()
    return new_product

def update_product(id, data):
    product = Producto.query.get_or_404(id)
    product.sku = data.get('sku', product.sku)
    product.nombre = data.get('nombre', product.nombre)
    product.descripcion = data.get('descripcion', product.descripcion)
    
    precio = data.get('precio')
    product.preciounitario = precio if precio else None
    
    estado = data.get('estado')
    product.estado = estado if estado else None
    
    product.categoria_id = data.get('categoria_id', product.categoria_id)
    db.session.commit()
    return product

def delete_product(id):
    product = Producto.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()

def list_asignaciones(product_id):
    asignaciones = ProductoProveedor.query.filter_by(producto_id=product_id).all()
    result = []
    for a in asignaciones:
        proveedor = a.proveedor
        result.append({
            'proveedor_id': a.proveedor_id,
            'proveedor_nombre': proveedor.proveedor_nombre if proveedor else 'Desconocido',
            'precio': float(a.precio_compra) if a.precio_compra else 0.0,
            'plazo': a.plazo_entrega_dias,
            'pedido_minimo': a.pedido_minimo,
            'preferido': a.preferido
        })
    return result

def get_asignacion(product_id, proveedor_id):
    return ProductoProveedor.query.get_or_404((product_id, proveedor_id))

def create_asignacion(data):
    producto_id = data['producto_id']
    preferido = data.get('preferido', False)
    
    if preferido:
        ProductoProveedor.query.filter_by(producto_id=producto_id, preferido=True).update({'preferido': False})
    
    new_asign = ProductoProveedor(
        producto_id=producto_id,
        proveedor_id=data['proveedor_id'],
        precio_compra=data.get('precio_compra'),
        plazo_entrega_dias=data.get('plazo_entrega'),
        pedido_minimo=data.get('pedido_minimo', 1),
        preferido=preferido
    )
    db.session.add(new_asign)
    db.session.commit()
    return new_asign

def update_asignacion(product_id, proveedor_id, data):
    asign = ProductoProveedor.query.get_or_404((product_id, proveedor_id))
    preferido = data.get('preferido', asign.preferido)
    
    if preferido and not asign.preferido:
        ProductoProveedor.query.filter(
            ProductoProveedor.producto_id == product_id,
            ProductoProveedor.proveedor_id != proveedor_id,
            ProductoProveedor.preferido == True
        ).update({'preferido': False})
    
    asign.precio_compra = data.get('precio_compra', asign.precio_compra)
    asign.plazo_entrega_dias = data.get('plazo_entrega', asign.plazo_entrega_dias)
    asign.pedido_minimo = data.get('pedido_minimo', asign.pedido_minimo)
    asign.preferido = preferido
    db.session.commit()
    return asign

def delete_asignacion(product_id, proveedor_id):
    asign = ProductoProveedor.query.get_or_404((product_id, proveedor_id))
    db.session.delete(asign)
    db.session.commit()

def list_pedidos_pendientes():
    pedidos = Pedido.query.filter_by(estado='pendiente').all()
    result = []
    for p in pedidos:
        proveedor = p.proveedor
        result.append({
            'id': p.pedido_id,
            'codigo': p.pedido_codigo,
            'fecha': p.pedido_fecha.isoformat() if p.pedido_fecha else None,
            'proveedor_nombre': proveedor.proveedor_nombre if proveedor else 'Sin proveedor'
        })
    return result

def list_detalles_pedido(pedido_id):
    detalles = DetallePedido.query.filter_by(pedido_id=pedido_id).all()
    result = []
    for d in detalles:
        product = d.producto
        result.append({
            'pedido_id': d.pedido_id,
            'producto_id': d.producto_id,
            'producto_nombre': product.nombre if product else 'Desconocido',
            'cantidad_solicitada': float(d.cantidad_solicitada) if d.cantidad_solicitada else 0.0,
            'precio_unitario': float(d.precio_unitario) if d.precio_unitario else 0.0
        })
    return result

def list_lotes(product_id):
    lotes = Lote.query.filter_by(producto_id=product_id).all()
    result = []
    for l in lotes:
        stock_cant = l.stock.cantidad if l.stock else 0.0
        result.append({
            'id': l.lote_id,
            'codigo': l.lote_codigo,
            'stock': float(stock_cant),
            'fecha_vencimiento': l.fecha_vencimiento.isoformat() if l.fecha_vencimiento else None
        })
    return result

def list_recepciones_pedido(pedido_id):
    """Lista todas las recepciones de un pedido específico"""
    try:
        movimientos = MovimientoInventario.query.filter_by(
            pedido_id=pedido_id,
            tipo_movimiento='recepcion_de_pedido'
        ).all()
        
        result = []
        for m in movimientos:
            try:
                producto = m.producto
                usuario = m.usuario
                lote = m.lote
                
                result.append({
                    'movimiento_id': m.movimiento_id,
                    'producto_id': m.producto_id,
                    'producto_nombre': producto.nombre if producto else 'Desconocido',
                    'cantidad_recibida': float(m.cantidad) if m.cantidad else 0.0,
                    'fecha': m.fecha.isoformat() if m.fecha else None,
                    'lote_codigo': lote.lote_codigo if lote else None,
                    'usuario': usuario.nombre if usuario else 'Desconocido'
                })
            except Exception as e:
                print(f"Error procesando movimiento {m.movimiento_id}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
                
        return result
    except Exception as e:
        print(f"Error en list_recepciones_pedido: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def create_movimiento(data):
    tipo = data.get('tipo_movimiento')
    producto_id = data.get('producto_id')
    lote_id = data.get('lote_id')
    pedido_id = data.get('pedido_id')
    nota = data.get('nota')
    usuario_id = current_user.usuario_id if current_user.is_authenticated else None

    if not usuario_id:
        abort(401, description="Usuario no autenticado")

    if not tipo or tipo not in ['recepcion_de_pedido', 'salida', 'ajuste', 'entrada', 'actualizacion_de_stock']:
        abort(400, description="Tipo de movimiento inválido")

    try:
        cantidad = Decimal(str(data.get('cantidad', 0)))
    except (ValueError, TypeError, Exception):
        abort(400, description="Cantidad inválida")

    if cantidad == 0:
        abort(400, description="La cantidad no puede ser 0")
    
    if tipo in ['recepcion_de_pedido', 'entrada', 'actualizacion_de_stock'] and cantidad <= 0:
        abort(400, description="La cantidad debe ser mayor que 0 para este tipo de movimiento")

    producto = Producto.query.get(producto_id)
    if not producto:
        abort(404, description="Producto no encontrado")

    try:
        mov = MovimientoInventario(
            producto_id=producto_id,
            lote_id=lote_id,
            tipo_movimiento=tipo,
            cantidad=cantidad,
            pedido_id=pedido_id,
            usuario_id=usuario_id,
            nota=nota
        )

        if tipo == 'recepcion_de_pedido':
            if not pedido_id:
                abort(400, description="Pedido requerido para recepción")
            
            lote_codigo_input = data.get('lote_codigo', '').strip()
            lote_codigo = lote_codigo_input if lote_codigo_input else generate_lote_codigo()
            fecha_fabricacion_str = data.get('fecha_fabricacion')
            fecha_vencimiento_str = data.get('fecha_vencimiento')

            fecha_fabricacion = None
            fecha_vencimiento = None

            try:
                if fecha_fabricacion_str:
                    fecha_fabricacion = date.fromisoformat(fecha_fabricacion_str)
                if fecha_vencimiento_str:
                    fecha_vencimiento = date.fromisoformat(fecha_vencimiento_str)
            except ValueError:
                abort(400, description="Fechas inválidas")

            if fecha_fabricacion and fecha_vencimiento and fecha_vencimiento < fecha_fabricacion:
                abort(400, description="Fecha de vencimiento anterior a fabricación")

            detalle = DetallePedido.query.filter_by(
                pedido_id=pedido_id,
                producto_id=producto_id
            ).first()
            
            if detalle:
                recibido_previo = db.session.query(func.sum(MovimientoInventario.cantidad)).filter(
                    MovimientoInventario.pedido_id == pedido_id,
                    MovimientoInventario.producto_id == producto_id,
                    MovimientoInventario.tipo_movimiento == 'recepcion_de_pedido'
                ).scalar() or Decimal('0')
                
                total_recibido = Decimal(str(recibido_previo)) + cantidad
                cantidad_solicitada = Decimal(str(detalle.cantidad_solicitada))
                
                print(f"DEBUG: Recibido previo: {recibido_previo}, Cantidad actual: {cantidad}, Total: {total_recibido}, Solicitado: {cantidad_solicitada}")
                
                if total_recibido > cantidad_solicitada:
                    abort(400, description=f"Cantidad recibida total ({total_recibido}) excede lo solicitado ({cantidad_solicitada}). Ya recibido: {recibido_previo}")

            lote = Lote(
                producto_id=producto_id,
                pedido_id=pedido_id,
                fecha_fabricacion=fecha_fabricacion,
                fecha_vencimiento=fecha_vencimiento,
                lote_codigo=lote_codigo
            )
            db.session.add(lote)
            db.session.flush()
            stock = Stock(lote_id=lote.lote_id, cantidad=cantidad, stock_minimo=0)
            db.session.add(stock)
            mov.lote_id = lote.lote_id
            
            db.session.add(mov)
            db.session.flush()

            detalles = DetallePedido.query.filter_by(pedido_id=pedido_id).all()
            complete = True
            for d in detalles:
                received = db.session.query(func.sum(MovimientoInventario.cantidad)).filter(
                    MovimientoInventario.pedido_id == pedido_id,
                    MovimientoInventario.producto_id == d.producto_id,
                    MovimientoInventario.tipo_movimiento == 'recepcion_de_pedido'
                ).scalar() or Decimal('0')
                if Decimal(str(received)) < Decimal(str(d.cantidad_solicitada)):
                    complete = False
                    break
            
            pedido = Pedido.query.get(pedido_id)
            if pedido and complete and pedido.estado != 'entregado':
                pedido.estado = 'entregado'

        else:
            if not lote_id:
                if cantidad > 0 and tipo in ['entrada', 'ajuste', 'actualizacion_de_stock']:
                    lote = Lote(
                        producto_id=producto_id,
                        lote_codigo=generate_lote_codigo()
                    )
                    db.session.add(lote)
                    db.session.flush()
                    stock = Stock(lote_id=lote.lote_id, cantidad=0, stock_minimo=0)
                    db.session.add(stock)
                    lote_id = lote.lote_id
                elif cantidad < 0 and tipo in ['salida', 'ajuste']:
                    lote_with_stock = Lote.query.join(Stock).filter(
                        Lote.producto_id == producto_id, Stock.cantidad > 0
                    ).first()
                    if not lote_with_stock:
                        abort(400, description="No hay stock disponible")
                    lote_id = lote_with_stock.lote_id
                    
            if lote_id:
                stock = Stock.query.filter_by(lote_id=lote_id).first()
                if not stock:
                    abort(404, description="Stock no encontrado")
                
                nueva_cantidad = Decimal(str(stock.cantidad)) + cantidad
                if nueva_cantidad < 0:
                    abort(400, description="Stock insuficiente para esta operación")
                    
                stock.cantidad = nueva_cantidad
                mov.lote_id = lote_id
            
            db.session.add(mov)

        db.session.commit()
        return mov
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        if hasattr(e, 'code'):
            raise
        abort(500, description=f"Error al crear movimiento: {str(e)}")