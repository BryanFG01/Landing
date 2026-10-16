-- Métricas de la landing para el inicio del panel: visitas, clics en WhatsApp y chats abiertos, contados por día.
-- Sin cookies ni datos personales: solo un contador por día y tipo de evento (no hace falta aviso de cookies).

CREATE TABLE admin.web_events (
  day   date    NOT NULL,
  event text    NOT NULL CHECK (event IN ('visita', 'whatsapp', 'chat')),
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event)
);

COMMENT ON TABLE admin.web_events IS 'Contadores diarios de la landing (visitas, clics en WhatsApp, chats abiertos). Sin datos personales.';
