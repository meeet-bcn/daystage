// Gustos musicales para Descubrir: eliges 5 artistas y, a partir de ahí, la
// app pondera los estilos que te gustan y ordena las cartas de conciertos.
// Va afinando con lo que haces: tus "Meeet In!", tu lista de deseos y las
// cartas que deslizas. Todo son funciones puras: el estado vive en app-context.

import type { Concert } from '@/data/concerts';

/** Artista del carrusel inicial. `image`: portada de un disco (Apple Music: no da fotos de artista). */
export type TasteArtist = {
  id: string;
  name: string;
  /** Estilos, con los nombres de MUSIC_TASTES. */
  genres: string[];
  /** Idioma en el que canta (LANGUAGES), o 'fr' para los franceses. */
  language: string;
  image: string;
};

export const TASTE_PICKS = 5; // cuántos artistas se eligen

/** Grandes nombres de la historia, internacionales, españoles y catalanes. */
export const TASTE_ARTISTS: TasteArtist[] = [
  {
    id: 'beatles',
    name: 'The Beatles',
    genres: ['Rock', 'Pop'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/f2/98/fb/f298fb48-1e0e-6ad4-4cff-fb824b77f02e/15UMGIM59587.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'queen',
    name: 'Queen',
    genres: ['Rock'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/15/c7/55/15c755bc-7603-3ce3-e243-e59f1f9863ea/602527724171.jpg/300x300bb.jpg',
  },
  {
    id: 'michael-jackson',
    name: 'Michael Jackson',
    genres: ['Pop', 'Soul y R&B'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/4f/fd/324ffda2-9e51-8f6a-0c2d-c6fd2b41ac55/074643811224.jpg/300x300bb.jpg',
  },
  {
    id: 'bowie',
    name: 'David Bowie',
    genres: ['Rock', 'Indie'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/67/90/20/67902058-637a-d9af-87e1-ef90a395430b/5021732976109.jpg/300x300bb.jpg',
  },
  {
    id: 'nirvana',
    name: 'Nirvana',
    genres: ['Rock', 'Indie'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/46/24/33/462433f9-ee74-2d60-4538-859826a7bed7/00720642472729.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'radiohead',
    name: 'Radiohead',
    genres: ['Indie', 'Rock'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/07/60/ba/0760ba0f-148c-b18f-d0ff-169ee96f3af5/634904078164.png/300x300bb.jpg',
  },
  {
    id: 'daft-punk',
    name: 'Daft Punk',
    genres: ['Electrónica'],
    language: 'fr',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e8/43/5f/e8435ffa-b6b9-b171-40ab-4ff3959ab661/886443919266.jpg/300x300bb.jpg',
  },
  {
    id: 'beyonce',
    name: 'Beyoncé',
    genres: ['Pop', 'Soul y R&B'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/83/b2/be/83b2be70-affe-43f8-00f5-8c9dd5d4f1a3/196874746608.jpg/300x300bb.jpg',
  },
  {
    id: 'metallica',
    name: 'Metallica',
    genres: ['Metal'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c6/9b/1d/c69b1ddb-f873-53b4-9fc9-87ca49af2062/21UMGIM48676.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'miles-davis',
    name: 'Miles Davis',
    genres: ['Jazz'],
    language: 'en',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music/7f/9f/d6/mzi.vtnaewef.jpg/300x300bb.jpg',
  },
  {
    id: 'kendrick',
    name: 'Kendrick Lamar',
    genres: ['Hip hop'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/31/3a/3f/313a3fbc-bb8f-80c7-b5a2-e226869a38cd/24UMGIM51924.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'taylor-swift',
    name: 'Taylor Swift',
    genres: ['Pop'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/e2/41/93/e24193c4-d766-d1a5-7370-51fa13177bdf/12UMGIM54089.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'arctic-monkeys',
    name: 'Arctic Monkeys',
    genres: ['Indie', 'Rock'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/300x300bb.jpg',
  },
  {
    id: 'amy-winehouse',
    name: 'Amy Winehouse',
    genres: ['Soul y R&B', 'Jazz'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/cf/3f/09/cf3f0994-980d-d8ed-088d-ae89af256b73/15UMGIM24224.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'bad-bunny',
    name: 'Bad Bunny',
    genres: ['Latino', 'Hip hop'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a3/1a/e9/a31ae99b-9378-d004-a613-e8f7397f7a88/191773843489.jpg/300x300bb.jpg',
  },
  {
    id: 'nina-simone',
    name: 'Nina Simone',
    genres: ['Jazz', 'Soul y R&B'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c5/a9/39/c5a9399b-95da-c232-e453-bc23a1b0c9e0/mzi.jcjkatis.jpg/300x300bb.jpg',
  },
  {
    id: 'bob-marley',
    name: 'Bob Marley & The Wailers',
    genres: ['Folk', 'Soul y R&B'],
    language: 'en',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3c/c2/0d/3cc20dcc-8f4e-f060-36dd-7de52a7ec8fe/12UMGIM14712.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'stromae',
    name: 'Stromae',
    genres: ['Electrónica', 'Pop'],
    language: 'fr',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/19/d7/7f/19d77fb9-4e13-3a77-c84d-8399a4213316/13UMGIM59162.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'rosalia',
    name: 'ROSALÍA',
    genres: ['Flamenco', 'Pop'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/2c/55/e1/2c55e13f-15d8-1c7c-1826-c5fa55deaa8f/886447217139.jpg/300x300bb.jpg',
  },
  {
    id: 'camaron',
    name: 'Camarón de la Isla',
    genres: ['Flamenco'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/cd/e2/8a/cde28a72-ae84-610d-bd94-d67afd6dd97e/00602567941071.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'paco-de-lucia',
    name: 'Paco de Lucía',
    genres: ['Flamenco', 'Jazz'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/81/53/79/8153790c-0159-9e47-2a70-523affdf5122/00602557026948.rgb.jpg/300x300bb.jpg',
  },
  {
    id: 'heroes',
    name: 'Héroes del Silencio',
    genres: ['Rock'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/d2/37/e4/d237e4d7-7059-b379-548a-be8e4bdad353/5099951714451_1500x1500_300dpi.jpg/300x300bb.jpg',
  },
  {
    id: 'mecano',
    name: 'Mecano',
    genres: ['Pop'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/bf/32/a1/bf32a1d6-bd51-c277-2eb9-5606638de6e7/0888880563743.jpg/300x300bb.jpg',
  },
  {
    id: 'vetusta-morla',
    name: 'Vetusta Morla',
    genres: ['Indie', 'Rock'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/22/fe/ba/22febac9-28d8-e5f1-06f6-c7eb05d1a6e5/196874793770.jpg/300x300bb.jpg',
  },
  {
    id: 'love-of-lesbian',
    name: 'Love of Lesbian',
    genres: ['Indie', 'Pop'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Features115/v4/ae/c7/ef/aec7efdc-877c-ef29-6517-57e7a9c389a7/dj.afwrvqmp.jpg/300x300bb.jpg',
  },
  {
    id: 'c-tangana',
    name: 'C. Tangana',
    genres: ['Hip hop', 'Latino'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/50/29/cc/5029cc98-699d-a6a4-7db9-1b63b9998b45/886447441817.jpg/300x300bb.jpg',
  },
  {
    id: 'estopa',
    name: 'Estopa',
    genres: ['Rock', 'Pop'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/19/3f/64/193f64f2-5b79-22f7-682f-7d916eb81114/196874820445.jpg/300x300bb.jpg',
  },
  {
    id: 'extremoduro',
    name: 'Extremoduro',
    genres: ['Rock'],
    language: 'es',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music/91/45/af/mzi.ohlfvbfi.jpg/300x300bb.jpg',
  },
  {
    id: 'manel',
    name: 'Manel',
    genres: ['Indie', 'Folk'],
    language: 'ca',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/29/7f/af/297fafcb-5f4a-4d22-9520-b9f7213d10ab/193483166322.jpg/300x300bb.jpg',
  },
  {
    id: 'lluis-llach',
    name: 'Lluís Llach',
    genres: ['Folk'],
    language: 'ca',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c7/fd/aa/c7fdaa93-0627-3c47-30a3-d43ed18dd063/8433391373002.jpg/300x300bb.jpg',
  },
  {
    id: 'sopa-de-cabra',
    name: 'Sopa de Cabra',
    genres: ['Rock'],
    language: 'ca',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/27/2c/70/272c70f2-0b71-9a22-0d87-ece0e1221a11/8436000985672_Cover.jpg/300x300bb.jpg',
  },
  {
    id: 'txarango',
    name: 'Txarango',
    genres: ['Folk', 'Pop'],
    language: 'ca',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/5a/4c/01/5a4c0133-fa4a-5738-8d6d-4973c9ae1e72/8445162668088.jpg/300x300bb.jpg',
  },
  {
    id: 'oques-grasses',
    name: 'Oques Grasses',
    genres: ['Pop', 'Indie'],
    language: 'ca',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b9/4c/e8/b94ce85f-7539-4da3-a452-3f16b616e3c1/8447053102039.jpg/300x300bb.jpg',
  },
  {
    id: 'serrat',
    name: 'Joan Manuel Serrat',
    genres: ['Folk'],
    language: 'ca',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Features/69/bf/c9/dj.kxsxtjjb.jpg/300x300bb.jpg',
  },
  {
    id: 'antonia-font',
    name: 'Antònia Font',
    genres: ['Indie', 'Pop'],
    language: 'ca',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music/05/50/94/mzi.cctgxktm.jpg/300x300bb.jpg',
  },
  {
    id: 'bad-gyal',
    name: 'Bad Gyal',
    genres: ['Latino', 'Electrónica'],
    language: 'es',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/0e/5b/18/0e5b1820-8daf-becb-400f-89a9c6c2a33a/22UMGIM50790.rgb.jpg/300x300bb.jpg',
  },
];

/** Una carta deslizada en Descubrir: si te gustó y su estilo (para aprender). */
export type Swipe = { liked: boolean; genre: string };

// Géneros de Ticketmaster (inglés) y de la agenda BCN → los estilos de MUSIC_TASTES
const GENRE_ALIASES: Record<string, string> = {
  Alternative: 'Indie',
  'Dance/Electronic': 'Electrónica',
  Dance: 'Electrónica',
  'Hip-Hop/Rap': 'Hip hop',
  Latin: 'Latino',
  'R&B': 'Soul y R&B',
  Soul: 'Soul y R&B',
  Classical: 'Clásica',
  Ópera: 'Clásica',
  Coral: 'Clásica',
  Blues: 'Jazz',
  World: 'Folk',
  Country: 'Folk',
  Cantautor: 'Folk',
};

/** El estilo de un concierto con los nombres de MUSIC_TASTES ('' si no se sabe). */
export function tasteGenre(genre: string) {
  return GENRE_ALIASES[genre] ?? genre;
}

// Cuánto pesa cada señal en tus gustos
const WEIGHT = { pick: 2, plan: 1, wish: 0.5, like: 0.5, dislike: -0.4 };

export type TasteSignals = {
  picks: string[];
  plans: Concert[];
  wishlist: Concert[];
  swipes: Record<string, Swipe>;
};

/** Peso de cada estilo según todo lo que has hecho en la app (nunca negativo). */
export function tasteWeights({ picks, plans, wishlist, swipes }: TasteSignals) {
  const weights: Record<string, number> = {};
  const add = (genre: string, amount: number) => {
    const g = tasteGenre(genre);
    if (g) weights[g] = Math.max(0, (weights[g] ?? 0) + amount);
  };
  for (const artist of TASTE_ARTISTS.filter((a) => picks.includes(a.id))) {
    for (const g of artist.genres) add(g, WEIGHT.pick);
  }
  for (const c of plans) add(c.genre, WEIGHT.plan);
  for (const c of wishlist) add(c.genre, WEIGHT.wish);
  for (const s of Object.values(swipes)) add(s.genre, s.liked ? WEIGHT.like : WEIGHT.dislike);
  return weights;
}

/** Tus estilos favoritos, el que más pesa primero (para tu perfil). */
export function topTastes(weights: Record<string, number>, max = 4) {
  return Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([g]) => g);
}

/** Idiomas de los artistas que has elegido, el más repetido primero. */
export function pickLanguages(picks: string[]) {
  const count: Record<string, number> = {};
  for (const a of TASTE_ARTISTS.filter((x) => picks.includes(x.id))) {
    count[a.language] = (count[a.language] ?? 0) + 1;
  }
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .map(([l]) => l);
}

/**
 * Las cartas de Descubrir: conciertos futuros que no has deslizado ni marcado
 * con "Meeet In!", los que más encajan con tus gustos primero (y, a igualdad,
 * los más cercanos).
 */
export function buildDeck(
  concerts: Concert[],
  weights: Record<string, number>,
  options: { now: number; swiped: Set<string>; going: Set<string> }
) {
  return concerts
    .filter((c) => c.startsAt != null && c.startsAt >= options.now)
    .filter((c) => !options.swiped.has(c.id) && !options.going.has(c.id))
    .map((c) => ({ concert: c, score: weights[tasteGenre(c.genre)] ?? 0 }))
    .sort((a, b) => b.score - a.score || (a.concert.startsAt ?? 0) - (b.concert.startsAt ?? 0))
    .map((x) => x.concert);
}
