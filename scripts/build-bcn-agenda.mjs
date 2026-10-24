// Genera el archivo de conciertos de la Agenda Cultural de Barcelona que lee
// la app (fuente "bcn"). Lo usa scripts/publish-bcn-agenda.sh cada mañana, y
// también se puede ejecutar a mano:
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
// Open Data BCN rechaza (403) peticiones sin identificar desde algunos
// servidores: nos identificamos y reintentamos con espera
const HEADERS = {
  'User-Agent': 'meeet/1.0 (+https://github.com/meeet-bcn/meeet)',
  Accept: 'application/json',
};
const ATTEMPTS = 3;

// "Hoy" en Barcelona, no en el reloj del servidor
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

async function download() {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(SOURCE, { headers: HEADERS });
    if (response.ok) return response.json();
    if (attempt === ATTEMPTS) throw new Error(`Open Data BCN respondió ${response.status}`);
    console.log(`Open Data BCN respondió ${response.status}; reintento ${attempt + 1}/${ATTEMPTS}…`);
    await new Promise((resolve) => setTimeout(resolve, attempt * 15000));
  }
}

console.log('Descargando la agenda cultural de Barcelona…');
const events = await download();

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
