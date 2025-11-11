from app.extensions import db

class TipoPago(db.Model):
    __tablename__ = 'TipoPago'
    __table_args__ = {'extend_existing': True}

    tipo_pago_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)

    pedidos = db.relationship('Pedido', backref='tipo_pago', lazy=True)

    def __repr__(self):
        return f"<TipoPago {self.nombre}>"