-- Fase 2 del panel: módulos sobre tablas reales y consultas SQL, consola SQL, permisos por usuario, archivos y
-- apariencia.
--
-- Lo que se ejecuta desde el panel contra el esquema "datos" (consola, módulos de tabla y de consulta) no corre con el
-- usuario dueño de la base: cada transacción cambia a uno de estos roles sin login.
--   admin_datos_editor → lee y escribe en "datos" (consola con cambios, módulos de tabla). Sin acceso a "admin".
--   admin_datos_lector → solo lee "datos" (consola en solo lectura, módulos de consulta).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_datos_editor') THEN
    CREATE ROLE admin_datos_editor NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_datos_lector') THEN
    CREATE ROLE admin_datos_lector NOLOGIN;
  END IF;
END $$;

-- El usuario de la web necesita ser miembro para poder hacer SET ROLE.
GRANT admin_datos_editor TO CURRENT_USER;
GRANT admin_datos_lector TO CURRENT_USER;

GRANT USAGE, CREATE ON SCHEMA datos TO admin_datos_editor;
GRANT USAGE ON SCHEMA datos TO admin_datos_lector;
GRANT ALL ON ALL TABLES IN SCHEMA datos TO admin_datos_editor;
GRANT ALL ON ALL SEQUENCES IN SCHEMA datos TO admin_datos_editor;
GRANT SELECT ON ALL TABLES IN SCHEMA datos TO admin_datos_lector;

-- Tablas que se creen después: desde el panel (dueño admin_datos_editor) o desde un IDE con el usuario dueño.
ALTER DEFAULT PRIVILEGES IN SCHEMA datos GRANT ALL ON TABLES TO admin_datos_editor;
ALTER DEFAULT PRIVILEGES IN SCHEMA datos GRANT ALL ON SEQUENCES TO admin_datos_editor;
ALTER DEFAULT PRIVILEGES IN SCHEMA datos GRANT SELECT ON TABLES TO admin_datos_lector;
ALTER DEFAULT PRIVILEGES FOR ROLE admin_datos_editor IN SCHEMA datos GRANT SELECT ON TABLES TO admin_datos_lector;

-- Los registros de los módulos del panel, legibles desde las consultas: SELECT ... FROM registros WHERE modulo = 'pedidos'.
-- La vista corre con los permisos de su dueño, así que los roles de arriba la leen sin tocar el esquema admin.
CREATE VIEW datos.registros AS
SELECT r.id, m.module_key AS modulo, r.data, r.created_at, r.updated_at
FROM admin.records r
JOIN admin.modules m ON m.id = r.module_id;
GRANT SELECT ON datos.registros TO admin_datos_editor, admin_datos_lector;

-- ─── Módulos de tabla: columna clave ─────────────────────────────────────────
ALTER TABLE admin.modules ADD COLUMN source_pk text;

-- ─── Permisos ────────────────────────────────────────────────────────────────
-- admin: todo el panel. usuario: solo los módulos que tenga asignados en admin.user_modules.
ALTER TABLE admin.users ADD COLUMN role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'usuario'));

CREATE TABLE admin.user_modules (
  user_id   integer NOT NULL REFERENCES admin.users (id) ON DELETE CASCADE,
  module_id integer NOT NULL REFERENCES admin.modules (id) ON DELETE CASCADE,
  -- false: solo ver y exportar. true: también crear, editar, borrar e importar.
  can_edit  boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, module_id)
);

-- ─── Archivos (fotos y adjuntos de los registros) ────────────────────────────
-- Se guardan en la propia base: sin servicios extra. Límite de 4 MB por archivo (lo fija la API).
CREATE TABLE admin.files (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  mime       text        NOT NULL,
  size       integer     NOT NULL,
  data       bytea       NOT NULL,
  created_by integer     REFERENCES admin.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
