/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Administrador con sesión iniciada (solo en /admin y /api/admin). */
    adminUser?: import('./admin/schema').AdminUser;
    /** Borrador del sitio en la vista previa del panel (si no, la landing usa lo publicado). */
    sitePreview?: import('./data/sitio').SiteContent;
  }
}
