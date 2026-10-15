-- Módulos de partida para la finca. Son filas normales de admin.modules: se cambian o borran desde el constructor.

INSERT INTO admin.module_groups (name, sort_order) VALUES ('Catálogo', 1), ('Ventas', 2);

INSERT INTO admin.modules (module_key, name, description, group_id, icon, sort_order, fields, column_configs, filters, default_sort, default_dir, page_size)
SELECT 'categorias', 'Categorías', 'Familias de productos: huevos, pollo, combos…', g.id, 'tag', 1,
  '[
    {"key":"nombre","label":"Nombre","type":"text","required":true,"max_length":60},
    {"key":"descripcion","label":"Descripción","type":"textarea"},
    {"key":"activa","label":"Activa","type":"boolean"}
  ]',
  '[
    {"column":"nombre","headerText":"Nombre","data_type":"text","align":"left","sortable":true,"null_display":"—"},
    {"column":"descripcion","headerText":"Descripción","data_type":"text","align":"left","sortable":false,"null_display":"—"},
    {"column":"activa","headerText":"Activa","data_type":"boolean","align":"left","sortable":true,"null_display":"—"}
  ]',
  '[
    {"name":"buscar","label":"Buscar","field":"*","control":"text"},
    {"name":"activa","label":"Solo activas","field":"activa","control":"boolean"}
  ]',
  'nombre', 'asc', 20
FROM admin.module_groups g WHERE g.name = 'Catálogo';

INSERT INTO admin.modules (module_key, name, description, group_id, icon, sort_order, fields, column_configs, filters, default_sort, default_dir, page_size)
SELECT 'productos', 'Productos', 'Lo que se vende: precio, presentación y disponibilidad.', g.id, 'package', 2,
  '[
    {"key":"nombre","label":"Nombre","type":"text","required":true,"max_length":80},
    {"key":"categoria","label":"Categoría","type":"relation","required":true,"relation_module":"categorias","relation_label":"nombre"},
    {"key":"precio","label":"Precio","type":"currency","required":true,"min":0},
    {"key":"presentacion","label":"Presentación","type":"select","required":true,"options":[
      {"value":"unidad","label":"Unidad"},{"value":"media_cubeta","label":"Media cubeta (15)"},
      {"value":"cubeta","label":"Cubeta (30)"},{"value":"entero","label":"Pollo entero"},{"value":"despresado","label":"Pollo despresado"}
    ]},
    {"key":"disponible","label":"Disponible","type":"boolean"},
    {"key":"descripcion","label":"Descripción","type":"textarea","max_length":400}
  ]',
  '[
    {"column":"nombre","headerText":"Producto","data_type":"text","align":"left","sortable":true,"null_display":"—"},
    {"column":"categoria","headerText":"Categoría","data_type":"badge","align":"left","sortable":false,"null_display":"—"},
    {"column":"presentacion","headerText":"Presentación","data_type":"text","align":"left","sortable":true,"null_display":"—"},
    {"column":"precio","headerText":"Precio","data_type":"currency","align":"right","sortable":true,"null_display":"—"},
    {"column":"disponible","headerText":"Disponible","data_type":"boolean","align":"left","sortable":true,"null_display":"—"}
  ]',
  '[
    {"name":"buscar","label":"Buscar","field":"*","control":"text"},
    {"name":"categoria","label":"Categoría","field":"categoria","control":"multiselect"},
    {"name":"presentacion","label":"Presentación","field":"presentacion","control":"multiselect"},
    {"name":"precio_max","label":"Precio hasta","field":"precio","control":"number","operator":"lte"},
    {"name":"disponible","label":"Solo disponibles","field":"disponible","control":"boolean"}
  ]',
  'nombre', 'asc', 20
FROM admin.module_groups g WHERE g.name = 'Catálogo';

INSERT INTO admin.modules (module_key, name, description, group_id, icon, sort_order, fields, column_configs, filters, default_sort, default_dir, page_size)
SELECT 'pedidos', 'Pedidos', 'Pedidos que llegan por WhatsApp y su estado de entrega.', g.id, 'shopping-cart', 1,
  '[
    {"key":"cliente","label":"Cliente","type":"text","required":true},
    {"key":"telefono","label":"Teléfono","type":"phone","placeholder":"300 000 0000"},
    {"key":"producto","label":"Producto","type":"relation","required":true,"relation_module":"productos","relation_label":"nombre"},
    {"key":"cantidad","label":"Cantidad","type":"number","required":true,"min":1},
    {"key":"total","label":"Total","type":"currency","min":0},
    {"key":"estado","label":"Estado","type":"select","required":true,"options":[
      {"value":"pendiente","label":"Pendiente"},{"value":"confirmado","label":"Confirmado"},
      {"value":"entregado","label":"Entregado"},{"value":"cancelado","label":"Cancelado"}
    ]},
    {"key":"fecha_entrega","label":"Fecha de entrega","type":"date"},
    {"key":"direccion","label":"Dirección","type":"text"},
    {"key":"notas","label":"Notas","type":"textarea"}
  ]',
  '[
    {"column":"id","headerText":"N.º","data_type":"number","align":"left","sortable":true,"null_display":"—"},
    {"column":"cliente","headerText":"Cliente","data_type":"text","align":"left","sortable":true,"null_display":"—"},
    {"column":"producto","headerText":"Producto","data_type":"text","align":"left","sortable":false,"null_display":"—"},
    {"column":"cantidad","headerText":"Cant.","data_type":"number","align":"right","sortable":true,"null_display":"—"},
    {"column":"total","headerText":"Total","data_type":"currency","align":"right","sortable":true,"null_display":"—"},
    {"column":"estado","headerText":"Estado","data_type":"badge","align":"left","sortable":true,"null_display":"—"},
    {"column":"fecha_entrega","headerText":"Entrega","data_type":"date","align":"left","sortable":true,"null_display":"Sin fecha"}
  ]',
  '[
    {"name":"buscar","label":"Buscar","field":"*","control":"text"},
    {"name":"estado","label":"Estado","field":"estado","control":"multiselect"},
    {"name":"producto","label":"Producto","field":"producto","control":"select"},
    {"name":"entrega","label":"Fecha de entrega","field":"fecha_entrega","control":"daterange"},
    {"name":"creado","label":"Recibido","field":"created_at","control":"daterange"}
  ]',
  'created_at', 'desc', 20
FROM admin.module_groups g WHERE g.name = 'Ventas';
