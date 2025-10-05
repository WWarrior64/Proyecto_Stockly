from app.extensions import db

class Usuario(db.Model):
    __tablename__ = 'Usuario'  # Debe coincidir exactamente con el nombre de la tabla en MySQL

    usuario_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(150), nullable=False)
    apellido = db.Column(db.String(150))
    numerotelefono = db.Column(db.String(50))
    email = db.Column(db.String(200))
    direccion = db.Column(db.Text)
    contrasena = db.Column(db.String(255))
    rol_id = db.Column(db.Integer, db.ForeignKey('Rol.rol_id', onupdate='CASCADE', ondelete='SET NULL'))

    rol = db.relationship('Rol', backref='usuarios', lazy=True)

    def __repr__(self):
        return f"<Usuario {self.nombre} {self.apellido}>"
