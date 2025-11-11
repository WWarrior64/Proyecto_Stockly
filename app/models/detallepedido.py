from app.extensions import db

class DetallePedido(db.Model):
    __tablename__ = 'DetallePedido'
    __table_args__ = {'extend_existing': True}

    pedido_id = db.Column(db.Integer, db.ForeignKey('Pedido.pedido_id', onupdate='CASCADE', ondelete='CASCADE'), primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('Producto.producto_id', onupdate='CASCADE', ondelete='RESTRICT'), primary_key=True)
    cantidad_solicitada = db.Column(db.Numeric(12, 3), nullable=False)
    precio_unitario = db.Column(db.Numeric(12, 2))

    def __repr__(self):
        return f"<DetallePedido pedido_id={self.pedido_id} producto_id={self.producto_id}>"