/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Administrador con sesión iniciada (solo en /admin y /api/admin). */
    adminUser?: import('./admin/schema').AdminUser;
  }
}
