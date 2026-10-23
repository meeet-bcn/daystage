// Búsqueda de conciertos: al momento entre los ya cargados (sin acentos, por
// artista, sala, género o telonero) y, tras una pausa al escribir, en las
// ticketeras, para encontrar también los de páginas que aún no se han cargado.

import { useEffect, useState } from 'react';

import { useApp } from '@/data/app-context';
import { Concert, fetchConcerts } from '@/data/concerts';
import { matchesQuery } from '@/data/filters';
import { mergeConcerts } from '@/data/merge';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 350;

export function useConcertSearch(query: string) {
  const { concerts, addConcerts } = useApp();
  const [remote, setRemote] = useState<{ term: string; ids: string[] } | null>(null);
  const [error, setError] = useState<{ term: string; message: string } | null>(null);

  const term = query.trim();
  const searchable = term.length >= MIN_CHARS;

  useEffect(() => {
    if (!searchable) return;
    let active = true;
    const timer = setTimeout(() => {
      fetchConcerts({ page: 0, keyword: term })
        .then(({ concerts: found }) => {
          if (!active) return;
          const merged = mergeConcerts(found);
          // Quedan en el estado global para que el detalle pueda abrirlos
          addConcerts(merged);
          setRemote({ term, ids: merged.map((c) => c.id) });
        })
        .catch((e) => active && setError({ term, message: e.message }));
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term, searchable, addConcerts]);

  if (!searchable) return { results: [] as Concert[], searching: false, error: null };

  const remoteIds = new Set(remote?.term === term ? remote.ids : []);
  const results = concerts
    .filter((c) => remoteIds.has(c.id) || matchesQuery(c, term))
    .sort((a, b) => (a.startsAt ?? Infinity) - (b.startsAt ?? Infinity));

  return {
    results,
    // Aún esperando a las ticketeras para este texto
    searching: remote?.term !== term && error?.term !== term,
    error: error?.term === term ? error.message : null,
  };
}
