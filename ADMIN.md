# Panel de administración dinámico

Panel en `/admin` donde **todo lo que se ve sale de la base de datos**: los grupos y módulos del sidebar y, dentro de cada módulo, el formulario, las columnas de la tabla y los filtros. Crear un módulo nuevo es crear una fila desde el **Constructor de módulos**: no hay que tocar código ni desplegar.

Sigue la idea del patrón "reportes como código" de ERPCloud: la presentación vive en configuración (`column_configs`, `filters`) y el backend es un orquestador genérico que no cambia al añadir módulos. Diferencia: aquí no hay un SQL por módulo. Los registros se guardan en una tabla común con sus datos en JSON y el SQL lo arma el servidor con parámetros enlazados.

---

## Arquitectura

| Pieza | Tecnología | Dónde |
| --- | --- | --- |
| Landing | Astro estático (sin cambios, se prerenderiza) | `src/pages/index.astro` |
| Admin (páginas) | Una sola página Astro SSR con una isla React que navega en cliente (SPA) | `src/pages/admin/[...path].astro`, `src/admin/ui/router.tsx` |
| API | Endpoints de Astro como funciones de Vercel | `src/pages/api/admin/` |
| Base de datos | Neon (PostgreSQL), `node-postgres` + `attachDatabasePool` | `db/migrations/`, `src/admin/server/db.ts` |
| UI | [nuvo-ui](https://nuvo-ui.xyz/) copiado en el proyecto | `src/components/ui/` |
| Lógica compartida | Contrato de módulos + validación | `src/admin/schema.ts` |
| Servidor | Auth, módulos, registros | `src/admin/server/` |
| Vistas | Shell, módulo genérico, constructor | `src/admin/ui/` |

Solo `/admin` y `/api/admin` se ejecutan como funciones de Vercel; la landing se sigue sirviendo como archivos estáticos.

**Conexiones a Neon.** Dos cadenas de la misma base:

| Variable | Host | Para qué |
| --- | --- | --- |
| `DATABASE_URL` | con `-pooler` | La web (funciones de Vercel). Declarada en `astro.config.mjs` con `astro:env` como secreto de servidor. |
| `DATABASE_URL_UNPOOLED` | sin `-pooler` | Migraciones, `admin:create`, pgAdmin 4. |

En local salen de `.env` (ignorado por git), que apunta a la rama **Develop** de Neon. En Vercel, de las variables del proyecto (la integración de Neon las crea solas).

**Navegación sin recarga.** Todo `/admin` (salvo `/admin/login`) lo sirve `[...path].astro`, que solo pasa el usuario y el menú. El panel se monta una vez. `router.tsx` cambia la URL con `history.pushState`, intercepta los clics en enlaces `<a href="/admin/...">` (así funcionan sin cambios el Sidebar y el Breadcrumb de nuvo-ui) y respeta atrás/adelante y Ctrl+clic. Cada vista pide sus datos a la API (`useApiData`). Cuando el constructor guarda, `refreshNav()` actualiza el sidebar al momento. Un F5 en cualquier ruta interna carga directamente esa vista.

---

## Tablas

Dos esquemas: **`admin`** (lo interno del panel) y **`datos`** (tablas de negocio que se crearán desde el panel).

| Tabla | Para qué |
| --- | --- |
| `admin.users` | Administradores. Contraseña con PBKDF2-SHA256 (100 000 iteraciones). |
| `admin.sessions` | Sesiones. La cookie lleva un token aleatorio; la tabla guarda solo su SHA-256. 7 días. |
| `admin.module_groups` | Apartados del sidebar (Catálogo, Ventas…). |
| `admin.modules` | **Definición de cada módulo**: `fields`, `column_configs`, `filters` (jsonb), orden, tamaño de página, icono, grupo, `source_type`/`source`. |
| `admin.records` | Registros de los módulos de tipo `records`. `data` es `jsonb`. |
| `admin.audit_log` | Quién hizo qué (login, altas, cambios, borrados, cambios de configuración). |
| `admin.settings` | Ajustes del panel (apariencia…). |
| `admin.schema_migrations` | Migraciones aplicadas (la gestiona `scripts/db.mjs`). |

---

## Contrato de un módulo

Todo se valida en `parseModuleDefinition` (`src/admin/schema.ts`) antes de guardarse.

### `fields`: el formulario

```json
{ "key": "precio", "label": "Precio", "type": "currency", "required": true, "min": 0 }
```

| `type` | Control | Se guarda como |
| --- | --- | --- |
| `text`, `textarea`, `phone` | Input / Textarea | texto (`max_length` opcional) |
| `email`, `url` | Input | texto validado (solo `http`/`https`) |
| `number`, `currency` | Input numérico | número (`min`/`max` opcionales) |
| `date` | DatePicker | `YYYY-MM-DD` |
| `boolean` | Switch | `true` / `false` |
| `select`, `multiselect` | Select / MultiSelect | valor o lista de valores de `options` |
| `relation` | Select con registros de otro módulo | id del registro (`relation_module`, `relation_label`) |

### `column_configs`: la tabla

Mismos nombres que `columnConfigs` en ERPCloud:

```json
{ "column": "precio", "headerText": "Precio", "data_type": "currency", "align": "right", "sortable": true, "null_display": "—" }
```

`data_type`: `text`, `number`, `currency`, `date`, `datetime`, `boolean`, `badge`, `list`. `column` puede ser un campo o uno de sistema (`id`, `created_at`, `updated_at`). El formato es cosa del frontend (`src/admin/ui/format.tsx`).

### `filters`: los filtros

```json
{ "name": "precio_max", "label": "Precio hasta", "field": "precio", "control": "number", "operator": "lte" }
```

| `control` | SQL que genera |
| --- | --- |
| `text` | `ILIKE %valor%`. Con `field: "*"` busca en todos los valores del registro. |
| `select`, `multiselect` | `= ANY(…)`. Si el campo es `multiselect`, basta con que coincida alguna opción (`jsonb_exists_any`). |
| `date` / `daterange` | comparación por fecha (`desde` / `hasta`) |
| `number` | `=`, `>=` o `<=` según `operator` |
| `boolean` | solo los marcados |

`name` es la clave del valor del filtro (como el parámetro `@nombre` en Dapper). Los filtros se aplican en la base de datos, no solo a la página visible. Las opciones de los filtros de lista salen solas del campo (o de los registros del módulo relacionado).

---

## API

| Método | Ruta | Qué hace |
| --- | --- | --- |
| `POST` | `/api/admin/auth/login` · `/logout` | Sesión |
| `GET` | `/api/admin/nav` | Sidebar |
| `GET` | `/api/admin/dashboard` | Resumen del inicio |
| `GET` | `/api/admin/m/:key/definition` | Definición de un módulo activo (campos, columnas, filtros) |
| `GET` `POST` | `/api/admin/modules` | Definiciones (constructor) |
| `GET` `PUT` `DELETE` | `/api/admin/modules/:id` | |
| `GET` `POST` | `/api/admin/groups` · `PUT` `DELETE` `/groups/:id` | Grupos del menú |
| `GET` | `/api/admin/m/:key?page&page_size&sort&dir&filters` | Lista paginada: `{ type: "table", columnConfigs, data, total_rows, page, page_size }` |
| `POST` | `/api/admin/m/:key` | Alta |
| `GET` `PUT` `DELETE` | `/api/admin/m/:key/:id` | Registro |
| `GET` | `/api/admin/m/:key/options` | Opciones de los campos de relación |
| `GET` `POST` · `PUT` `DELETE` | `/api/admin/users` · `/users/:id` | Administradores |

`filters` va como JSON en la query, por nombre de filtro: `{"estado":["pendiente"],"entrega":{"from":"2026-10-01"}}`.

---

## Seguridad

- **Sesión**: cookie `HttpOnly`, `SameSite=Lax` y `Secure` en HTTPS. Desactivar un usuario o cambiarle la contraseña cierra sus sesiones.
- **CSRF**: toda petición que no sea `GET` a `/api/admin` debe traer `Origin` del propio sitio (`src/middleware.ts`).
- **Fuerza bruta**: 5 intentos fallidos por correo en 15 minutos bloquean el login de ese correo.
- **SQL**: valores y nombres de campo siempre como parámetros enlazados (`r.data->>$1`). Además, los campos se validan contra la definición del módulo y `^[a-z][a-z0-9_]{1,47}$`. El orden solo admite columnas marcadas como ordenables.
- **Integridad**: no se puede borrar un registro al que apuntan otros, ni un módulo del que dependen otros, ni cambiarle la clave.
- **Indexación**: `/admin` lleva `noindex`, está fuera del sitemap y en `Disallow` de robots.txt.

---

## Comandos

Todos usan la base a la que apunte `DATABASE_URL_UNPOOLED` (en `.env`, la rama Develop).

```bash
pnpm db:status                  # migraciones aplicadas y pendientes
pnpm db:migrate                 # aplica db/migrations/*.sql que falten (cada una en su transacción)
pnpm db:seed                    # registros de ejemplo (solo ramas de desarrollo)
pnpm admin:create correo@x.com "Nombre"            # contraseña aleatoria, se muestra una vez
ADMIN_PASSWORD='…' pnpm admin:create correo@x.com "Nombre"   # con contraseña elegida
pnpm dev                        # http://localhost:4321/admin
```

Para conectarte con **pgAdmin 4**: host, usuario y contraseña de `DATABASE_URL_UNPOOLED` (host sin `-pooler`), puerto 5432, base `neondb`, SSL obligatorio.

## Puesta en producción (una vez)

1. En Vercel → proyecto → **Storage** → conecta Neon (o añade a mano `DATABASE_URL` con la cadena **con pooling** de la rama `production`).
2. Ajustes del proyecto en Vercel: **Node.js 22.x o 24.x**, y región de funciones cerca de la base (Neon está en `us-east-2`; p. ej. `iad1`).
3. Desde tu equipo, con `DATABASE_URL_UNPOOLED` apuntando a **production** (no a Develop):
   ```bash
   pnpm db:migrate
   pnpm admin:create correo@x.com "Nombre"
   ```
   No ejecutes `db:seed` en producción.
4. Despliega (push a la rama conectada en Vercel).

Cambia también `site` en `astro.config.mjs` por el dominio real (lo usan robots.txt y el sitemap). Antes de migrar producción, prueba la migración en una rama de Neon creada desde production.

---

## Cambios hechos a los componentes de nuvo-ui

El código de nuvo-ui vive en el proyecto (`src/components/ui`), así que se ajustó aquí. Conviene llevarlo a la librería:

1. **`dashboard-layout`**: `min-w-0` en la columna de contenido. Sin él, una tabla ancha estira la página más allá de la pantalla en móvil.
2. **`login`**: props opcionales `forgotPasswordHref` y `signUpHref`. Antes los enlaces "¿Olvidaste tu contraseña?" y "Crear cuenta" salían siempre con `href="#"`.
3. **Instalación con Tailwind v4**: la librería espera Tailwind v3 (`tailwind.config` + `tailwindcss-animate`). Aquí se tradujo a `@theme` en `src/styles/admin.css` con `tw-animate-css`. Además falta el color `input` (lo usan Select y Textarea), que se mapeó a `border`.
4. **Dependencias**: el CLI instala `@tanstack/react-table` sin versión y llega la v9, pero `data-table` usa la API de la v8. También faltan `clsx` y `tailwind-merge`, y el CLI no copia `lib/utils.ts`.
5. **`data-table`**: no admite paginación ni orden en servidor. Aquí la paginación usa `Pagination` aparte y el orden un selector propio.
