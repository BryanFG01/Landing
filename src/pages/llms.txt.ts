import type { APIRoute } from 'astro';
import { getSite } from '@/features/landing/server/contenido';
import { bloque, links as linksFor, plain } from '@/features/landing/domain/sitio';

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Falta site en astro.config.mjs');
  const content = await getSite();
  const { marca, contacto, seo } = content;
  const links = linksFor(content);
  const productos = bloque(content, 'productos');
  const faqs = bloque(content, 'preguntas');
  const home = new URL('/', site).href;
  const productLines = productos.visible
    ? productos.items.map((p) => `- ${p.nombre}: ${p.precio}. ${p.detalle}.`).join('\n')
    : '';
  const questions = faqs.visible
    ? faqs.items.map((faq) => `### ${faq.pregunta}\n\n${plain(faq.respuesta)}`).join('\n\n')
    : '';
  const body = `# ${marca.nombre}

> ${plain(seo.descripcion)}

${marca.lema}. Los pedidos se hacen por WhatsApp.

## Datos

- Ubicación: ${contacto.ubicacion}
- Zona de entrega: ${contacto.zonaEntrega}
- Entregas: ${contacto.entregas}
- Horario de pedidos: ${contacto.horario}
- Pago: ${contacto.pagos}
- Teléfono y WhatsApp: ${contacto.telefono}
- Pedidos: ${links.pedir}
${contacto.instagram && contacto.instagramUrl ? `- Instagram: ${contacto.instagramUrl}\n` : ''}- Página: ${home}
${productLines ? `\n## Productos\n\n${productLines}\n` : ''}${questions ? `\n## Preguntas frecuentes\n\n${questions}\n` : ''}`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
