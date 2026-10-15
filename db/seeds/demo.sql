-- Registros de ejemplo para probar el panel (pnpm db:seed). Solo para ramas de desarrollo, nunca en producción.

DELETE FROM admin.records
WHERE module_id IN (SELECT id FROM admin.modules WHERE module_key IN ('categorias', 'productos', 'pedidos'));

INSERT INTO admin.records (module_id, data)
SELECT m.id, v.data::jsonb
FROM admin.modules m,
  (VALUES
    ('{"nombre":"Huevos","descripcion":"Huevos colorados de gallinas al aire libre","activa":true}'),
    ('{"nombre":"Pollo","descripcion":"Pollo de campo","activa":true}'),
    ('{"nombre":"Combos","descripcion":"Huevos y pollo juntos","activa":false}')
  ) AS v (data)
WHERE m.module_key = 'categorias';

-- Productos: la categoría apunta al id del registro de categorías.
INSERT INTO admin.records (module_id, data)
SELECT p.id, jsonb_build_object('nombre', v.nombre, 'categoria', c.id, 'precio', v.precio,
         'presentacion', v.presentacion, 'disponible', v.disponible) || v.extra::jsonb
FROM admin.modules p
JOIN (VALUES
    ('Cubeta de huevos colorados', 'Huevos', 18000, 'cubeta', true, '{"descripcion":"30 huevos recogidos en la finca"}'),
    ('Media cubeta', 'Huevos', 9500, 'media_cubeta', true, '{}'),
    ('Pollo entero de campo', 'Pollo', 32000, 'entero', true, '{"descripcion":"Limpio y listo para cocinar"}'),
    ('Pollo despresado', 'Pollo', 35000, 'despresado', false, '{}')
  ) AS v (nombre, categoria, precio, presentacion, disponible, extra) ON true
JOIN admin.records c ON c.data->>'nombre' = v.categoria
JOIN admin.modules mc ON mc.id = c.module_id AND mc.module_key = 'categorias'
WHERE p.module_key = 'productos';

-- Pedidos
INSERT INTO admin.records (module_id, data, created_at)
SELECT m.id, jsonb_build_object('producto', pr.id) || v.data::jsonb, v.creado::timestamptz
FROM admin.modules m
JOIN (VALUES
    ('Cubeta de huevos colorados', '{"cliente":"Marta Gómez","telefono":"300 123 4567","cantidad":2,"total":36000,"estado":"entregado","fecha_entrega":"2026-10-08","direccion":"Vereda El Rosal"}', '2026-10-06T14:10:00Z'),
    ('Pollo entero de campo', '{"cliente":"Carlos Ruiz","telefono":"310 555 0101","cantidad":1,"total":32000,"estado":"confirmado","fecha_entrega":"2026-10-16"}', '2026-10-12T09:30:00Z'),
    ('Media cubeta', '{"cliente":"Luisa Fernanda Ortiz","cantidad":3,"total":28500,"estado":"pendiente","notas":"Llamar antes de llegar"}', '2026-10-13T18:45:00Z'),
    ('Cubeta de huevos colorados', '{"cliente":"Andrés Pérez","telefono":"320 444 7788","cantidad":1,"total":18000,"estado":"cancelado"}', '2026-10-10T11:00:00Z')
  ) AS v (producto, data, creado) ON true
JOIN admin.records pr ON pr.data->>'nombre' = v.producto
JOIN admin.modules mp ON mp.id = pr.module_id AND mp.module_key = 'productos'
WHERE m.module_key = 'pedidos';
