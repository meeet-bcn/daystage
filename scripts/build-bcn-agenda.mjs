// Genera el archivo de conciertos de la Agenda Cultural de Barcelona que lee
// la app (fuente "bcn"). Se ejecuta a diario en GitHub Actions
// (.github/workflows/bcn-agenda.yml) y también a mano:
//
//   node scripts/build-bcn-agenda.mjs [salida]     (por defecto feed/bcn-concerts.json)
//
// Datos: Ajuntament de Barcelona · Open Data BCN, licencia CC BY 4.0.
// Node 24 ejecuta el TypeScript de src/data/bcn-agenda.ts directamente.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { buildFeed } from '../src/data/bcn-agenda.ts';

const SOURCE =
  'https://opendata-ajuntament.barcelona.cat/data/dataset/2767159c-1c98-46b8-a686-2b25b40cb053/resource/59b9c807-f6c1-4c10-ac51-1ace65485079/download';
const OUTPUT = process.argv[2] ?? 'feed/bcn-concerts.json';
// Por debajo de esto, algo ha ido mal en el origen: mejor no publicar
const MIN_CONCERTS = 50;

// "Hoy" en Barcelona, no en el reloj del servidor
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

console.log('Descargando la agenda cultural de Barcelona…');
const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Open Data BCN respondió ${response.status}`);
const events = await response.json();

const feed = buildFeed(events, today, new Date().toISOString());
if (feed.concerts.length < MIN_CONCERTS) {
  throw new Error(`Solo ${feed.concerts.length} conciertos: no se publica (¿ha cambiado el origen?)`);
}

const json = JSON.stringify(feed);
await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, json);
console.log(
  `✓ ${feed.concerts.length} conciertos desde ${today} → ${OUTPUT} (${Math.round(json.length / 1024)} KB)`
);
