# Estado del proyecto · El Agropecuario

Actualizado: 15 de octubre de 2026 (noche) · Rama `main` (último commit `85c8ece`; sin subir: el arreglo del scroll del panel) · Producción: https://landing-agro-sepia.vercel.app

## Resumen

**Avance global: ~90 %.** Todo lo que se construye ya funciona y está probado. Lo que falta es, sobre todo, configuración de producción, datos reales del negocio y seguridad de credenciales, no desarrollo.

| Área | Avance | Estado |
| --- | --- | --- |
| Landing: diseño y estructura | 95 % | Completa. Faltan fotos de producto (opcional) |
| Landing: contenido real | 80 % | Faltan ciudad, Instagram y confirmar algunos datos del negocio |
| SEO técnico | 95 % | URL real (`landing-agro-sepia.vercel.app`) en canónica, sitemap, robots.txt, og:image y JSON-LD. Para dominio propio: variable `SITE_URL` |
| Legal (datos personales) | 90 % | Política de tratamiento de datos (Ley 1581) editable y aviso en el chat; faltan NIT y correo reales |
| Panel: base (login, sesiones, menú, módulos, CRUD) | 100 % | En producción |
| Panel: fase 2 (tablas, consultas SQL, consola, permisos, archivos, Excel, apariencia) | 100 % | En producción |
| Negocio: catálogo único, pedidos con aviso, números e inicio | 95 % | Hecho y probado en Develop; faltan las migraciones `0006` y `0007` en producción y, opcional, Telegram |
| Sitio web editable desde el panel | 90 % | Funciona, con 4 plantillas; falta configurar el Deploy Hook de Vercel |
| Base de datos e infraestructura | 80 % | Producción: `0001` a `0005`; faltan `0006` y `0007` (Develop ya las tiene), el Deploy Hook y la rama Develop por caducar |
| Seguridad | 75 % | Falta rotar la contraseña de Neon y cambiar la del usuario temporal |
| Calidad de código | 90 % | Refactorizado con reglas de Clean Code; las pruebas automáticas no están en el repositorio |
| Documentación | 90 % | `ADMIN.md`, `SCROLL-VIDEO.md`, skills de Clean Code y de las plantillas |

---

## Qué tiene el proyecto

### Landing (pública, estática)

- **Stack:** Astro 7 prerenderizado en Vercel, Tailwind v4, GSAP + Lenis para el scroll.
- **Bloques:** paseo con video al hacer scroll (portada), frase destacada, productos, la diferencia (comparación y proceso), opiniones, preguntas frecuentes, pedido semanal y llamado final, más cabecera y pie.
- **Pedidos por WhatsApp** con mensaje prellenado, número y botones configurables.
- **Chat de ayuda:**
  - Botón flotante con preguntas frecuentes y un pedido guiado: productos, cantidades, datos y entrega.
  - Termina abriendo WhatsApp con el pedido armado y el total estimado.
  - Cada pedido queda registrado en el panel (módulo "Pedidos de la web") con su número, estado y datos del cliente.
  - Se configura desde el panel y no tiene costo, porque no usa IA.
- **Diseño responsive:** pantalla dividida en escritorio, video a pantalla completa en móvil y menú hamburguesa.
- **Aspecto cambiable desde el panel:** 4 plantillas y 4 diseños de portada (dividida, panel, centrada y tarjeta); menú a la izquierda, al centro o a la derecha. Todos los colores salen de variables CSS, así que los bloques no cambian de código con cada plantilla.
- **SEO:**
  - title y description, Open Graph y Twitter.
  - JSON-LD: LocalBusiness, catálogo de ofertas y FAQ.
  - sitemap con imágenes, robots.txt y llms.txt.
  - página 404.
- **Política de tratamiento de datos** (`/privacidad`, Ley 1581 de 2012): enlazada en el pie y en el chat ("Al enviar tu pedido aceptas…" antes del botón de WhatsApp). Se edita en Sitio web → Privacidad.
- **Todo el contenido es editable desde el panel** (ver "Sitio web"). Sin nada publicado se ve el contenido por defecto, que es el actual.

### Panel de administración (`/admin`)

- **Acceso:**
  - Login con límite de intentos (5 en 15 min).
  - Sesiones con cookie HttpOnly y token guardado como SHA-256.
  - Contraseñas con PBKDF2 y comprobación de origen contra CSRF.
- **Navegación sin recarga** (SPA) y tema claro/oscuro.
- **Inicio:** resumen y actividad reciente, filtrados según los permisos de cada usuario.
  - **Pedidos de la web:** hoy, 7 días, por atender y ventas estimadas; gráfico por día (14) y productos más pedidos (30 días).
  - **La web en 7 días:** visitas, clics en WhatsApp, chats abiertos y pedidos por cada 100 visitas (sin cookies ni datos personales).
- **Pedidos con aviso:**
  - Contador de pendientes en el menú, que se refresca solo.
  - Aviso "Llegó un pedido nuevo." y "(n)" en la pestaña del navegador.
  - Cambio rápido de estado desde la lista y teléfonos como enlace a WhatsApp.
  - Aviso por Telegram opcional (variables `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`).
- **Catálogo único:** el bloque Productos puede tomar los productos del módulo Productos.
  - Precio por unidad, libra o kilo, y foto.
  - "Disponible" en No: sale como "Agotado" y no se puede pedir.
  - Al guardar un producto, la web se actualiza sola (con el Deploy Hook).
- **Constructor de módulos sin código.** Cada módulo puede ser de tres tipos:
  - **Registros del panel:** formulario libre con 14 tipos de campo, incluidos relación, foto y archivo.
  - **Tabla real** de la base, con su clave primaria. La tabla se crea o se cambia (`ALTER`) con SQL desde el propio constructor.
    - Del SQL salen solos los campos, las columnas y los filtros.
    - `CHECK ... IN (...)` o `ENUM` dan una lista con su filtro.
    - `REFERENCES` da una relación con el módulo de esa tabla.
    - `COMMENT ON COLUMN` da la etiqueta y `COMMENT ON TABLE` el nombre del módulo.
  - **Consulta SQL** de solo lectura (reportes y totales), con prueba previa. El SQL se puede editar después de creado el módulo.
  - En todos: columnas, filtros y orden configurables, y grupos del menú. El tipo de origen no se cambia después de crear el módulo.
- **Cada módulo ofrece:** tabla con filtros, orden y paginación; alta, edición y borrado; **exportar a Excel (.xlsx)** e **importar desde Excel o CSV** con validación de todo o nada.
- **Consola SQL** sobre el esquema `datos`:
  - Solo lectura por defecto, con confirmación antes de borrar.
  - Historial, ejemplos y lista de tablas.
- **Usuarios y permisos:** rol Administrador, o rol Usuario con acceso por módulo ("ver y exportar" o "ver y editar").
- **Apariencia:** nombre, logo, tema por defecto, foto y textos del login, con vista previa en vivo.
  - **Colores del panel:** por defecto, los de la plantilla publicada en la web (colores, esquinas y tipografías, en modo claro y oscuro); al publicar otra plantilla, el panel cambia al momento. Opción "Propios del panel" para usar un color principal y unas esquinas propios.
- **Sitio web:**
  - Edita la landing por bloques: textos, listas, fotos, video, colores, tipografías, orden y visibilidad.
  - **4 plantillas de diseño** (Finca, Órbita, Atardecer y Lima), cada una con colores, tipografía, esquinas, menú, pie y su propia portada.
    - Al elegir una, se guarda en el borrador; se publica con el botón Publicar.
    - El login y el panel se visten con la plantilla publicada.
  - **Colores y tipografía**, en grupos:
    - **Página:** fondo, texto, acento y degradado del titular.
    - **Botones:** texto, degradado y esquinas.
    - **Menú y pie de página:** posición del menú (izquierda, centro o derecha), y fondo y texto del menú y del pie.
    - **Tipografía:** fuentes y grosor de títulos.
  - **Colores propios por bloque.** En la portada van arriba, como "Colores de la portada": el fondo es el velo sobre el video. Un aviso indica qué bloques no siguen los colores de la página y permite quitárselos a todos.
  - Diseño de portada elegible y avisos de contraste (WCAG) en el tema y en cada bloque.
  - También el chat de ayuda: preguntas, pasos del pedido y mensaje de WhatsApp.
  - Borrador, vista previa, publicar (redespliega la web vía Deploy Hook) y recuperar versiones anteriores.
- **Auditoría** de cada cambio (`admin.audit_log`).

### Base de datos (Neon PostgreSQL)

- **Ramas:** `production` (la de la web) y `Develop` (pruebas locales).
- **Esquemas:**
  - `admin`: usuarios, sesiones, módulos, registros, auditoría, ajustes, archivos, permisos y versiones del sitio.
  - `datos`: tablas de negocio y la vista `registros`.
- **Aislamiento:** lo que escribe la gente se ejecuta con roles sin acceso a `admin` (`admin_datos_editor` y `admin_datos_lector`), con tiempo máximo por sentencia.
- **Migraciones aplicadas en producción:** `0001` a `0005`.
- **Pendientes en producción:**
  - `0006_catalogo` (foto y "Precio por" en el módulo Productos).
  - `0007_metricas_web` (tabla `admin.web_events`).
  - Sin ellas el código funciona igual: el catálogo sin foto ni precio por peso, y las métricas en cero.

### Código

- **Tamaño aproximado:**
  - Landing: ~7 200 líneas.
  - Panel (interfaz): ~6 200.
  - Servidor y API: ~2 200, en 25 endpoints.
  - Dominio compartido: ~800.
- **Arquitectura por capas:** dominio, servidor, API, hooks, `lib` y componentes. Los `.tsx` solo pintan; la lógica está en hooks y en `.ts`. Las reglas están en `.claude/skills/clean-code/SKILL.md` y en `ADMIN.md`.
- **Verificado el 15/10/2026:**
  - El build compila y TypeScript no reporta errores en todo el proyecto.
  - Pasan las pruebas de punta a punta de la API (fase 2, Sitio web, pedidos del chat y módulos creados solo con SQL) y los recorridos en el navegador del panel y de la landing, en escritorio y móvil.
  - Plantillas: cada una sin avisos de contraste; aplicarla conserva textos y fotos; la vista previa, el login y el panel la muestran.
  - El panel no desplaza la página: solo el contenido hace scroll y el menú lateral queda fijo (7 pantallas, ventana normal y muy baja).
  - **Catálogo único:**
    - La web y el chat usan los productos del módulo, en orden.
    - El agotado no se puede pedir.
    - La foto se vuelve pública al guardar.
  - **Pedidos:**
    - Contador del menú y aviso al llegar uno.
    - Cambio rápido de estado.
    - Enlace a WhatsApp.
  - **Inicio:**
    - Números de pedidos, ventas, gráfico y más pedidos.
    - Medición de visitas, clics y chats (una visita por sesión, sin contar la vista previa).
- **Arreglados hoy:**
  - Apariencia no dejaba guardar (Guardar y Descartar quedaban desactivados tras cualquier cambio).
  - Una plantilla aplicada no se veía en una pestaña de vista previa abierta de antes.
  - En algunas pantallas del panel se desplazaba la página entera con el menú lateral.

---

## Pendientes

### Críticos (antes de considerarlo terminado)

1. **Datos de la política de privacidad** (Sitio web → Privacidad): NIT o cédula y correo reales (hoy dicen "[NIT o cédula]" y "[correo de contacto]"). El texto es una base que cumple la estructura de la Ley 1581; conviene que lo revise quien lleve lo legal del negocio.
2. **Rotar la contraseña de `neondb_owner`** en Neon (Roles → Reset password). Quedó escrita en el chat. Después hay que actualizar `DATABASE_URL` en Vercel y el `.env`.
3. **Cambiar la contraseña del usuario temporal** `agropecuario@hotmail.com` (`Agro2026-temp`) desde Usuarios y permisos, o crear el definitivo y borrar el temporal.
4. **Deploy Hook de Vercel:** crear el hook para `main`, guardarlo como `VERCEL_DEPLOY_HOOK` (Production) y hacer Redeploy. Sin él, "Publicar" en Sitio web no actualiza la web sola.

### Importantes

4b. **Migraciones `0006` y `0007` en producción** (catálogo y métricas). Después, si quieres el catálogo único:
   - En el módulo Productos, crea los productos reales con su precio, "Precio por" y foto.
   - En Sitio web → Productos, elige "Los del módulo Productos" y publica.
4c. **Aviso por Telegram (opcional):** crear el bot y poner `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en Vercel. Los pasos están en `ADMIN.md`.
5. **La rama `Develop` de Neon caduca el 21/10/2026** (en 6 días). Hay que quitarle la caducidad en Neon o crear otra y actualizar el `.env`.
6. **Datos reales en la landing** (se cambian desde Sitio web):
   - Ciudad: hoy dice "[Ciudad]".
   - Instagram: hoy dice "@[cuenta]"; si no hay cuenta, se deja vacío y no se muestra.
   - Si el domicilio tiene costo en pedidos solo de huevos.
   - Si se ofrece el pedido semanal (si no, se oculta el bloque).
   - Revisar textos de crianza ("crianza libre, maíz y hierba") frente a la realidad del galpón.
7. **Contraseña del rol `agropecuario`** de la base (la que se creó para conectarse desde un IDE): es débil. Conviene cambiarla.

### Mejoras sugeridas (no bloquean)

- Llevar las pruebas de punta a punta (API y navegador) al repositorio. Hoy están fuera del proyecto, en una carpeta temporal.
- `.claude/` está en `.gitignore`: la skill de Clean Code no se sube. Si el equipo la necesita, quitar esa línea.
- En los formularios, los interruptores Sí/No empiezan en "No" aunque la columna de la tabla tenga `DEFAULT true`.
- Los archivos de registros borrados no se limpian solos de la base (ocupan espacio en Neon).
- Fotos de producto: con el catálogo único se suben en el módulo Productos.
- Unir "Pedidos" (manual) y "Pedidos de la web" en uno solo, si el negocio no necesita los dos.
- Clientes armados solos a partir de los pedidos (historial y quién repite).
- "Pasar a tabla de la base" para módulos de Registros del panel (como Categorías): crear la tabla, copiar los registros y poder manejarlos con SQL.
- "Intensidad del velo" en la portada (suave, media o fuerte): hoy la fija cada diseño de portada.
- Las plantillas solo cambian el aspecto. Si más adelante se quieren variantes de diseño en otros bloques (como ya tiene la portada), el modelo lo admite.
- Llevar a nuvo-ui los arreglos hechos aquí (modal, sidebar, dashboard-layout, login); ver la lista en `ADMIN.md`.
- Node 25 en local frente a Node 24 en Vercel: usar Node 22 o 24 también en local para evitar diferencias.

---

## Dónde está cada cosa

| Documento | Para qué |
| --- | --- |
| `ADMIN.md` | Arquitectura, tablas, API, seguridad, comandos, puesta en producción, Sitio web y fase 2 |
| `SCROLL-VIDEO.md` | Guía para reutilizar el efecto de video al hacer scroll en otras webs |
| `.claude/skills/clean-code/SKILL.md` | Reglas de código: dónde va cada cosa y lista de comprobación |
| `.claude/skills/plantilla-*/SKILL.md` | Referencia de estilo de cada plantilla (Órbita, Atardecer y Lima) y qué se ajustó |
| `src/features/landing/domain/plantillas.ts` | Las plantillas: tema, colores por bloque y portada de cada una |
| `db/migrations/` | Cambios de la base, en orden (`pnpm db:migrate`) |
| `db/validar.sql` | Consultas de solo lectura para revisar la base de producción |
