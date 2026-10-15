import { contacto, faqs, links, marca, productos, seo } from './finca';
import { fotosPublicas, ogImage } from './imagenes';

export interface PageImage {
  loc: string;
  title: string;
  caption: string;
}

function abs(site: URL, path: string) {
  return new URL(path, site).href;
}

/** Precio en pesos solo si ya hay cifra; mientras esté pendiente ('$ —') la oferta va sin precio. */
function precio(label: string) {
  const digits = label.replace(/\D/g, '');
  return digits ? { price: digits, priceCurrency: 'COP' } : {};
}

export function pageImages(site: URL): PageImage[] {
  return fotosPublicas.map((foto) => ({
    loc: abs(site, foto.src),
    title: `${foto.lugar} · ${marca.nombre}`,
    caption: foto.alt,
  }));
}

export function structuredData(site: URL) {
  const home = new URL('/', site).href;
  const businessId = new URL('/#negocio', site).href;
  const websiteId = new URL('/#website', site).href;
  const webpageId = new URL('/#webpage', site).href;
  const telephone = links.telefono.replace('tel:', '');
  const shareImage = {
    '@type': 'ImageObject',
    url: abs(site, ogImage.src),
    width: 1200,
    height: 630,
    caption: ogImage.alt,
  };
  const oferta = (nombre: string, descripcion: string, label: string) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Product', name: nombre, description: descripcion },
    ...precio(label),
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': businessId,
        name: marca.nombre,
        slogan: marca.lema,
        description: seo.description,
        url: home,
        image: [
          shareImage,
          ...pageImages(site)
            .slice(0, 4)
            .map((photo) => ({ '@type': 'ImageObject', url: photo.loc, caption: photo.caption })),
        ],
        logo: abs(site, '/og-logo.png'),
        telephone,
        currenciesAccepted: 'COP',
        areaServed: contacto.zonaEntrega,
        address: { '@type': 'PostalAddress', addressLocality: contacto.ubicacion, addressCountry: 'CO' },
        contactPoint: { '@type': 'ContactPoint', telephone, contactType: 'sales' },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Productos de la finca',
          itemListElement: productos.map((p) => oferta(p.nombre, p.detalle, p.precio)),
        },
        mainEntityOfPage: { '@id': webpageId },
        potentialAction: {
          '@type': 'OrderAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: links.pedir,
            inLanguage: 'es',
            actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'],
          },
        },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: home,
        name: marca.nombre,
        description: seo.description,
        inLanguage: 'es-CO',
        publisher: { '@id': businessId },
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: home,
        name: seo.title,
        description: seo.description,
        inLanguage: 'es-CO',
        isPartOf: { '@id': websiteId },
        about: { '@id': businessId },
        mainEntity: { '@id': businessId },
        primaryImageOfPage: shareImage,
      },
      {
        '@type': 'FAQPage',
        '@id': new URL('/#faq', site).href,
        url: new URL('/#preguntas', site).href,
        inLanguage: 'es-CO',
        isPartOf: { '@id': webpageId },
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.pregunta,
          acceptedAnswer: { '@type': 'Answer', text: faq.respuesta },
        })),
      },
    ],
  };
}
