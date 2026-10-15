import type { APIRoute } from 'astro';
import { json } from '../../../admin/server/http';
import { getDashboardStats } from '../../../admin/server/pages';

export const prerender = false;

/** Resumen para el inicio del panel (solo con los módulos que el usuario puede ver). */
export const GET: APIRoute = async ({ locals }) => json({ stats: await getDashboardStats(locals.adminUser!) });
