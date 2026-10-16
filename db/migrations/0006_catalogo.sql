-- Catálogo único: el bloque Productos de la landing y el chat pueden tomar los productos del módulo "productos" del
-- panel (Sitio web → Productos → "De dónde salen los productos"). Para eso el módulo necesita, además de nombre, precio,
-- descripción y "disponible", una foto y si el precio es por unidad, por libra o por kilo ("$7.500 / lb").
--
-- Solo añade los campos que falten; no toca los que ya existan ni los registros.

UPDATE admin.modules
SET fields = fields || '[{"key": "foto", "label": "Foto", "type": "image", "help": "Se muestra en la web: queda pública al guardar."}]'::jsonb,
    updated_at = now()
WHERE module_key = 'productos'
  AND source_type = 'records'
  AND NOT fields @> '[{"key": "foto"}]'::jsonb;

UPDATE admin.modules
SET fields = fields || '[{
      "key": "precio_por",
      "label": "Precio por",
      "type": "select",
      "help": "Por libra o por kilo: el chat no lo suma al total (el negocio confirma lo que pese).",
      "options": [
        {"value": "unidad", "label": "Unidad (precio fijo)"},
        {"value": "libra", "label": "Libra"},
        {"value": "kilo", "label": "Kilo"}
      ]
    }]'::jsonb,
    updated_at = now()
WHERE module_key = 'productos'
  AND source_type = 'records'
  AND NOT fields @> '[{"key": "precio_por"}]'::jsonb;
