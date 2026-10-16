/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Administrador con sesión iniciada (solo en /admin y /api/admin). */
    adminUser?: import('@/features/admin/core/domain/schema').AdminUser;
    /** Borrador del sitio en la vista previa del panel (si no, la landing usa lo publicado). */
    sitePreview?: import('@/features/landing/domain/sitio').SiteContent;
  }
}
