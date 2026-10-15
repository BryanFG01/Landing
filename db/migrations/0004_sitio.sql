-- Contenido de la landing editable desde el panel (Sitio web).
--
-- El borrador y lo publicado viven en admin.settings (claves 'site_draft' y 'site_published'). La landing es estática:
-- se construye con 'site_published' y el botón Publicar lanza un nuevo despliegue en Vercel. Cada publicación queda
-- guardada en admin.site_versions para poder volver atrás.

CREATE TABLE admin.site_versions (
  id           integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content      jsonb       NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  published_by integer     REFERENCES admin.users (id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_versions_published_idx ON admin.site_versions (published_at DESC);

-- Las imágenes de la landing son públicas (se sirven en /media/<id> sin sesión). Las de los registros, no.
ALTER TABLE admin.files ADD COLUMN public boolean NOT NULL DEFAULT false;
