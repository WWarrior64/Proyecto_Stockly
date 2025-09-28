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