export interface Props {
  id: string;
  index: number;
  total: number;
  lugar: string;
  focus?: number;
  /** Sin eyebrow, la parada lo pone dentro de su propio titular (la entrada lo mete en el h1). */
  eyebrow?: string;
  spy?: string;
}
