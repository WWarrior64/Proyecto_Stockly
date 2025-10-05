# app/models/rol.py
from app.extensions import db

class Rol(db.Model):
    __tablename__ = 'Rol'

    rol_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)

    def __repr__(self):
        return f"<Rol {self.nombre}>"
