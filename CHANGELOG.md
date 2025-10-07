# CHANGELOG

Todas las modificaciones relevantes del proyecto **Stockly** se documentan aquí.
Sigue el formato de versiones semánticas (MAJOR.MINOR.PATCH) cuando aplique.

Cada entrada contiene, de forma estructurada:
- **Versión** (si aplica)
- **Fecha** (DD-MM-YYYY)
- **Descripción** (qué se cambió/añadió/quitó)
- **Impacto** (mejoras, corrección de errores, nuevas funcionalidades, notas operacionales)

---

## [Unreleased]
- **Versión:**
- **Fecha:** DD-MM-YYYY
- **Descripción:** Lista breve de cambios planeados o en progreso (features, fixes).
  - Ejemplo: Implementar validaciones en `auth`, crear endpoints CRUD para `inventario`.
- **Impacto:** Breve nota sobre el impacto (ej. "Mejora: añade validaciones que evitan datos inválidos"; "Nuevo: endpoint para crear productos").

---

## [0.4.0] - 07-10-2025
- **Versión:** 0.4.0  
- **Fecha:** 07-10-2025  
- **Descripción:** Implementación completa del backend con base de datos, autenticación segura mediante Flask-Login, controladores MVC, gestión de sesión, vistas de usuario, sistema de mensajes flash y modularización de blueprints. Incluye la conexión a la base de datos real, registro e inicio de sesión funcionales, cierre de sesión, control de acceso, y la integración de vistas dinámicas en Tailwind y Vue.  
- **Impacto:**
  - **Nuevo:** Backend totalmente operativo (login, registro, logout, sesión persistente).
  - **Mejora:** Estructura modular lista para escalar; código dividido en controladores, modelos y rutas.
  - **Operacional:** El sistema requiere `SECRET_KEY` y `DATABASE_URL` definidos en `.env`.

### Detalle

#### Added

**Base de datos y configuración**
- Conexión a MySQL/MariaDB funcional a través de `SQLALCHEMY_DATABASE_URI` (en `.env`).
- Implementación de `app/extensions.py` para inicializar `db`, `migrate` y `login_manager`.
- Migraciones gestionadas con Flask-Migrate.

**Modelos**
- `Usuario`: incluye herencia de `UserMixin` y método `get_id()` compatible con Flask-Login.
- `Rol`: tabla de roles asociada con usuarios.
- Relaciones establecidas con claves foráneas (`rol_id` en `Usuario`).

**Autenticación y sesión**
- Integración completa de Flask-Login:
  - Uso de `login_user()` y `logout_user()` en rutas.
  - Decorador `@login_required` en vistas protegidas.
  - Cargador de usuario `@login_manager.user_loader`.
- Hash de contraseñas con `werkzeug.security.generate_password_hash` y verificación con `check_password_hash`.
- Manejo de sesión a través del objeto `current_user`.

**Controladores**
- `auth_controller.py`:
  - `registrar_usuario(form_data)` crea usuarios con contraseña encriptada.
  - `autenticar_usuario(email, password)` valida credenciales.
- Nuevo `cuenta_controller.py`:
  - Permite obtener y mostrar datos del usuario autenticado.
  - Preparado para futuras actualizaciones del perfil.

**Rutas (Blueprints)**
- `auth_bp`: rutas `/login`, `/register`, `/logout`.
- `cuenta_bp`: vista del usuario (`/cuenta`) y endpoints para datos de perfil.
- `pedidos_bp` y `reportes_bp` actualizados y registrados en `app.py`.
- Redirección raíz `/` → `/auth/login`.

**Vistas**
- `login.html` y `register.html`: diseño responsivo con Tailwind y mensajes flash integrados.
- `usuario.html`: vista moderna con Vue.js, muestra datos del usuario actual y botón “Cerrar sesión”.
- `partials/_flash.html`: componente reutilizable para mensajes de estado (success, warning, error).
- Animaciones de desaparición automática implementadas en `static/js/flash.js`.

**Frontend**
- Tailwind compilado localmente, sin dependencias de CDN.
- Flash messages estilizados con clases dinámicas (verde, amarillo, rojo).
- Vue.js usado para el renderizado reactivo de datos del usuario (`user.js`).
- Navegación coherente entre vistas (Inicio, Inventario, Pedidos, Reportes, Cuenta).

**Seguridad**
- Claves sensibles (`SECRET_KEY`, `DATABASE_URL`) movidas a `.env`.
- Contraseñas encriptadas antes de almacenarse.
- Control de acceso mediante `login_required`.

**Co-autores**
- Co-authored-by: Jorge_castro1 <jorge.castro1@catolica.edu.sv>  
- Co-authored-by: elvis-chavez <elvis.chavez@catolica.edu.sv>

#### Changed
- `app.py` reorganizado:
  - Registro centralizado de todos los blueprints (`auth`, `main`, `inventario`, `cuenta`, `pedidos`, `reportes`).
  - Configuración de carpetas `static` y `templates` fuera de `app/` para compatibilidad.
- `Usuario` actualizado para integrar `UserMixin` y relación con `Rol`.
- `auth.py` refactorizado:
  - Eliminadas sesiones manuales (`session['user_id']`).
  - Reemplazo por `login_user()` y `logout_user()`.
- `login.html` y `register.html`:
  - Integrados mensajes flash dinámicos (`get_flashed_messages`).
  - Correcciones visuales de alineación y espaciado.
- `flash.js` modificado para animar correctamente tras los cambios de layout (fixed + right-4).

#### Fixed
- Errores de conexión MySQL (No such file or directory) corregidos mediante variables `.env` adecuadas.
- Problemas de alineación de mensajes flash (posición corregida y animación restaurada).
- Mensajes flash ahora desaparecen automáticamente tras 5s sin romper la estructura del layout.
- Vista de usuario actualizada para centrar correctamente el nombre y el avatar.
- `url_for` corregido en múltiples templates para usar endpoints de blueprints.
- Eliminados espacios en blanco y problemas de padding en layouts principales.

#### Removed
- Manejo de sesión manual vía `session[]` en favor de Flask-Login.
- Código redundante en rutas de `auth` y templates.

---

## [0.3.0] - 04-10-2025
- **Versión:** 0.3.0
- **Fecha:** 04-10-2025
- **Descripción:** Inclusión de vistas y funcionalidades principales de UI enfocadas en Pedidos, Reportes y Perfil de Usuario; reorganización de rutas y assets; integración de Vue.js en el front-end y Chart.js para visualización de datos:
  - Implementación completa de la interfaz de **Reportes** con Chart.js y Tailwind. (PR #7)
  - Creación de la vista de **Pedidos** con Tailwind. (PR #6)
  - Implementación de la página de **Perfil de Usuario** usando Vue.js y Tailwind, con `userService` para consumo de endpoints API. (PR #5)
  - Se añadieron blueprints separados para `pedidos` y `reportes` (separación de responsabilidades en rutas).
  - Tailwind ahora se usa compilado localmente y los templates apuntan a `static/css/styles.css` (en lugar de usar CDN en producción).
  - Ajustes en `app.py` para registrar correctamente los nuevos blueprints (`pedidos_bp`, `reportes_bp`, `cuenta_bp`), y correcciones en `main.py` para evitar rutas duplicadas/colisiones.
- **Impacto:**
  - **Nuevo:** Vistas funcionales para Pedidos, Reportes y Perfil (frontend listo para iterar; backend DB pendiente).
  - **Mejora:** Código más modular (blueprints por dominio), paleta y estilos unificados a través del proyecto.
  - **Operacional:** Preparación para compilar Tailwind localmente (scripts `dev:css` / `build:css`), y punto de partida para enlazar la lógica del backend (endpoints API) con Vue en el frontend.

### Detalle
#### Added
- Vistas:
  - `templates/pedidos/pedidos.html` (UI de lista de pedidos, búsqueda, filtros y switches accesibles).
  - `templates/reportes/reportes.html` (dashboard de estadísticas con Chart.js).
  - `templates/user/usuario.html` (perfil de usuario con montaje vía Vue).
- Blueprints:
  - `app/routes/pedidos.py` (pedidos_bp) con endpoints CRUD-stub: `/pedidos/`, `/pedidos/crear`, `/pedidos/<id>`, etc.
  - `app/routes/reportes.py` (reportes_bp) con endpoint `/reportes/`.
  - `app/routes/cuenta.py` (cuenta_bp) (API `/cuenta/api/user` y vistas de usuario).
- Frontend (JS/CSS):
  - `static/js/services/userService.js` (fetch a `/cuenta/api/user`, logout stub).
  - `static/js/views/user.js` (Vue app para perfil).
  - `static/css/styles.css` (Tailwind compilado localmente).
- Assets:
  - Imágenes movidas/añadidas en `static/images/` (logos, producto, fondo, avatar placeholder, filter icon).

#### Changed
- Rutas y estructura:
  - Eliminadas las rutas `/pedidos` y `/reportes` del blueprint `main` para crear blueprints independientes y evitar colisiones de endpoints.
  - `main.py` limpiado de rutas duplicadas (se dejó `home` y rutas no relacionadas a pedidos/reportes).
- Tailwind:
  - Reemplazo del uso de CDN por el CSS generado localmente (`static/css/styles.css`).
  - Inclusión de variables de tema extendidas en `tailwind.config.js` (colores: `brandTeal`, `brandOrange`).
- Templates:
  - Todos los templates principales actualizados para usar `url_for('static', filename='css/styles.css')` y `url_for('static', filename='images/…')`.
  - Enlaces en nav actualizados para apuntar a endpoints de blueprints (`url_for('pedidos.pedidos')`, `url_for('reportes.reportes')`, `url_for('cuenta.cuenta')`).
- app.py:
  - Registro de los nuevos blueprints (`pedidos_bp`, `reportes_bp`, `cuenta_bp`) y mantenimiento de `main_bp`, `auth_bp`.

#### Fixed
- Correcciones a `url_for` en templates que producían `BuildError` (uso correcto del nombre del endpoint según blueprint y url_prefix).
- Mejora en accesibilidad de los switches (atributos `aria-*` añadidos).
- Corrección de paths rotos por el reubicado de assets (actualizados a `static/images/...`).

---

## [0.2.0] - 28-09-2025
- **Versión:** 0.2.0
- **Fecha:** 28-09-2025
- **Descripción:** Inclusión de las primeras vistas principales de la interfaz de usuario y ajustes en rutas y assets:
  - Añadidas vistas `home.html`, `inventario.html`, `login.html` y `register.html` con diseño basado en Tailwind local.
  - Se añadieron y movieron imágenes de `app/Imagenes_stockly/` y `app/resources/` a `static/images/` para estandarizar carga de assets.
  - Actualización de `app.py` para registrar correctamente los blueprints: `auth_bp`, `main_bp` y `inventario_bp`.
  - Ajustes en `main.py` (rutas `/home`, `/login`, `/pedidos`, `/reportes`, `/cuenta`) y creación de `inventario.py` como blueprint separado.
  - Formularios de login y registro centrados, con espacio y consistencia en la paleta de colores.
- **Impacto:** 
  - **Nuevo:** Primeras vistas funcionales de interfaz de usuario listas solo para navegación.
  - **Mejora:** Estandarización de rutas y assets, facilitando mantenimiento y escalabilidad.
  - **Operacional:** Tailwind compilado localmente, evitando dependencias externas y mejorando tiempo de carga.

### Detalle
#### Added
- Vistas principales: `home.html`, `inventario.html`, `login.html`, `register.html`.
- Blueprint `inventario.py`.
- Imagenes añadidas `Logo_Stockly`, `Logo_stockly_remove`, `producto` y `fondo_stockly`
- Assets trasladados a `static/images/`.
- Tailwind compilado localmente y aplicado a todas las vistas.
- Enlaces de navegación entre login y register.

#### Changed
- Carpeta static movida fuera de app por incompatibilidad de rutas.
- Instalación local de Tailwind para uso visual en las interfaces.
- Uso Basico de Vue para separación de logica de negocio en la vista Home.
- `app.py`: Registro de blueprints ajustado.
- `main.py`: Rutas actualizadas y duplicadas eliminadas.
- Formularios y estilos visuales adaptados a la nueva paleta y layout.

#### Fixed
- Conflicto con archivo base.html eliminado y no eliminado en diferentes commits.
- Conflictos de endpoints duplicados (`auth.login`) corregidos.

---

## [0.1.0] - 20-09-2025
- **Versión:** 0.1.0
- **Fecha:** 20-09-2025
- **Descripción:** Versión inicial del repositorio. Se añade la estructura base y componentes mínimos para arrancar el MVC:
  - Estructura del repo: `app/`, `routes/`, `models/`, `templates/`, `static/`.
  - Archivos de soporte: `README.md`, `requirements.txt`, `.gitignore`.
  - Blueprints iniciales: `auth` (endpoints `/login` y `/register` con templates base).
  - Archivo `CHANGELOG.md` insertado en la raíz.
- **Impacto:** 
  - **Mejora:** Proporciona la base para el desarrollo colaborativo y despliegue.  
  - **Nuevo:** Entorno mínimo operativo que permite ejecutar la app localmente y empezar a desarrollar módulos (auth, inventario).  
  - **Operacional:** Permite a evaluadores y colaboradores instalar dependencias y correr migraciones básicas.

### Detalle
#### Added
- Estructura base del repositorio (app/, routes/, models/, templates/).
- README.md con instrucciones de instalación.
- Blueprint `auth` con endpoints `/login` y `/register`.
- Archivo requirements.txt con dependencias básicas.

#### Changed
- N/A

#### Fixed
- N/A

---