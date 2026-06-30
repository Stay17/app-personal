import axios from 'axios';

const BASE  = 'https://api.jikan.moe/v4';
const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Géneros MAL ───────────────────────────────────────────────────────────────
export const JIKAN_GENRES = [
  { id: 1,  name: 'Action'       }, { id: 2,  name: 'Adventure'    },
  { id: 4,  name: 'Comedy'       }, { id: 8,  name: 'Drama'         },
  { id: 10, name: 'Fantasy'      }, { id: 14, name: 'Horror'        },
  { id: 7,  name: 'Mystery'      }, { id: 22, name: 'Romance'       },
  { id: 24, name: 'Sci-Fi'       }, { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports'       }, { id: 37, name: 'Supernatural'  },
  { id: 41, name: 'Suspense'     },
  { id: 9,  name: 'Ecchi'        }, { id: 49, name: 'Erotica'       },
  { id: 12, name: 'Hentai'       },
  { id: 50, name: 'Adult Cast'        }, { id: 51, name: 'Anthropomorphic'   },
  { id: 52, name: 'CGDCT'            }, { id: 53, name: 'Childcare'         },
  { id: 54, name: 'Combat Sports'    }, { id: 81, name: 'Crossdressing'     },
  { id: 55, name: 'Delinquents'      }, { id: 39, name: 'Detective'         },
  { id: 56, name: 'Educational'      }, { id: 57, name: 'Gag Humor'         },
  { id: 58, name: 'Gore'             }, { id: 35, name: 'Harem'             },
  { id: 59, name: 'High Stakes Game' }, { id: 13, name: 'Historical'        },
  { id: 60, name: 'Idols (Female)'   }, { id: 61, name: 'Idols (Male)'      },
  { id: 62, name: 'Isekai'           }, { id: 63, name: 'Iyashikei'         },
  { id: 64, name: 'Love Polygon'     }, { id: 65, name: 'Magical Sex Shift' },
  { id: 66, name: 'Mahou Shoujo'     }, { id: 17, name: 'Martial Arts'      },
  { id: 18, name: 'Mecha'            }, { id: 67, name: 'Medical'           },
  { id: 38, name: 'Military'         }, { id: 19, name: 'Music'             },
  { id: 6,  name: 'Mythology'        }, { id: 68, name: 'Organized Crime'   },
  { id: 69, name: 'Otaku Culture'    }, { id: 20, name: 'Parody'            },
  { id: 70, name: 'Performing Arts'  }, { id: 71, name: 'Pets'              },
  { id: 40, name: 'Psychological'    }, { id: 3,  name: 'Racing'            },
  { id: 72, name: 'Reincarnation'    }, { id: 73, name: 'Reverse Harem'     },
  { id: 74, name: 'Romantic Subtext' }, { id: 21, name: 'Samurai'           },
  { id: 23, name: 'School'           }, { id: 75, name: 'Showbiz'           },
  { id: 29, name: 'Space'            }, { id: 11, name: 'Strategy Game'     },
  { id: 31, name: 'Super Power'      }, { id: 76, name: 'Survival'          },
  { id: 77, name: 'Team Sports'      }, { id: 78, name: 'Time Travel'       },
  { id: 32, name: 'Vampire'          }, { id: 79, name: 'Video Game'        },
  { id: 80, name: 'Visual Arts'      }, { id: 48, name: 'Workplace'         },
  { id: 43, name: 'Josei'   }, { id: 15, name: 'Kids'    },
  { id: 42, name: 'Seinen'  }, { id: 25, name: 'Shoujo'  },
  { id: 27, name: 'Shounen' },
];

const GENRE_ID   = Object.fromEntries(JIKAN_GENRES.map(g => [g.name, g.id]));
const FORMAT_MAP = { tv:'tv', movie:'movie', ova:'ova', special:'special', ona:'ona' };
const STATUS_VAL = { airing:'airing', complete:'complete', upcoming:'upcoming' };
const STATUS_LBL = { airing:'Currently Airing', complete:'Finished Airing', upcoming:'Not yet aired' };
const SEASONS    = ['winter','spring','summer','fall'];

// ── HTTP retry ────────────────────────────────────────────────────────────────
async function get(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { timeout: 15000 });
    } catch (err) {
      const s = err.response?.status;
      if ((s === 429 || s === 503 || s === 504 || !s) && i < retries - 1) {
        await delay(1200 * (i + 1));
        continue;
      }
      throw err;
    }
  }
}

// ── Normalizar ────────────────────────────────────────────────────────────────
function normalizar(a) {
  const sMap = { 'Finished Airing':'Finished Airing', 'Currently Airing':'Currently Airing', 'Not yet aired':'Not yet aired' };
  return {
    id:          `mal-${a.mal_id}`,
    mal_id:      a.mal_id,
    anilist_id:  null,
    titulo:      a.title_english || a.title,
    titulo_romaji:  a.title,
    titulo_japones: a.title_japanese,
    imagen:      a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url,
    score:       a.score    || null,
    episodios:   a.episodes || null,
    generos:     [...(a.genres||[]), ...(a.themes||[]), ...(a.demographics||[])],
    año:         a.year || a.aired?.prop?.from?.year || null,
    temporada:   a.season?.toLowerCase() || null,
    tipo:        a.type  || null,
    estado:      sMap[a.status] || a.status || 'Desconocido',
    sinopsis:    a.synopsis || '',
    popularidad: a.members  || 0,
    isAdult:     a.rating === 'Rx - Hentai' || false,
    source:      'jikan',
  };
}

// ── Deduplicar ────────────────────────────────────────────────────────────────
function dedup(arr) {
  const seen = new Set();
  return arr.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
}

// ── Shuffle ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Ordenar array ─────────────────────────────────────────────────────────────
function ordenar(arr, sort) {
  if (sort === 'score')      return arr.slice().sort((a,b) => (b.score||0) - (a.score||0));
  if (sort === 'popularity') return arr.slice().sort((a,b) => (b.popularidad||0) - (a.popularidad||0));
  if (sort === 'random')     return shuffle(arr);
  return arr;
}

// ── Aplicar filtros post-fetch ─────────────────────────────────────────────────
function applyFilters(arr, { genre, format, status, year, season } = {}) {
  let d = arr;
  if (genre)  d = d.filter(a => a.generos.some(g => g.name === genre));
  if (format) {
    const fLow = format.toLowerCase();
    d = d.filter(a => a.tipo?.toLowerCase() === fLow);
  }
  if (status) {
    const want = STATUS_LBL[status];
    if (want) d = d.filter(a => a.estado === want);
  }
  // Verificación de año post-fetch (Jikan a veces mezcla años en /seasons)
  if (year) d = d.filter(a => !a.año || a.año === +year);
  // Verificación de estación post-fetch
  if (season) d = d.filter(a => !a.temporada || a.temporada === season);
  return d;
}

// ── Traer todas las páginas de un endpoint hasta maxPages ─────────────────────
async function fetchAllPages(urlBase, maxPages = 4) {
  const results = [];
  for (let pg = 1; pg <= maxPages; pg++) {
    try {
      const sep = urlBase.includes('?') ? '&' : '?';
      const res = await get(`${urlBase}${sep}limit=25&page=${pg}`);
      const items = res.data.data || [];
      results.push(...items);
      if (!res.data.pagination?.has_next_page) break;
      if (pg < maxPages) await delay(350);
    } catch { break; }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// BÚSQUEDA POR NOMBRE
// ─────────────────────────────────────────────────────────────────────────────
export async function buscarPorNombre(query, page = 1) {
  const params = new URLSearchParams({ q: query, page, limit: 24 });
  const res = await get(`${BASE}/anime?${params}`);
  return {
    data:        (res.data.data || []).map(normalizar),
    hasNextPage: res.data.pagination?.has_next_page || false,
    source:      'jikan',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BÚSQUEDA CON FILTROS
//
// Estrategia por combinación:
//  • año + estación  → /seasons/{year}/{season}  (más preciso)
//  • solo estación   → /seasons/{currentYear}/{season}
//  • solo año        → /seasons/{year}/winter + spring + summer + fall (combinadas)
//  • resto           → /anime con params
// ─────────────────────────────────────────────────────────────────────────────
export async function buscarConFiltros({
  query: q,
  genre, season, year, format, status,
  sort = 'popularity',
  page = 1,
  randomPage = null,
}) {

  // ── año + estación ──────────────────────────────────────────────────────────
  if (year && season) {
    const raw  = await fetchAllPages(`${BASE}/seasons/${year}/${season}`, 4);
    let   data = dedup(raw.map(normalizar));
    data = applyFilters(data, { genre, format, status });
    data = ordenar(data, sort);
    const perPage = 24;
    const start   = (page - 1) * perPage;
    return {
      data:        data.slice(start, start + perPage),
      hasNextPage: start + perPage < data.length,
      source:      'jikan',
    };
  }

  // ── solo estación (sin año) ─────────────────────────────────────────────────
  if (season && !year) {
    const currentYear = new Date().getFullYear();
    return buscarConFiltros({ query:q, genre, season, year:currentYear, format, status, sort, page, randomPage });
  }

  // ── solo año (sin estación) → combinamos las 4 temporadas del año ───────────
  // Este es el caso que fallaba: year=2024, format=movie sin season
  if (year && !season) {
    // Traer las 4 temporadas en paralelo (con pequeño delay para no exceder rate limit)
    const allRaw = [];
    for (const s of SEASONS) {
      try {
        const raw = await fetchAllPages(`${BASE}/seasons/${year}/${s}`, 3);
        allRaw.push(...raw);
        await delay(300);
      } catch { /* ignorar temporadas que fallen */ }
    }

    let data = dedup(allRaw.map(normalizar));
    data = applyFilters(data, { genre, format, status, year });
    data = ordenar(data, sort);

    const perPage = 24;
    const start   = (page - 1) * perPage;
    return {
      data:        data.slice(start, start + perPage),
      hasNextPage: start + perPage < data.length,
      source:      'jikan',
    };
  }

  // ── Sin año ni estación → /anime genérico ──────────────────────────────────
  const params = new URLSearchParams({ limit: 24 });

  // Página (con random seed)
  let realPage = page;
  if (sort === 'random' && randomPage != null) {
    realPage = Math.max(1, Math.min(randomPage, 10));
  }
  params.set('page', String(realPage));

  // Ordenamiento
  if (sort === 'score') {
    params.set('order_by', 'score');
    params.set('sort',     'desc');
  } else {
    params.set('order_by', 'members');
    params.set('sort',     'desc');
  }

  if (q)     params.set('q',      q);
  if (genre && GENRE_ID[genre])   params.set('genres', String(GENRE_ID[genre]));
  if (format && FORMAT_MAP[format]) params.set('type',   FORMAT_MAP[format]);
  if (status && STATUS_VAL[status]) params.set('status', STATUS_VAL[status]);

  const res  = await get(`${BASE}/anime?${params}`);
  let   data = (res.data.data || []).map(normalizar);
  if (sort === 'random') data = shuffle(data);

  return {
    data,
    hasNextPage: res.data.pagination?.has_next_page || false,
    source:      'jikan',
  };
}

// ── TOP sin filtros ───────────────────────────────────────────────────────────
export async function buscarTop(page = 1, sort = 'score', randomPage = null) {
  if (sort === 'score') {
    const safePage = Math.max(1, Math.min(page, 10));
    const res = await get(`${BASE}/top/anime?page=${safePage}`);
    return {
      data:        (res.data.data || []).map(normalizar),
      hasNextPage: res.data.pagination?.has_next_page && safePage < 10,
      source:      'jikan',
    };
  }
  // popularity y random: /anime sin filtros extra
  return buscarConFiltros({ sort, page, randomPage });
}

// ─────────────────────────────────────────────────────────────────────────────
// RELACIONES — usa el endpoint nativo de Jikan /anime/{id}/relations
// ─────────────────────────────────────────────────────────────────────────────

// Etiquetas de relación de Jikan → español (mismo criterio que AniList:
// solo mostramos relaciones de la misma franquicia de ANIME, nunca manga/novela)
const JIKAN_RELACION_LABEL = {
  'Sequel':           'Secuela',
  'Prequel':          'Precuela',
  'Side story':       'Historia Paralela',
  'Alternative version': 'Alternativa',
  'Alternative setting': 'Alternativa',
  'Spin-off':         'Spin-off',
  'Summary':          'Resumen',
  'Parent story':     'Historia Principal',
  'Full story':       'Historia Completa',
  // Excluidos a propósito:
  'Character':        null,
  'Other':             null,
  'Adaptation':        null, // manga/novela — nunca mostrar
};

const JIKAN_PRIORIDAD = {
  'Prequel':0, 'Sequel':1, 'Parent story':2, 'Full story':2, 'Side story':3,
  'Summary':4, 'Alternative version':5, 'Alternative setting':5, 'Spin-off':6,
};

// Cache simple en memoria por mal_id para no repetir requests al navegar
const relacionesCache = new Map();

async function fetchRelacionesDirectas(malId) {
  if (relacionesCache.has(malId)) return relacionesCache.get(malId);
  try {
    const res = await get(`${BASE}/anime/${malId}/relations`);
    const data = res.data.data || [];
    relacionesCache.set(malId, data);
    return data;
  } catch {
    relacionesCache.set(malId, []);
    return [];
  }
}

// Trae datos básicos de un anime por su mal_id (para completar título/imagen/score)
const animeInfoCache = new Map();
async function fetchAnimeInfo(malId) {
  if (animeInfoCache.has(malId)) return animeInfoCache.get(malId);
  try {
    const res = await get(`${BASE}/anime/${malId}`);
    const info = res.data.data ? normalizar(res.data.data) : null;
    animeInfoCache.set(malId, info);
    if (info) await delay(150); // pequeño respiro entre llamadas para no saturar rate limit
    return info;
  } catch {
    animeInfoCache.set(malId, null);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PÚBLICA: Recorre TODA la franquicia (BFS) a partir de un mal_id, igual que
// la versión de AniList — sigue saltando de relación en relación hasta cubrir
// toda la franquicia (temporadas, películas, OVAs, especiales), sin duplicados,
// sin manga/novela.
// ─────────────────────────────────────────────────────────────────────────────
export async function buscarRelaciones(malId) {
  if (!malId || malId <= 0) return [];

  try {
    const visitados  = new Set([malId]);
    const encontrados = new Map(); // mal_id -> item
    const cola        = [malId];
    const MAX_NODOS    = 20; // límite de seguridad (Jikan es más lento que AniList)

    let nodosRecorridos = 0;

    while (cola.length > 0 && nodosRecorridos < MAX_NODOS) {
      const currentId = cola.shift();
      nodosRecorridos++;

      const relacionesRaw = await fetchRelacionesDirectas(currentId);
      if (!relacionesRaw.length) continue;

      for (const grupo of relacionesRaw) {
        const relacionTipo = grupo.relation; // ej: "Sequel", "Adaptation"
        const label = JIKAN_RELACION_LABEL[relacionTipo];
        if (label === null || label === undefined) continue; // tipo no deseado

        for (const entry of (grupo.entry || [])) {
          // Solo nos interesa anime, Jikan también lista manga en sus relaciones
          if (entry.type !== 'anime') continue;

          const relId = entry.mal_id;
          if (!relId) continue;

          if (!encontrados.has(relId)) {
            // Marcamos como placeholder; completamos datos después
            encontrados.set(relId, { mal_id: relId, tituloRaw: entry.name, relacion: label, relacionRaw: relacionTipo });
          }

          if (!visitados.has(relId)) {
            visitados.add(relId);
            cola.push(relId);
          }
        }
      }
    }

    encontrados.delete(malId);
    if (encontrados.size === 0) return [];

    // Completar datos (imagen, score, año, episodios) en paralelo controlado
    const ids = Array.from(encontrados.keys());
    const detalles = [];
    for (const id of ids) {
      const info = await fetchAnimeInfo(id);
      detalles.push({ id, info });
    }

    const lista = detalles
      .map(({ id, info }) => {
        const base = encontrados.get(id);
        if (!info) {
          // Si no se pudo cargar el detalle, devolver versión mínima
          return {
            id:        `mal-${id}`,
            anilist_id: null,
            mal_id:    id,
            titulo:    base.tituloRaw,
            imagen:    null,
            score:     null,
            episodios: null,
            estado:    null,
            tipo:      null,
            año:       null,
            relacion:  base.relacion,
            relacionRaw: base.relacionRaw,
            source:    'jikan',
          };
        }
        return {
          ...info,
          relacion:    base.relacion,
          relacionRaw: base.relacionRaw,
        };
      });

    lista.sort((a, b) => {
      const pa = JIKAN_PRIORIDAD[a.relacionRaw] ?? 9;
      const pb = JIKAN_PRIORIDAD[b.relacionRaw] ?? 9;
      if (pa !== pb) return pa - pb;
      return (a.año || 0) - (b.año || 0);
    });

    return lista;
  } catch (err) {
    console.warn('[Jikan relaciones]', err.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PÚBLICA: Detalle completo de un anime por mal_id (para navegar al hacer
// click en un relacionado).
// ─────────────────────────────────────────────────────────────────────────────
export async function buscarDetalleById(malId) {
  const res = await get(`${BASE}/anime/${malId}`);
  return normalizar(res.data.data);
}