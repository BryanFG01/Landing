import type { APIRoute } from 'astro';
import { contacto, faqs, links, marca, precioPanal, precioPollo, productos, seo } from '../data/finca';

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Falta site en astro.config.mjs');
  const home = new URL('/', site).href;
  const productLines = productos.map((p) => `- ${p.nombre}: ${p.precio}. ${p.detalle}.`).join('\n');
  const questions = faqs.map((faq) => `### ${faq.pregunta}\n\n${faq.respuesta}`).join('\n\n');
  const body = `# ${marca.nombre}

> ${seo.description}

${marca.lema}: pollo campesino y huevos colorados a domicilio. Los pedidos se hacen por WhatsApp.

## Datos

- Ubicación: ${contacto.ubicacion}
- Zona de entrega: ${contacto.zonaEntrega}
- Entregas: ${contacto.entregas}
- Horario de pedidos: ${contacto.horario}
- Pago: ${contacto.pagos}
- Precio del pollo: ${precioPollo} la libra con domicilio incluido, entero o despresado (se pesa completo)
- Precio del panal de 30 huevos colorados: ${precioPanal}
- Teléfono y WhatsApp: ${contacto.telefono}
- Pedidos: ${links.pedir}
- Instagram: ${links.instagram}
- Página: ${home}

## Productos

${productLines}

## Preguntas frecuentes

${questions}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
