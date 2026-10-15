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

### Dónde va cada cosa (responsabilidades)

**La lógica nunca va en los `.tsx` ni en los `.astro`**: los componentes solo pintan. Las reglas completas están en la skill `.claude/skills/clean-code/SKILL.md`.

| Capa | Carpeta | Qué contiene |
| --- | --- | --- |
| Dominio | `src/admin/schema.ts`, `src/data/sitio.ts`, `src/admin/xlsx.ts` | Tipos, validación y reglas compartidas por navegador y servidor |
| Servidor | `src/admin/server/` | SQL (siempre con parámetros), permisos, reglas de negocio |
| API | `src/pages/api/admin/` | Controladores delgados: validar → servidor → responder |
| Hooks | `src/admin/ui/hooks/use*.ts` | Estado, efectos, llamadas a la API y acciones de cada pantalla |
| Lógica de UI | `src/admin/ui/lib/*.ts` | Transformaciones puras para pintar (sin React ni `fetch`) |
| Cliente de la API | `src/admin/ui/api.ts` | Única puerta del navegador a `/api/admin` |
| Componentes | `src/admin/ui/**/*.tsx` | Solo JSX: reciben datos y acciones del hook. Pantallas grandes divididas en carpetas (`module-editor/`, `site/`, `sql/`, `users/`, `records/`) |

Las dependencias solo bajan: componentes → hooks → `lib`/`api.ts` → dominio; API → servidor → dominio. Ningún componente importa de `server/`.

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
| `admin.user_modules` | Permisos de los usuarios con rol `usuario`: módulo y si puede editar. |
| `admin.files` | Fotos y adjuntos de los registros (bytea). |
| `datos.registros` | Vista de solo lectura con los registros de todos los módulos, para las consultas. |
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
| `GET` `POST` · `PUT` `DELETE` | `/api/admin/users` · `/users/:id` | Usuarios, rol y permisos por módulo |
| `GET` | `/api/admin/m/:key/export` | Excel (.xlsx) con lo que cumple los filtros, hasta 10 000 filas. `?formato=csv` para CSV (`;` y BOM) |
| `POST` | `/api/admin/m/:key/import` | `{ rows: [{ campo: "texto" }] }`: valida todo y guarda todo o nada (hasta 5000 filas) |
| `POST` · `GET` | `/api/admin/files` · `/files/:id` | Subir (multipart, 4 MB) y descargar fotos y adjuntos |
| `POST` | `/api/admin/sql/run` | Consola SQL `{ sql, allow_write }` |
| `POST` | `/api/admin/sql/preview` | Probar la consulta de un módulo: columnas y 20 filas |
| `GET` | `/api/admin/tables` | Tablas y vistas del esquema `datos`, con campos sugeridos |
| `GET` `PUT` | `/api/admin/settings/appearance` | Apariencia |
| `GET` `PUT` | `/api/admin/site` | Contenido de la landing: estado y borrador |
| `POST` | `/api/admin/site/publish` · `/site/restore` | Publicar (y lanzar el Deploy Hook) · recuperar una versión al borrador |
| `GET` | `/media/:id` | Imágenes públicas de la landing (sin sesión) |

`filters` va como JSON en la query, por nombre de filtro: `{"estado":["pendiente"],"entrega":{"from":"2026-10-01"}}`.

Solo administradores: `/modules`, `/groups`, `/users`, `/sql`, `/tables`, `/settings` (lo corta `src/middleware.ts`). En `/m/:key` se comprueba el permiso del usuario en ese módulo.

---

## Sitio web: editar la landing desde el panel (`/admin/sitio`)

Todo lo que se ve en la landing sale de un documento de contenido (`src/data/sitio.ts`), editable por bloques:

| Sección | Qué se cambia |
| --- | --- |
| Colores y tipografía | Fondo, texto y acento; tipografía de títulos y de textos (lista cerrada en `FONTS`, servidas desde el propio dominio). Avisa si el contraste es bajo |
| Marca | Nombre, lema, promesa, frase del pie y logo |
| Contacto y pedidos | WhatsApp y mensaje al pulsar "Pedir", teléfono, ciudad, zona, horario, entregas, pagos, Instagram |
| Google y redes (SEO) | Título y descripción de la página |
| Bloques | Paseo con video, Frase, Productos, La diferencia, Opiniones, Preguntas, Pedido semanal, Llamado final: textos, listas (añadir, quitar y reordenar), fotos, video, mostrar u ocultar y **orden** de los bloques |

**Cómo se publica.** La landing sigue siendo estática (rápida y sin depender de la base para cargar):

1. Los cambios se guardan como **borrador** (`admin.settings`, clave `site_draft`).
2. **Vista previa** (`/admin/vista-previa`) muestra la landing completa con el borrador. Solo administradores.
3. **Publicar** copia el borrador a `site_published`, guarda la versión en `admin.site_versions` (las 50 últimas, con "Recuperar") y llama al **Deploy Hook** de Vercel. El build lee `site_published` y genera la página (1–2 min).

Sin nada publicado, la landing usa `SITE_DEFAULTS` (el contenido de siempre). Si la base está configurada pero falla durante el build, el build falla a propósito, para no publicar el contenido por defecto encima del bueno.

**Configurar el Deploy Hook (una vez):** Vercel → proyecto → Settings → Git → Deploy Hooks → crear uno para la rama de producción (`main`) → copiar la URL → Settings → Environment Variables → `VERCEL_DEPLOY_HOOK` (Production) → Redeploy. Sin él, "Publicar" guarda pero la web cambia en el siguiente despliegue normal.

**Imágenes.** Se suben desde el editor, se reducen en el navegador (máx. 1920 px, WebP) y se guardan en `admin.files` con `public = true`. Se sirven sin sesión en `/media/<id>` con caché de un año (la CDN de Vercel las guarda tras la primera visita). Las imágenes que vienen con el proyecto se nombran `asset:<clave>` (`src/data/assets.ts`) y siguen pasando por `astro:assets` (AVIF/WebP). Los **videos** no se suben desde el panel (Safari necesita peticiones parciales que una función no da bien): se eligen de `public/video/` o se pega una URL https.

**Chat de ayuda** (Sitio web → General → Chat de ayuda). Botón flotante con una conversación guiada por botones, sin IA y sin costo:

- **Preguntas:** las propias del chat y, si se activa, las del bloque "Preguntas frecuentes". Se muestran 5 y el resto con "Ver más".
- **Pedido guiado:** productos y precios del bloque Productos (cantidades con + y −), nombre, número de WhatsApp (validado), dirección, entrega (opciones configurables) y nota opcional. Muestra un resumen con el total: los productos con precio fijo se suman; los que se cobran por peso (`/ lb`) se indican "según lo que pese".
- **Envío:** abre WhatsApp con el mensaje armado según la plantilla del panel (variables `{marca} {pedido} {total} {nombre} {telefono} {direccion} {entrega} {nota}`). La persona solo pulsa enviar.
- **Registro en el panel:** al pulsar enviar, el pedido también se guarda en el módulo **Pedidos de la web** (grupo Ventas, migración `0005`) con estado *pendiente*, y el chat le muestra al cliente su número de pedido. Aparece en la actividad del inicio como "Un cliente hizo un pedido por el chat". Se apaga con "Guardar los pedidos en el panel".
  - `POST /api/pedido` (público): solo acepta peticiones desde la propia web (cabecera `Origin`), recalcula productos y precios con lo publicado (no se fía de lo que manda el navegador), valida teléfono y entrega, descarta bots con un campo trampa y limita a 5 pedidos por IP cada 10 min y 120 por hora en total (`audit_log`, acción `web_order`, IP guardada como SHA-256).
  - Si el registro falla o el módulo no existe, WhatsApp se abre igual: el pedido nunca se pierde.
- **Se configura:** mostrarlo u ocultarlo, texto y lado del botón, nombre del asistente, bienvenida, preguntas, entregas, nota, registro en el panel y plantilla del mensaje. Sale con Publicar, como el resto.
- **Código:** reglas del pedido en `src/data/chat.ts` (puro, también valida el pedido en el servidor), conversación en `src/scripts/chat.ts`, marco en `src/components/ChatBot.astro` y guardado en `src/admin/server/webOrders.ts`. No usa React: la landing sigue ligera.

**Plantillas** (Sitio web → General → Plantillas). Cambian de una vez el aspecto de la web sin tocar textos, fotos ni el orden de los bloques. Aplicar una deja el cambio sin guardar; se revisa en Vista previa y sale con Publicar.

| Plantilla | Aspecto | Portada |
|---|---|---|
| Finca | La original: verde finca, crema y teja, Hina Mincho | Dividida |
| Órbita | Azul cielo, paneles azul marino, botones naranja en degradado, Rubik 700 | Panel redondeado con margen |
| Atardecer | Blanco y berenjena, acento fucsia, franja con degradado rosa a amarillo, Inter Tight 700 | Centrada sobre el video |
| Lima | Blanco cálido y verde bosque, lima en las franjas oscuras, DM Sans 300, tarjetas rectas | Clara, con el video en una tarjeta |

- **Qué cambia una plantilla:**
  - **Tema** (Colores y tipografía, en grupos): fondo, texto y acento de la página; segundo color del titular; texto de los botones y su degradado opcional; esquinas de botones y tarjetas; colores del menú y del pie; tipografías y grosor de los títulos.
  - **Colores de cada bloque** (al final de cada bloque, "Colores del bloque"): fondo (con degradado opcional), texto y acento. Vacíos: los del tema.
  - **Diseño de la portada** (bloque Portada → "Diseño de la portada"): dividida, panel, centrada o tarjeta. Solo cambia dónde van el video y el texto; el recorrido con scroll es el mismo.
- **El login** del panel se viste con la plantilla **publicada** (fondo, texto, acento, texto de botones y tipografías). El resto del panel sigue con Apariencia.
- **Retoques:** después de aplicar una plantilla se puede cambiar cualquier color; la galería deja de marcarla "En uso". El editor avisa si algún texto queda con poco contraste (WCAG), en el tema y en cada bloque.
- **Código:**
  - Las plantillas son datos: `src/data/plantillas.ts`. Añadir una es añadir un objeto con su tema, sus colores por bloque y su portada.
  - Las referencias de estilo de cada una están en `.claude/skills/plantilla-<id>/SKILL.md`.
  - **Cómo funciona:** todos los colores de la landing salen de variables CSS (`--color-bg`, `--color-crema`, `--color-teja`, `--btn-bg`, `--color-on-teja`, `--radius-*`…).
    - `temaCss` las define para la página.
    - `bloqueCss` las redefine dentro del envoltorio de un bloque con colores propios.
    - `.zona-menu` y `.zona-pie` hacen lo mismo con el menú y el pie.
    - Por eso los componentes no cambian con cada plantilla.

**Textos con formato:** `**así**` pone negrita y un salto de línea parte el renglón (títulos del llamado final, notas).

**Qué sigue siendo de código:** el diseño de cada bloque, las animaciones y crear un *tipo* de bloque nuevo. Para añadir un campo editable a un bloque basta con añadirlo a su tipo, a `SITE_DEFAULTS` y a `BLOCK_DEFS` en `src/data/sitio.ts`, y usarlo en su componente: el editor lo dibuja solo.

---

## Fase 2: todo desde el panel, sin IDE

### Origen de los datos de un módulo

En el constructor, **General → Origen de los datos**:

| Origen | Dónde están las filas | Se puede |
| --- | --- | --- |
| Registros del panel | `admin.records` (jsonb) | Crear, editar, borrar, importar, exportar |
| Tabla de la base | Una tabla real de `datos` con clave primaria de una columna | Lo mismo. Las columnas son los campos. Si la tabla tiene `updated_at`, el panel la actualiza |
| Consulta SQL | Un `SELECT`/`WITH` sobre `datos` | Ver, filtrar, ordenar y exportar (solo lectura) |

- **Crear la tabla sin salir del constructor**: elige "Tabla de la base" → **Crear tabla con SQL**. Sale un `CREATE TABLE` de partida (con los campos que ya tenga el módulo); al ejecutarlo, el módulo trae las columnas solo. "Cambiar columnas" hace lo mismo con `ALTER TABLE`. Borrar tablas o columnas solo desde la consola.
- **Consulta**: escribe el SELECT → **Probar consulta** (muestra columnas, tipo detectado y 20 filas). Los filtros y el orden del módulo se aplican sobre el resultado (`SELECT * FROM (<tu consulta>) t WHERE …`). Las columnas deben llamarse en minúsculas y sin tildes (usa `AS`).
- Los registros de los módulos del panel se leen desde SQL con la vista **`registros`**: `SELECT data->>'estado', count(*) FROM registros WHERE modulo = 'pedidos' GROUP BY 1`.

### Consola SQL (`/admin/sql`)

Por defecto en **solo lectura**. Con "Permitir cambios" puede crear tablas, insertar, actualizar y borrar en `datos` (pide confirmación si hay `DROP`, `TRUNCATE` o `DELETE`). Guarda historial en el navegador y cada ejecución queda en la auditoría (`action = 'sql'`).

**Cómo se aísla**: todo lo que escribe la gente (consola, módulos de tabla y de consulta) corre en una transacción que hace `SET LOCAL ROLE` a un rol sin login:

| Rol | Permisos |
| --- | --- |
| `admin_datos_lector` | `SELECT` en `datos` (consultas y consola en solo lectura, en transacción `READ ONLY`) |
| `admin_datos_editor` | Todo en `datos` (consola con cambios, módulos de tabla) |

Ninguno ve el esquema `admin` (usuarios, sesiones). Además se rechazan sentencias de control de transacción, de roles y permisos (`COMMIT`, `SET ROLE`, `GRANT`, `DO`…), `set_config()` y referencias a `admin.`, y cada sentencia tiene un tiempo máximo (10–15 s). Es una barrera contra errores, no contra un administrador malintencionado: quien es administrador ya controla el panel entero.

**Tablas creadas desde un IDE** con el usuario dueño (`neondb_owner`) reciben permisos solas (`ALTER DEFAULT PRIVILEGES`). Si las crea **otro rol** (p. ej. `agropecuario`), dale permisos al panel una vez:

```sql
GRANT ALL ON ALL TABLES IN SCHEMA datos TO admin_datos_editor;
GRANT SELECT ON ALL TABLES IN SCHEMA datos TO admin_datos_lector;
```

### Usuarios y permisos

- **Administrador**: todo, incluidos constructor, consola, apariencia y usuarios.
- **Usuario**: solo los módulos asignados en `admin.user_modules`, cada uno con "Ver y exportar" o "Ver y editar" (crear, editar, borrar, importar). No ve el SQL de las consultas ni la configuración.
- Nadie puede quitarse a sí mismo el rol de administrador ni desactivarse.

### Fotos y archivos

Tipos de campo **Foto** y **Archivo adjunto**. El archivo se sube al elegirlo y se guarda en `admin.files` (en la propia base, máx. 4 MB); el campo guarda `{ id, name, mime, size }`. En tablas reales la columna debe ser `jsonb`. Solo PNG, JPG, WebP, GIF y AVIF se muestran en el navegador; lo demás se descarga. Hacen falta sesión para verlos. Los archivos de registros que se borran no se limpian solos (ocupan espacio en Neon).

### Importar y exportar

- **Exportar a Excel**: un .xlsx real (`src/admin/xlsx.ts`, empaquetado con `fflate`) con los filtros y el orden actuales, etiquetas legibles (listas, relaciones, Sí/No), números como números, encabezado en negrita y fijo, y filtros. Se abre en columnas con cualquier configuración regional; un CSV no (Excel lo parte por `,` o por `;` según el país del equipo y, si no coincide, deja cada fila en la columna A). El CSV sigue disponible con `?formato=csv`.
- **Importar**: botón Importar → elegir un Excel (.xlsx) o un CSV → emparejar columnas con campos (automático por nombre) → importar. El .xlsx se lee en el navegador. "Descargar plantilla" da un Excel con los encabezados. Acepta `7.500`, `7500,50`, `Sí/No/1/0`, `DD/MM/AAAA`, fechas de Excel, etiquetas o valores de listas y varias opciones separadas por `|`. Si una fila falla no se guarda ninguna.

### Apariencia (`/admin/apariencia`)

Nombre, subtítulo, logo (se reduce a 256 px en el navegador), color principal, color para modo oscuro (o automático), esquinas, tema por defecto y textos del login. Se guarda en `admin.settings` (clave `appearance`) y se aplica antes de pintar (`AdminLayout.astro`). El color del texto sobre el color principal se elige solo para un contraste de al menos 4,5:1.

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
6. **`modal`**: se centraba con `-translate-x-1/2 -translate-y-1/2` y se animaba con `slide-in-from-left-1/2` / `slide-in-from-top-[48%]` (patrón de Tailwind v3). En v4 `translate` y la animación van en propiedades distintas y se suman: el modal entraba desde la esquina superior izquierda. Ahora se centra con `fixed inset-0 m-auto h-fit` (sin translate) y entra con fundido y `zoom-in-95` desde el centro; además hace scroll si es más alto que la pantalla.
7. **`sidebar`**: plegado, el div de recorte seguía midiendo 240 px y, en móvil (menú superpuesto), tapaba de forma invisible los botones de la izquierda de la página. Ahora lleva `pointer-events-none` y el `nav` es `inert` mientras está plegado.
