import type { Item, Parada } from '../../domain/sitio';

/** Estilos de parada que pintan datos (`texto` solo lleva el titular y los párrafos). */
export type EstiloConItems = Exclude<Parada['estilo'], 'texto'>;

export interface StopItemsProps {
  estilo: EstiloConItems;
  items: Item[];
}

/** Props de cada estilo: la lista de datos de la parada, ya comprobado que no viene vacía. */
export interface ItemsProps {
  items: Item[];
}
