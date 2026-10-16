// Decisiones por rol de la persona del panel, en un solo sitio para que las pantallas no comparen textos.
import type { AdminUser } from '../../domain/schema';

/** Administrador: configura módulos, usuarios, apariencia y la web. */
export const isAdminUser = (user: Pick<AdminUser, 'role'>) => user.role === 'admin';
