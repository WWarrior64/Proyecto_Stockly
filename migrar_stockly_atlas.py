import os
from dotenv import load_dotenv
import pymysql
from pymongo import MongoClient, ReplaceOne
from decimal import Decimal
from dateutil import parser

# ------------------- CONFIGURACIÓN -------------------
MYSQL_HOST = "johnny.heliohost.org"
MYSQL_USER = "wwarrior64_Walter"
MYSQL_PASS = "OrderHelio64#"
MYSQL_DB   = "wwarrior64_StocklyDB"

MONGO_URI  = "mongodb+srv://dragonGroup_db_user:dragonwarMan6446Q#@stocklydb.07fbddx.mongodb.net/?appName=StocklyDB"
MONGO_DB   = "stockly"

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]

BATCH_SIZE = 1000

# ------------------- HELPERS -------------------
def clean_value(v, field_name=""):
    from datetime import date, datetime
    
    if v in (None, '', 'NULL'):
        return None
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, date) and not isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, datetime):
        return v.isoformat()
    if field_name in ['fecha_fabricacion', 'fecha_vencimiento', 'pedido_fecha', 'fecha', 'fecha_entrega']:
        try:
            return parser.parse(str(v)).isoformat()
        except:
            return None
    return v

def clean_row(row):
    return {k: clean_value(v, k) for k, v in row.items()}

def to_bool(value):
    """Convierte valores de base de datos a booleano de forma segura"""
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value == 1
    if isinstance(value, str):
        return value.lower() in ('1', 'true', 'yes')
    return bool(value)

# ------------------- VALIDACIÓN DE CONEXIONES -------------------
def validate_mysql_connection():
    """Valida conexión a MySQL"""
    try:
        conn = mysql_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        conn.close()
        print("✓ Conexión MySQL validada")
        return True
    except Exception as e:
        print(f"✗ Error en conexión MySQL: {e}")
        return False

def validate_mongo_connection():
    """Valida conexión a MongoDB"""
    try:
        client.admin.command('ping')
        print("✓ Conexión MongoDB validada")
        return True
    except Exception as e:
        print(f"✗ Error en conexión MongoDB: {e}")
        return False

# ------------------- CONEXIÓN MYSQL -------------------
def mysql_conn():
    return pymysql.connect(
        host=MYSQL_HOST, user=MYSQL_USER, password=MYSQL_PASS,
        db=MYSQL_DB, cursorclass=pymysql.cursors.DictCursor
    )

# ------------------- MIGRACIONES SIMPLES -------------------
def migrate_simple(table, collection, id_field):
    try:
        print(f"Migrando {table} → {collection}")
        coll = db[collection]
        with mysql_conn() as conn, conn.cursor() as cur:
            cur.execute(f"SELECT * FROM {table}")
            rows = cur.fetchall()
            ops = []
            for row in rows:
                doc = clean_row(row)
                doc['_id'] = doc.pop(id_field)
                ops.append(ReplaceOne({'_id': doc['_id']}, doc, upsert=True))
                if len(ops) >= BATCH_SIZE:
                    coll.bulk_write(ops)
                    ops.clear()
            if ops:
                coll.bulk_write(ops)
        count = coll.count_documents({})
        print(f"   ✓ {collection}: {count} documentos migrados\n")
        return True
    except Exception as e:
        print(f"   ✗ Error migrando {collection}: {e}\n")
        return False

# ------------------- MIGRACIONES CON EMBEDDING -------------------
def migrate_productos():
    try:
        print("Migrando Productos + ProductoProveedor embebido")
        with mysql_conn() as conn, conn.cursor() as cur:
            # Mapa de proveedores por producto
            cur.execute("SELECT * FROM ProductoProveedor")
            pp_map = {}
            for pp in cur.fetchall():
                pid = pp['producto_id']
                pp_map.setdefault(pid, []).append({
                    "proveedor_id": pp['proveedor_id'],
                    "precio_compra": clean_value(pp['precio_compra']),
                    "plazo_entrega_dias": pp['plazo_entrega_dias'],
                    "pedido_minimo": pp['pedido_minimo'],
                    "activo": to_bool(pp['activo']),
                    "preferido": to_bool(pp['preferido'])
                })
            # Productos
            cur.execute("SELECT * FROM Producto")
            rows = cur.fetchall()
            ops = []
            for row in rows:
                doc = clean_row(row)
                doc['_id'] = doc.pop('producto_id')
                doc['proveedores'] = pp_map.get(doc['_id'], [])
                ops.append(ReplaceOne({'_id': doc['_id']}, doc, upsert=True))
                if len(ops) >= BATCH_SIZE:
                    db.productos.bulk_write(ops)
                    ops.clear()
            if ops:
                db.productos.bulk_write(ops)
        count = db.productos.count_documents({})
        print(f"   ✓ productos: {count} documentos migrados\n")
        return True
    except Exception as e:
        print(f"   ✗ Error migrando productos: {e}\n")
        return False

def migrate_lotes_stock():
    try:
        print("Migrando Lotes + Stock embebido")
        with mysql_conn() as conn, conn.cursor() as cur:
            cur.execute("SELECT * FROM Stock")
            stock_map = {s['lote_id']: {
                "cantidad": clean_value(s['cantidad']),
                "stock_minimo": clean_value(s['stock_minimo'])
            } for s in cur.fetchall()}

            cur.execute("SELECT * FROM Lote")
            rows = cur.fetchall()
            ops = []
            for row in rows:
                doc = clean_row(row)
                doc['_id'] = doc.pop('lote_id')
                doc['stock'] = stock_map.get(doc['_id'], {"cantidad": 0, "stock_minimo": 0})
                ops.append(ReplaceOne({'_id': doc['_id']}, doc, upsert=True))
                if len(ops) >= BATCH_SIZE:
                    db.lotes.bulk_write(ops)
                    ops.clear()
            if ops:
                db.lotes.bulk_write(ops)
        count = db.lotes.count_documents({})
        print(f"   ✓ lotes: {count} documentos migrados\n")
        return True
    except Exception as e:
        print(f"   ✗ Error migrando lotes: {e}\n")
        return False

def migrate_pedidos_detalle():
    try:
        print("Migrando Pedidos + DetallePedido embebido")
        with mysql_conn() as conn, conn.cursor() as cur:
            cur.execute("SELECT * FROM DetallePedido")
            det_map = {}
            for d in cur.fetchall():
                det_map.setdefault(d['pedido_id'], []).append({
                    "producto_id": d['producto_id'],
                    "cantidad_solicitada": clean_value(d['cantidad_solicitada']),
                    "precio_unitario": clean_value(d['precio_unitario'])
                })

            cur.execute("SELECT * FROM Pedido")
            rows = cur.fetchall()
            ops = []
            for row in rows:
                doc = clean_row(row)
                doc['_id'] = doc.pop('pedido_id')
                doc['detalle'] = det_map.get(doc['_id'], [])
                ops.append(ReplaceOne({'_id': doc['_id']}, doc, upsert=True))
                if len(ops) >= BATCH_SIZE:
                    db.pedidos.bulk_write(ops)
                    ops.clear()
            if ops:
                db.pedidos.bulk_write(ops)
        count = db.pedidos.count_documents({})
        print(f"   ✓ pedidos: {count} documentos migrados\n")
        return True
    except Exception as e:
        print(f"   ✗ Error migrando pedidos: {e}\n")
        return False

# ------------------- ÍNDICES -------------------
def create_indexes():
    try:
        print("Creando índices recomendados...")
        db.productos.create_index("sku")
        db.lotes.create_index("producto_id")
        db.pedidos.create_index("proveedor_id")
        db.movimientos_inventario.create_index([("producto_id", 1), ("fecha", -1)])
        print("   ✓ Índices creados exitosamente\n")
        return True
    except Exception as e:
        print(f"   ✗ Error creando índices: {e}\n")
        return False

# ------------------- EJECUCIÓN PRINCIPAL -------------------
if __name__ == "__main__":
    print("=== INICIO MIGRACIÓN STOCKLY → MONGODB ATLAS ===\n")
    
    # Validar conexiones primero
    if not validate_mysql_connection() or not validate_mongo_connection():
        print("\n✗ No se pudieron validar las conexiones. Abortando migración.")
        client.close()
        exit(1)
    
    print()
    
    # Ejecutar migraciones
    results = []
    results.append(("Rol", migrate_simple('Rol', 'roles', 'rol_id')))
    results.append(("Categoria", migrate_simple('Categoria', 'categorias', 'categoria_id')))
    results.append(("Proveedor", migrate_simple('Proveedor', 'proveedores', 'proveedor_id')))
    results.append(("TipoPago", migrate_simple('TipoPago', 'tipopagos', 'tipo_pago_id')))
    results.append(("Usuario", migrate_simple('Usuario', 'usuarios', 'usuario_id')))
    
    results.append(("Productos", migrate_productos()))
    results.append(("Lotes", migrate_lotes_stock()))
    results.append(("Pedidos", migrate_pedidos_detalle()))
    
    results.append(("MovimientoInventario", migrate_simple('MovimientoInventario', 'movimientos_inventario', 'movimiento_id')))
    
    results.append(("Índices", create_indexes()))
    
    # Cerrar conexión MongoDB
    client.close()
    
    # Resumen final
    print("=== RESUMEN MIGRACIÓN ===")
    successful = sum(1 for _, result in results if result)
    total = len(results)
    print(f"Completadas: {successful}/{total} migraciones\n")
    
    if successful == total:
        print("✓ MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("Verificar datos en MongoDB Atlas → Colecciones → stockly")
    else:
        print("✗ MIGRACIÓN COMPLETADA CON ERRORES")
        print("Revisar los errores arriba e intentar de nuevo")
