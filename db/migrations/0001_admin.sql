-- Panel de administración dinámico (PostgreSQL / Neon).
--
-- Dos esquemas:
--   admin  → lo interno del panel: usuarios, sesiones, definición de módulos, registros, auditoría, ajustes.
--   datos  → tablas de negocio que se crean desde el panel (consola SQL / módulos sobre tablas reales).
--
-- Todo lo que se ve en el admin sale de aquí: los grupos y módulos del sidebar y, dentro de cada módulo, sus campos
-- (formulario), columnas (tabla) y filtros. Crear un módulo es insertar una fila en admin.modules.

CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS datos;

-- ─── Administradores ─────────────────────────────────────────────────────────
CREATE TABLE admin.users (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         text        NOT NULL,
  name          text        NOT NULL,
  -- pbkdf2$<iteraciones>$<sal base64>$<hash base64>
  password_hash text        NOT NULL,
  is_active     boolean     NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_key ON admin.users (lower(email));

-- La cookie lleva un token aleatorio; aquí solo se guarda su SHA-256.
CREATE TABLE admin.sessions (
  id         text        PRIMARY KEY,
  user_id    integer     NOT NULL REFERENCES admin.users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON admin.sessions (user_id);
CREATE INDEX sessions_expires_idx ON admin.sessions (expires_at);

-- ─── Sidebar: grupos y módulos ───────────────────────────────────────────────
CREATE TABLE admin.module_groups (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text        NOT NULL,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin.modules (
  id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Clave de negocio (slug). Va en la URL: /admin/m/<module_key>.
  module_key     text        NOT NULL UNIQUE CHECK (module_key ~ '^[a-z][a-z0-9_]{1,47}$'),
  name           text        NOT NULL,
  description    text,
  group_id       integer     REFERENCES admin.module_groups (id) ON DELETE SET NULL,
  icon           text,
  sort_order     integer     NOT NULL DEFAULT 0,
  -- Campos del formulario: [{ key, label, type, required, options, ... }]
  fields         jsonb       NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(fields) = 'array'),
  -- Columnas de la tabla: [{ column, headerText, data_type, align, sortable, null_display }]
  column_configs jsonb       NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(column_configs) = 'array'),
  -- Filtros: [{ name, label, field, control, operator }]
  filters        jsonb       NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(filters) = 'array'),
  default_sort   text        NOT NULL DEFAULT 'created_at',
  default_dir    text        NOT NULL DEFAULT 'desc' CHECK (default_dir IN ('asc', 'desc')),
  page_size      integer     NOT NULL DEFAULT 20 CHECK (page_size BETWEEN 5 AND 100),
  is_active      boolean     NOT NULL DEFAULT true,
  -- De dónde salen los datos: records (admin.records), table (tabla real en "datos"), query (SELECT de solo lectura).
  source_type    text        NOT NULL DEFAULT 'records' CHECK (source_type IN ('records', 'table', 'query')),
  source         text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX modules_group_idx ON admin.modules (group_id, sort_order);

-- ─── Registros de los módulos de tipo "records" ──────────────────────────────
CREATE TABLE admin.records (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  module_id  integer     NOT NULL REFERENCES admin.modules (id) ON DELETE CASCADE,
  data       jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(data) = 'object'),
  created_by integer     REFERENCES admin.users (id) ON DELETE SET NULL,
  updated_by integer     REFERENCES admin.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX records_module_idx ON admin.records (module_id, created_at DESC);

-- ─── Auditoría ───────────────────────────────────────────────────────────────
-- login, login_failed, logout, create, update, delete, module_*, group_*, user_*, sql.
CREATE TABLE admin.audit_log (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    integer     REFERENCES admin.users (id) ON DELETE SET NULL,
  action     text        NOT NULL,
  module_id  integer,
  record_id  integer,
  -- Para login_failed: el correo intentado, para limitar intentos.
  subject    text,
  detail     jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_created_idx ON admin.audit_log (created_at DESC);
CREATE INDEX audit_login_idx ON admin.audit_log (action, subject, created_at);

-- ─── Ajustes del panel (apariencia, etc.) ────────────────────────────────────
CREATE TABLE admin.settings (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
