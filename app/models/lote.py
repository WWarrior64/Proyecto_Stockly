from app.extensions import db

class Lote(db.Model):
    __tablename__ = 'Lote'
    __table_args__ = {'extend_existing': True}

    lote_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('Producto.producto_id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False)
    pedido_id = db.Column(db.Integer, db.ForeignKey('Pedido.pedido_id', onupdate='CASCADE', ondelete='SET NULL'))
    fecha_fabricacion = db.Column(db.Date)
    fecha_vencimiento = db.Column(db.Date)
    lote_codigo = db.Column(db.String(150), unique=True)

    stock = db.relationship('Stock', backref='lote', uselist=False, lazy=True)
    movimientos_inventario = db.relationship('MovimientoInventario', backref='lote', lazy=True)

    def __repr__(self):
        return f"<Lote {self.lote_codigo}>"