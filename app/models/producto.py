from app.extensions import db

class Producto(db.Model):
    __tablename__ = 'Producto'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(150), nullable=False)
    precio = db.Column(db.Float, nullable=False)
