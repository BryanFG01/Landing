import type { APIRoute } from 'astro';
import { json } from '../../../admin/server/http';
import { getNav } from '../../../admin/server/modules';

export const prerender = false;

/** Grupos y módulos activos que el usuario puede ver, para el sidebar. */
export const GET: APIRoute = async ({ locals }) => json(await getNav(locals.adminUser!));
