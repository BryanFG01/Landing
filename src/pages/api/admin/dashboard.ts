import type { APIRoute } from 'astro';
import { json } from '../../../admin/server/http';
import { getDashboardStats } from '../../../admin/server/pages';

export const prerender = false;

/** Resumen para el inicio del panel. */
export const GET: APIRoute = async () => json({ stats: await getDashboardStats() });
