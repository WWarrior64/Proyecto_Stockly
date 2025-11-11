from app.extensions import db

class Categoria(db.Model):
    __tablename__ = 'Categoria'
    __table_args__ = {'extend_existing': True}

    categoria_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    categoria_nombre = db.Column(db.String(150), nullable=False)
    descripcion = db.Column(db.Text)

    productos = db.relationship('Producto', backref='categoria', lazy=True)

    def __repr__(self):
        return f"<Categoria {self.categoria_nombre}>"