# Estado del proyecto · El Agropecuario

Actualizado: 15 de octubre de 2026 · Rama `main` (último commit `226006f`) · Producción: https://landing-agro-sepia.vercel.app

## Resumen

**Avance global: ~90 %.** Todo lo que se construye ya funciona y está probado. Lo que falta es, sobre todo, configuración de producción, datos reales del negocio y seguridad de credenciales, no desarrollo.

| Área | Avance | Estado |
| --- | --- | --- |
| Landing: diseño y estructura | 95 % | Completa. Faltan fotos de producto (opcional) |
| Landing: contenido real | 80 % | Faltan ciudad, Instagram y confirmar algunos datos del negocio |
| SEO técnico | 75 % | Todo hecho **salvo la URL del sitio** (sigue en `localhost`) |
| Panel: base (login, sesiones, menú, módulos, CRUD) | 100 % | En producción |
| Panel: fase 2 (tablas, consultas SQL, consola, permisos, archivos, Excel, apariencia) | 100 % | En producción |
| Sitio web editable desde el panel | 90 % | Funciona; falta configurar el Deploy Hook de Vercel |
| Base de datos e infraestructura | 85 % | 5 migraciones aplicadas en producción; faltan Deploy Hook y rama Develop por caducar |
| Seguridad | 75 % | Falta rotar la contraseña de Neon y cambiar la del usuario temporal |
| Calidad de código | 90 % | Refactorizado con reglas de Clean Code; las pruebas automáticas no están en el repositorio |
| Documentación | 90 % | `ADMIN.md`, `SCROLL-VIDEO.md`, skill de Clean Code |

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
- **SEO:**
  - title y description, Open Graph y Twitter.
  - JSON-LD: LocalBusiness, catálogo de ofertas y FAQ.
  - sitemap con imágenes, robots.txt y llms.txt.
  - página 404.
- **Todo el contenido es editable desde el panel** (ver "Sitio web"). Sin nada publicado se ve el contenido por defecto, que es el actual.

### Panel de administración (`/admin`)

- **Acceso:**
  - Login con límite de intentos (5 en 15 min).
  - Sesiones con cookie HttpOnly y token guardado como SHA-256.
  - Contraseñas con PBKDF2 y comprobación de origen contra CSRF.
- **Navegación sin recarga** (SPA) y tema claro/oscuro.
- **Inicio:** resumen y actividad reciente, filtrados según los permisos de cada usuario.
- **Constructor de módulos sin código.** Cada módulo puede ser de tres tipos:
  - **Registros del panel:** formulario libre con 14 tipos de campo, incluidos relación, foto y archivo.
  - **Tabla real** de la base, con su clave primaria. La tabla se puede crear con SQL desde el propio constructor.
  - **Consulta SQL** de solo lectura (reportes y totales), con prueba previa.
  - En todos: columnas, filtros y orden configurables, y grupos del menú.
- **Cada módulo ofrece:** tabla con filtros, orden y paginación; alta, edición y borrado; **exportar a Excel (.xlsx)** e **importar desde Excel o CSV** con validación de todo o nada.
- **Consola SQL** sobre el esquema `datos`:
  - Solo lectura por defecto, con confirmación antes de borrar.
  - Historial, ejemplos y lista de tablas.
- **Usuarios y permisos:** rol Administrador, o rol Usuario con acceso por módulo ("ver y exportar" o "ver y editar").
- **Apariencia:** nombre, logo, colores, esquinas, tema por defecto y textos del login, con vista previa en vivo.
- **Sitio web:**
  - Edita la landing por bloques: textos, listas, fotos, video, colores, tipografías, orden y visibilidad.
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

### Código

- **Tamaño aproximado:**
  - Landing: ~7 200 líneas.
  - Panel (interfaz): ~6 200.
  - Servidor y API: ~2 200, en 25 endpoints.
  - Dominio compartido: ~800.
- **Arquitectura por capas:** dominio, servidor, API, hooks, `lib` y componentes. Los `.tsx` solo pintan; la lógica está en hooks y en `.ts`. Las reglas están en `.claude/skills/clean-code/SKILL.md` y en `ADMIN.md`.
- **Verificado el 15/10/2026:**
  - El build compila y TypeScript no reporta errores en todo el proyecto.
  - Pasan las pruebas de punta a punta de la API (fase 2, Sitio web y pedidos del chat) y los recorridos en el navegador del panel y de la landing, en escritorio y móvil.

---

## Pendientes

### Críticos (antes de considerarlo terminado)

1. **URL del sitio.** En `astro.config.mjs`, `site: 'http://localhost:4321'` hace que canónica, sitemap, robots.txt, og:image y JSON-LD apunten a localhost en producción. Hay que cambiarla por el dominio real (`https://landing-agro-sepia.vercel.app` o el dominio propio), hacer commit y desplegar.
2. **Rotar la contraseña de `neondb_owner`** en Neon (Roles → Reset password). Quedó escrita en el chat. Después hay que actualizar `DATABASE_URL` en Vercel y el `.env`.
3. **Cambiar la contraseña del usuario temporal** `agropecuario@hotmail.com` (`Agro2026-temp`) desde Usuarios y permisos, o crear el definitivo y borrar el temporal.
4. **Deploy Hook de Vercel:** crear el hook para `main`, guardarlo como `VERCEL_DEPLOY_HOOK` (Production) y hacer Redeploy. Sin él, "Publicar" en Sitio web no actualiza la web sola.

### Importantes

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
- Fotos de producto en el bloque Productos (el campo ya existe en el editor).
- Llevar a nuvo-ui los arreglos hechos aquí (modal, sidebar, dashboard-layout, login); ver la lista en `ADMIN.md`.
- Node 25 en local frente a Node 24 en Vercel: usar Node 22 o 24 también en local para evitar diferencias.

---

## Dónde está cada cosa

| Documento | Para qué |
| --- | --- |
| `ADMIN.md` | Arquitectura, tablas, API, seguridad, comandos, puesta en producción, Sitio web y fase 2 |
| `SCROLL-VIDEO.md` | Guía para reutilizar el efecto de video al hacer scroll en otras webs |
| `.claude/skills/clean-code/SKILL.md` | Reglas de código: dónde va cada cosa y lista de comprobación |
| `db/migrations/` | Cambios de la base, en orden (`pnpm db:migrate`) |
| `db/validar.sql` | Consultas de solo lectura para revisar la base de producción |
