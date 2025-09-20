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