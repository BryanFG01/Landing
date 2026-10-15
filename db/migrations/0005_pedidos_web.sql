-- Módulo "Pedidos de la web": cada pedido hecho en el chat de la landing se guarda aquí como Pendiente (además de
-- abrirse en WhatsApp). Es un módulo normal: se puede cambiar desde el constructor. El chat escribe estas claves de
-- campo: cliente, telefono, productos, total, entrega, direccion, nota, estado, origen.
-- Si ya existe un módulo con esta clave no se toca.

INSERT INTO admin.modules (module_key, name, description, group_id, icon, sort_order, fields, column_configs, filters, default_sort, default_dir, page_size)
SELECT 'pedidos_web', 'Pedidos de la web', 'Pedidos hechos en el chat de la página. Llegan como Pendientes: confírmalos por WhatsApp.',
  (SELECT id FROM admin.module_groups WHERE name = 'Ventas' ORDER BY id LIMIT 1), 'shopping-cart', 0,
  '[
    {"key":"cliente","label":"Cliente","type":"text","required":true,"max_length":80},
    {"key":"telefono","label":"Teléfono","type":"phone","required":true},
    {"key":"productos","label":"Productos","type":"textarea","required":true},
    {"key":"total","label":"Total (precio fijo)","type":"currency","min":0,"help":"Lo que se cobra por peso se suma al confirmar."},
    {"key":"estado","label":"Estado","type":"select","required":true,"options":[
      {"value":"pendiente","label":"Pendiente"},{"value":"confirmado","label":"Confirmado"},
      {"value":"entregado","label":"Entregado"},{"value":"cancelado","label":"Cancelado"}
    ]},
    {"key":"entrega","label":"Entrega","type":"text"},
    {"key":"direccion","label":"Dirección","type":"text","required":true},
    {"key":"nota","label":"Nota","type":"textarea"},
    {"key":"origen","label":"Origen","type":"text"}
  ]',
  '[
    {"column":"id","headerText":"N.º","data_type":"number","align":"left","sortable":true,"null_display":"—"},
    {"column":"created_at","headerText":"Recibido","data_type":"datetime","align":"left","sortable":true,"null_display":"—"},
    {"column":"cliente","headerText":"Cliente","data_type":"text","align":"left","sortable":true,"null_display":"—"},
    {"column":"telefono","headerText":"Teléfono","data_type":"text","align":"left","sortable":false,"null_display":"—"},
    {"column":"productos","headerText":"Productos","data_type":"text","align":"left","sortable":false,"null_display":"—"},
    {"column":"total","headerText":"Total","data_type":"currency","align":"right","sortable":true,"null_display":"Por peso"},
    {"column":"entrega","headerText":"Entrega","data_type":"text","align":"left","sortable":false,"null_display":"—"},
    {"column":"estado","headerText":"Estado","data_type":"badge","align":"left","sortable":true,"null_display":"—"}
  ]',
  '[
    {"name":"buscar","label":"Buscar","field":"*","control":"text"},
    {"name":"estado","label":"Estado","field":"estado","control":"multiselect"},
    {"name":"recibido","label":"Recibido","field":"created_at","control":"daterange"}
  ]',
  'created_at', 'desc', 20
WHERE NOT EXISTS (SELECT 1 FROM admin.modules WHERE module_key = 'pedidos_web');
