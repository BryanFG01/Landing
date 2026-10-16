import type { APIRoute } from 'astro';
import { json } from '@/shared/server/http';
import { getNav } from '@/features/admin/core/server/modules';

export const prerender = false;

/** Grupos y módulos activos que el usuario puede ver, para el sidebar. */
export const GET: APIRoute = async ({ locals }) => json(await getNav(locals.adminUser!));
