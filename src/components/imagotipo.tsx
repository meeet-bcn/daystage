import { DayStageMark, MARK_HEIGHT } from '@/components/daystage-mark';

/** Ancho / alto del imagotipo (las anillas asoman por arriba). */
export const IMAGOTIPO_RATIO = 1 / MARK_HEIGHT;

/** Imagotipo de DayStage (calendario con dos corcheas), de alto total `height`. Siempre quieto. */
export function Imagotipo({ height }: { height: number }) {
  return <DayStageMark size={height / MARK_HEIGHT} />;
}
