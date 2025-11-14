from app.extensions import db

class MovimientoInventario(db.Model):
    __tablename__ = 'MovimientoInventario'
    __table_args__ = {'extend_existing': True}

    movimiento_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('Producto.producto_id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False)
    lote_id = db.Column(db.Integer, db.ForeignKey('Lote.lote_id', onupdate='CASCADE', ondelete='SET NULL'))
    tipo_movimiento = db.Column(db.String(60), nullable=False)
    cantidad = db.Column(db.Numeric(12, 3), nullable=False)
    fecha = db.Column(db.DateTime, default=db.func.current_timestamp())
    pedido_id = db.Column(db.Integer, db.ForeignKey('Pedido.pedido_id', onupdate='CASCADE', ondelete='SET NULL'))
    usuario_id = db.Column(db.Integer, db.ForeignKey('Usuario.usuario_id', onupdate='CASCADE', ondelete='SET NULL'))
    nota = db.Column(db.Text)

    def __repr__(self):
        return f"<MovimientoInventario {self.movimiento_id} tipo={self.tipo_movimiento}>"