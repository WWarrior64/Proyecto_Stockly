# AGENTS.md

## Commands
- Run app: `python app.py` (debug mode) or `gunicorn app:app`
- Run tests: `pytest` or `pytest <path/to/test_file.py>` for single test
- Database migrations: `flask db migrate -m "message"` then `flask db upgrade`
- Test DB connection: `python test_db.py`
- Build Tailwind CSS: No build command specified (CSS may be built manually or via CDN)

## Architecture
- **Backend**: Flask 2.x + SQLAlchemy 2.x + MariaDB/MySQL (PyMySQL connector)
- **Frontend**: Vue.js 3 (CDN), Tailwind CSS, ES6 modules
- **Structure**: Blueprints in `app/routes/` (auth, inventario, pedidos, reportes, cuenta, configuraciones, main)
- **Models**: SQLAlchemy models in `app/models/` (Usuario, Rol, Producto, Categoria, Pedido, DetallePedido, Proveedor, ProductoProveedor, Stock, Lote, MovimientoInventario, TipoPago)
- **Static Assets**: `/static/js/` contains ES6 modules with `services/` (API calls) and `views/` (Vue components)
- **Templates**: Jinja2 templates in `app/templates/`
- **Auth**: Flask-Login with role-based access (admin, vendedor)
- **Database**: Connection via `.env` file (`DATABASE_URL`, `SECRET_KEY`)

## Code Style
- **Python**: Import models from `app.models`, use blueprints, Flask-WTF for forms, passlib for password hashing
- **JavaScript**: ES6 modules with explicit imports, Vue 3 Composition API from CDN, async/await for API calls
- **Naming**: Snake_case for Python (e.g., `DetallePedido`), camelCase for JavaScript (e.g., `loadProducts`)
- **Error handling**: Try/catch in JS, Flask error handlers in routes
- **File paths**: Use `os.path.join()` in Python, absolute paths starting with `/static/` in frontend
