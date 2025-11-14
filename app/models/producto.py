from app.extensions import db

class Producto(db.Model):
    __tablename__ = 'Producto'
    __table_args__ = {'extend_existing': True}

    producto_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sku = db.Column(db.String(80), unique=True)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    preciounitario = db.Column(db.Numeric(12, 2))
    estado = db.Column(db.String(40))
    categoria_id = db.Column(db.Integer, db.ForeignKey('Categoria.categoria_id', onupdate='CASCADE', ondelete='SET NULL'))

    producto_proveedores = db.relationship('ProductoProveedor', backref='producto', lazy=True, cascade='all, delete-orphan')
    lotes = db.relationship('Lote', backref='producto', lazy=True, cascade='all, delete-orphan')
    detalle_pedidos = db.relationship('DetallePedido', backref='producto', lazy=True, cascade='all, delete-orphan')
    movimientos_inventario = db.relationship('MovimientoInventario', backref='producto', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Producto {self.nombre}>"