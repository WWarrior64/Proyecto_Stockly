from app.extensions import db

class ProductoProveedor(db.Model):
    __tablename__ = 'ProductoProveedor'
    __table_args__ = {'extend_existing': True}

    producto_id = db.Column(db.Integer, db.ForeignKey('Producto.producto_id', onupdate='CASCADE', ondelete='CASCADE'), primary_key=True)
    proveedor_id = db.Column(db.Integer, db.ForeignKey('Proveedor.proveedor_id', onupdate='CASCADE', ondelete='CASCADE'), primary_key=True)
    precio_compra = db.Column(db.Numeric(12, 2))
    plazo_entrega_dias = db.Column(db.Integer)
    pedido_minimo = db.Column(db.Integer, default=1)
    activo = db.Column(db.Boolean, default=True)
    fecha_actualizacion = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    preferido = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<ProductoProveedor producto_id={self.producto_id} proveedor_id={self.proveedor_id}>"