from app.extensions import db

class Pedido(db.Model):
    __tablename__ = 'Pedido'
    __table_args__ = {'extend_existing': True}

    pedido_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pedido_codigo = db.Column(db.String(80), unique=True)
    pedido_fecha = db.Column(db.DateTime, default=db.func.current_timestamp())
    fecha_entrega = db.Column(db.Date)
    tipo_pedido = db.Column(db.String(50), default='compra')
    proveedor_id = db.Column(db.Integer, db.ForeignKey('Proveedor.proveedor_id', onupdate='CASCADE', ondelete='SET NULL'))
    tipo_pago_id = db.Column(db.Integer, db.ForeignKey('TipoPago.tipo_pago_id', onupdate='CASCADE', ondelete='SET NULL'))
    estado = db.Column(db.Enum('pendiente', 'entregado'), nullable=False, default='pendiente')

    detalle_pedidos = db.relationship('DetallePedido', backref='pedido', lazy=True)
    lotes = db.relationship('Lote', backref='pedido', lazy=True)
    movimientos_inventario = db.relationship('MovimientoInventario', backref='pedido', lazy=True)

    def __repr__(self):
        return f"<Pedido {self.pedido_codigo}>"