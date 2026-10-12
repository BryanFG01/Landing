import type { APIRoute } from 'astro';
import { aLaMedida, combos, contacto, faqs, links, marca, productos, seo } from '../data/finca';

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Falta site en astro.config.mjs');
  const home = new URL('/', site).href;
  const productLines = productos.map((p) => `- ${p.nombre}: ${p.precio}. ${p.detalle}.`).join('\n');
  const comboLines = combos.map((c) => `- ${c.nombre}: ${c.precio}. ${c.descripcion}`).join('\n');
  const questions = faqs.map((faq) => `### ${faq.pregunta}\n\n${faq.respuesta}`).join('\n\n');
  const body = `# ${marca.nombre}

> ${seo.description}

${marca.lema}, directo de la finca. Los pedidos se hacen por WhatsApp.

## Datos

- Ubicación: ${contacto.ubicacion}
- Zona de entrega: ${contacto.zonaEntrega}
- Días de entrega: ${contacto.entregas}
- Horario de atención: ${contacto.horario}
- Teléfono y WhatsApp: ${contacto.telefono}
- Pedidos: ${links.pedir}
- Instagram: ${links.instagram}
- Página: ${home}

## Productos

${productLines}

## Combos

${comboLines}
- ${aLaMedida.nombre}: ${aLaMedida.descripcion}

## Preguntas frecuentes

${questions}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
