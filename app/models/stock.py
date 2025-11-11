from app.extensions import db

class Stock(db.Model):
    __tablename__ = 'Stock'
    __table_args__ = {'extend_existing': True}

    stock_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cantidad = db.Column(db.Numeric(12, 3), nullable=False, default=0)
    stock_minimo = db.Column(db.Numeric(12, 3), default=0)
    lote_id = db.Column(db.Integer, db.ForeignKey('Lote.lote_id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False, unique=True)

    def __repr__(self):
        return f"<Stock lote_id={self.lote_id} cantidad={self.cantidad}>"