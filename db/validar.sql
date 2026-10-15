-- Validación de la base del panel (producción o cualquier rama). Solo lectura: no modifica nada.
-- Ábrelo en pgAdmin 4 (Query Tool) o DBeaver conectado con el host SIN -pooler y ejecuta bloque a bloque.

-- 1. ¿Existen los esquemas? Esperado: admin, datos.
SELECT nspname AS esquema
FROM pg_namespace
WHERE nspname IN ('admin', 'datos')
ORDER BY 1;

-- 2. Migraciones aplicadas. Esperado: 0001_admin.sql y 0002_modulos_iniciales.sql.
SELECT name AS migracion, applied_at AS aplicada
FROM admin.schema_migrations
ORDER BY name;

-- 3. Tablas del panel y número exacto de filas.
--    Esperado: audit_log, module_groups, modules, records, schema_migrations, sessions, settings, users.
SELECT t.table_name AS tabla,
       (xpath('/row/n/text()',
              query_to_xml(format('SELECT COUNT(*) AS n FROM admin.%I', t.table_name), false, true, '')))[1]::text::int AS filas
FROM information_schema.tables t
WHERE t.table_schema = 'admin' AND t.table_type = 'BASE TABLE'
ORDER BY 1;

-- 4. Administradores (sin el hash de la contraseña). Esperado: al menos uno activo.
SELECT id, email, name, is_active AS activo, last_login_at AS ultimo_acceso, created_at AS creado
FROM admin.users
ORDER BY id;

-- 5. Grupos del menú. Esperado: Catálogo, Ventas.
SELECT id, name AS grupo, sort_order AS orden
FROM admin.module_groups
ORDER BY sort_order, name;

-- 6. Módulos: lo que se ve en el sidebar. Esperado: categorias, productos, pedidos.
SELECT m.id,
       m.module_key                       AS clave,
       m.name                             AS modulo,
       g.name                             AS grupo,
       m.is_active                        AS activo,
       m.source_type                      AS origen,
       jsonb_array_length(m.fields)         AS campos,
       jsonb_array_length(m.column_configs) AS columnas,
       jsonb_array_length(m.filters)        AS filtros,
       (SELECT COUNT(*) FROM admin.records r WHERE r.module_id = m.id) AS registros
FROM admin.modules m
LEFT JOIN admin.module_groups g ON g.id = m.group_id
ORDER BY g.sort_order NULLS LAST, m.sort_order, m.name;

-- 7. Campos de un módulo (cambia 'pedidos' por la clave que quieras revisar).
SELECT f->>'key' AS campo, f->>'label' AS etiqueta, f->>'type' AS tipo, COALESCE((f->>'required')::boolean, false) AS obligatorio
FROM admin.modules m, jsonb_array_elements(m.fields) f
WHERE m.module_key = 'pedidos';

-- 8. Últimos registros de un módulo, con sus datos (cambia 'pedidos').
SELECT r.id, r.data, r.created_at AS creado, r.updated_at AS actualizado
FROM admin.records r
JOIN admin.modules m ON m.id = r.module_id
WHERE m.module_key = 'pedidos'
ORDER BY r.created_at DESC
LIMIT 20;

-- 9. Sesiones abiertas ahora (quién tiene sesión iniciada).
SELECT u.email, s.created_at AS inicio, s.expires_at AS caduca
FROM admin.sessions s
JOIN admin.users u ON u.id = s.user_id
WHERE s.expires_at > now()
ORDER BY s.created_at DESC;

-- 10. Actividad reciente (auditoría).
SELECT a.created_at AS cuando, u.email AS usuario, a.action AS accion, m.name AS modulo, a.record_id AS registro, a.subject
FROM admin.audit_log a
LEFT JOIN admin.users u ON u.id = a.user_id
LEFT JOIN admin.modules m ON m.id = a.module_id
ORDER BY a.id DESC
LIMIT 30;

-- 11. Intentos de login fallidos en la última hora (5 en 15 min bloquean ese correo).
SELECT subject AS correo, COUNT(*) AS fallos, MAX(created_at) AS ultimo
FROM admin.audit_log
WHERE action = 'login_failed' AND created_at > now() - interval '1 hour'
GROUP BY subject
ORDER BY fallos DESC;

-- 12. Integridad: campos de relación que apuntan a módulos que ya no existen. Esperado: 0 filas.
SELECT m.module_key AS modulo, f->>'key' AS campo, f->>'relation_module' AS apunta_a
FROM admin.modules m, jsonb_array_elements(m.fields) f
WHERE f->>'type' = 'relation'
  AND NOT EXISTS (SELECT 1 FROM admin.modules t WHERE t.module_key = f->>'relation_module');

-- 13. Integridad: registros cuyo campo de relación apunta a un registro borrado. Esperado: 0 filas.
SELECT m.module_key AS modulo, r.id AS registro, f->>'key' AS campo, r.data->>(f->>'key') AS id_apuntado
FROM admin.modules m
CROSS JOIN LATERAL jsonb_array_elements(m.fields) f
JOIN admin.records r ON r.module_id = m.id
WHERE f->>'type' = 'relation'
  AND r.data ? (f->>'key')
  AND NOT EXISTS (SELECT 1 FROM admin.records t WHERE t.id::text = r.data->>(f->>'key'));

-- 14. Tablas de negocio en el esquema "datos" (vacío hasta que se creen desde el panel).
SELECT table_name AS tabla
FROM information_schema.tables
WHERE table_schema = 'datos'
ORDER BY 1;
