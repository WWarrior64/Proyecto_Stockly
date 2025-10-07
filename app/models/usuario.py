from app.extensions import db
from flask_login import UserMixin

class Usuario(db.Model, UserMixin):
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

    # UserMixin ya agrega is_authenticated, is_active, is_anonymous y get_id()
    # pero se puede definir get_id explícitamente si queremos asegurar el tipo:
    def get_id(self):
        # Flask-Login espera un identificador unicode/str
        return str(self.usuario_id)