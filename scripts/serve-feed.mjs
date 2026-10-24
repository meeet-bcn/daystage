// Sirve en la red local el archivo de la agenda BCN generado con
// `npm run feed:build`, para probar la fuente "bcn" en desarrollo sin
// publicarlo: la app lo pide al Mac que sirve Metro, en el puerto 8099.
//
//   npm run feed:serve

import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';

const PORT = 8099;
const FILE = 'feed/bcn-concerts.json';

if (!existsSync(FILE)) {
  console.error(`No existe ${FILE}: genéralo antes con  npm run feed:build`);
  process.exit(1);
}

createServer((req, res) => {
  if (req.url !== '/bcn-concerts.json') {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  createReadStream(FILE).pipe(res);
}).listen(PORT, () => console.log(`Agenda BCN en http://localhost:${PORT}/bcn-concerts.json`));
