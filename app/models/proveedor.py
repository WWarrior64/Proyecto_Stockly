from app.extensions import db

class Proveedor(db.Model):
    __tablename__ = 'Proveedor'
    __table_args__ = {'extend_existing': True}

    proveedor_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    proveedor_codigo = db.Column(db.String(80), unique=True)
    proveedor_nombre = db.Column(db.String(200), nullable=False)
    numerotelefono = db.Column(db.String(50))
    email = db.Column(db.String(200))
    direccion = db.Column(db.Text)

    producto_proveedores = db.relationship('ProductoProveedor', backref='proveedor', lazy=True)
    pedidos = db.relationship('Pedido', backref='proveedor', lazy=True)

    def __repr__(self):
        return f"<Proveedor {self.proveedor_nombre}>"