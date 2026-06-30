import axios from 'axios';

const ANILIST_URL = 'https://graphql.anilist.co';

// ── Query principal (sin relaciones, para búsquedas masivas) ─────────────────
const QUERY = `
query($page:Int,$perPage:Int,$search:String,$genres:[String],$season:MediaSeason,
      $seasonYear:Int,$format:MediaFormat,$status:MediaStatus,$sort:[MediaSort]){
  Page(page:$page,perPage:$perPage){
    pageInfo{hasNextPage currentPage}
    media(type:ANIME,search:$search,genre_in:$genres,season:$season,
          seasonYear:$seasonYear,format:$format,status:$status,sort:$sort){
      id idMal
      title{romaji english native}
      coverImage{large extraLarge}
      averageScore episodes status season seasonYear format genres description popularity
      isAdult
    }
  }
}`;

// ── Query de detalle con relaciones (1 nivel) — usada para BFS y para navegar ─
const QUERY_DETALLE = `
query($id:Int){
  Media(id:$id,type:ANIME){
    id idMal
    title{romaji english native}
    coverImage{large extraLarge}
    averageScore episodes status season seasonYear format genres description popularity
    isAdult
    relations{
      edges{
        relationType(version:2)
        node{
          id idMal
          title{romaji english native}
          coverImage{large extraLarge}
          averageScore episodes status season seasonYear format
          type
        }
      }
    }
  }
}`;

// ── Query por MAL ID (para resolver el ID de AniList desde un anime de Jikan) ─
const QUERY_BY_MAL = `
query($malId:Int){
  Media(idMal:$malId,type:ANIME){
    id idMal
  }
}`;

const STATUS_MAP  = {
  FINISHED:         'Finished Airing',
  RELEASING:        'Currently Airing',
  NOT_YET_RELEASED: 'Not yet aired',
  CANCELLED:        'Cancelled',
  HIATUS:           'On Hiatus',
};
const FORMAT_MAP   = { TV:'TV', MOVIE:'Movie', OVA:'OVA', SPECIAL:'Special', ONA:'ONA', MUSIC:'Music' };
const SEASON_MAP   = { winter:'WINTER', spring:'SPRING', summer:'SUMMER', fall:'FALL' };
const FORMAT_PARAM = { tv:'TV', movie:'MOVIE', ova:'OVA', special:'SPECIAL', ona:'ONA' };
const STATUS_PARAM = { airing:'RELEASING', complete:'FINISHED', upcoming:'NOT_YET_RELEASED' };

// Tipos de relación que SÍ queremos mostrar (solo anime↔anime, nunca manga/novela)
const RELACION_LABEL = {
  SEQUEL:       'Secuela',
  PREQUEL:      'Precuela',
  SIDE_STORY:   'Historia Paralela',
  ALTERNATIVE:  'Alternativa',
  SPIN_OFF:     'Spin-off',
  SUMMARY:      'Resumen',
  PARENT:       'Historia Principal',
  COMPILATION:  'Compilación',
  CONTAINS:     'Contiene',
  // Excluidos a propósito (no son parte de "la misma franquicia de anime"):
  CHARACTER:    null,
  OTHER:        null,
  SOURCE:       null, // manga/novela fuente — nunca mostrar
  ADAPTATION:   null, // adaptación a manga — nunca mostrar
};

// Tipos de media de AniList que NO son anime (filtrar siempre)
const TIPOS_NO_ANIME = new Set(['MANGA']);

export const ANILIST_GENRES = [
  'Action','Adventure','Avant Garde','Award Winning','Boys Love','Comedy',
  'Drama','Ecchi','Erotica','Fantasy','Girls Love','Gourmet','Hentai',
  'Horror','Mahou Shoujo','Mecha','Military','Music','Mystery','Psychological',
  'Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Suspense','Thriller',
  'Adult Cast','Anthropomorphic','CGDCT','Childcare','Combat Sports','Crossdressing',
  'Delinquents','Detective','Educational','Gag Humor','Gore','Harem',
  'High Stakes Game','Historical','Idols (Female)','Idols (Male)','Isekai',
  'Iyashikei','Love Polygon','Love Status Quo','Magical Sex Shift','Martial Arts','Medical',
  'Mythology','Organized Crime','Otaku Culture','Parody','Performing Arts',
  'Pets','Racing','Reincarnation','Reverse Harem','Romantic Subtext','Samurai',
  'School','Showbiz','Space','Strategy Game','Super Power','Survival',
  'Team Sports','Time Travel','Vampire','Video Game','Visual Arts','Workplace',
  'Urban Fantasy','Villainess','Josei','Kids','Seinen','Shoujo','Shounen',
];

function normalizar(m) {
  return {
    id:             `al-${m.id}`,
    mal_id:         m.idMal || null,
    anilist_id:     m.id,
    titulo:         m.title.english || m.title.romaji,
    titulo_romaji:  m.title.romaji,
    titulo_japones: m.title.native,
    imagen:         m.coverImage?.extraLarge || m.coverImage?.large,
    score:          m.averageScore ? +(m.averageScore / 10).toFixed(2) : null,
    episodios:      m.episodes,
    generos:        (m.genres || []).map(name => ({ name })),
    año:            m.seasonYear,
    temporada:      m.season?.toLowerCase() || null,
    tipo:           FORMAT_MAP[m.format] || m.format,
    estado:         STATUS_MAP[m.status] || m.status,
    sinopsis:       m.description?.replace(/<[^>]*>/g, '').replace(/\n/g, ' ') || '',
    popularidad:    m.popularity,
    isAdult:        m.isAdult || false,
    source:         'anilist',
  };
}

// Devuelve { item, raw } o null si debe filtrarse (manga/novela/tipo excluido)
function normalizarRelacionEdge(edge) {
  const n    = edge.node;
  const tipo = edge.relationType;
  const label = RELACION_LABEL[tipo];

  if (label === null || label === undefined) return null;   // tipo no deseado
  if (TIPOS_NO_ANIME.has(n.type)) return null;               // manga/novela — nunca

  return {
    raw: tipo,
    item: {
      id:         `al-${n.id}`,
      anilist_id: n.id,
      mal_id:     n.idMal || null,
      titulo:     n.title.english || n.title.romaji,
      imagen:     n.coverImage?.extraLarge || n.coverImage?.large,
      score:      n.averageScore ? +(n.averageScore / 10).toFixed(2) : null,
      episodios:  n.episodes,
      estado:     STATUS_MAP[n.status] || n.status,
      tipo:       FORMAT_MAP[n.format] || n.format,
      año:        n.seasonYear,
      temporada:  n.season?.toLowerCase() || null,
      relacion:   label,
      relacionRaw: tipo,
      source:     'anilist',
    },
  };
}

async function queryAL(q, variables) {
  const res = await axios.post(
    ANILIST_URL,
    { query: q, variables },
    { timeout: 20000 }
  );
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data;
}

// Trae el nodo + sus relaciones directas (1 salto) para un AniList ID dado
async function fetchNodoConRelaciones(anilistId) {
  const data = await queryAL(QUERY_DETALLE, { id: anilistId });
  return data.Media;
}

// Resuelve un MAL ID → AniList ID
async function resolverAnilistId(malId) {
  try {
    const data = await queryAL(QUERY_BY_MAL, { malId });
    return data.Media?.id || null;
  } catch {
    return null;
  }
}

const PRIORIDAD_RELACION = {
  PREQUEL:0, SEQUEL:1, PARENT:2, SIDE_STORY:3,
  SUMMARY:4, ALTERNATIVE:5, SPIN_OFF:6, COMPILATION:7, CONTAINS:8,
};

// ─────────────────────────────────────────────────────────────────────────────
// PÚBLICA: Recorre TODA la franquicia (BFS) a partir de un anime y devuelve
// todos los animes relacionados encontrados (temporadas, películas, OVAs,
// especiales, spin-offs...), sin duplicados, sin manga/novela.
//
// AniList solo expone relaciones directas (1 salto) por nodo, así que para
// franquicias largas (ej. JoJo con 9 partes) hay que ir saltando nodo a nodo
// y acumulando hasta que no aparezcan IDs nuevos.
// ─────────────────────────────────────────────────────────────────────────────
export async function buscarRelaciones(anilistId, malId = null) {
  try {
    let startId = anilistId;
    if (!startId && malId && malId > 0) {
      startId = await resolverAnilistId(malId);
    }
    if (!startId) return [];

    const visitados   = new Set([startId]);   // IDs ya recorridos (evita ciclos/duplicados)
    const encontrados  = new Map();           // anilist_id -> item (relación final a mostrar)
    const cola         = [startId];
    const MAX_NODOS     = 25; // límite de seguridad para franquicias enormes

    let nodosRecorridos = 0;

    while (cola.length > 0 && nodosRecorridos < MAX_NODOS) {
      const currentId = cola.shift();
      nodosRecorridos++;

      let nodo;
      try {
        nodo = await fetchNodoConRelaciones(currentId);
      } catch {
        continue; // si falla un nodo, seguimos con el resto
      }
      if (!nodo?.relations?.edges) continue;

      for (const edge of nodo.relations.edges) {
        const parsed = normalizarRelacionEdge(edge);
        if (!parsed) continue;

        const { item, raw } = parsed;
        const id = item.anilist_id;

        // Guardar como relación a mostrar (si no estaba ya, o si esta vez
        // encontramos una etiqueta más relevante para el mismo nodo)
        if (!encontrados.has(id)) {
          encontrados.set(id, item);
        }

        // Si no lo hemos visitado todavía, lo agregamos a la cola para
        // seguir explorando sus propias relaciones (así llegamos a Part 9
        // partiendo de Part 1)
        if (!visitados.has(id)) {
          visitados.add(id);
          cola.push(id);
        }
      }
    }

    // El nodo inicial nunca debe aparecer en su propia lista de relacionados
    encontrados.delete(startId);

    const lista = Array.from(encontrados.values());

    // Ordenar por prioridad de relación y luego por año
    lista.sort((a, b) => {
      const pa = PRIORIDAD_RELACION[a.relacionRaw] ?? 9;
      const pb = PRIORIDAD_RELACION[b.relacionRaw] ?? 9;
      if (pa !== pb) return pa - pb;
      return (a.año || 0) - (b.año || 0);
    });

    return lista;
  } catch (err) {
    console.warn('[AniList relaciones]', err.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PÚBLICA: Detalle completo de un anime por AniList ID (para navegar al hacer
// click en un relacionado). Las relaciones que trae son solo 1 salto; si se
// quiere la franquicia completa desde ahí, se debe volver a llamar a
// buscarRelaciones con su anilist_id.
// ─────────────────────────────────────────────────────────────────────────────
export async function buscarDetalleById(anilistId) {
  const m = await fetchNodoConRelaciones(anilistId);
  return normalizar(m);
}

async function queryALPage(variables) {
  const data = await queryAL(QUERY, variables);
  return data.Page;
}

export async function buscarPorNombre(queryStr, page = 1) {
  const data = await queryALPage({
    page, perPage: 24,
    search: queryStr,
    sort: ['SEARCH_MATCH'],
  });
  return {
    data:        data.media.map(normalizar),
    hasNextPage: data.pageInfo.hasNextPage,
    source:      'anilist',
  };
}

export async function buscarConFiltros({
  query: q, genre, season, year, format, status,
  sort = 'popularity', page = 1, randomPage = null,
}) {
  const sortValues = {
    popularity: ['POPULARITY_DESC'],
    score:      ['SCORE_DESC', 'POPULARITY_DESC'],
    random:     ['POPULARITY_DESC'],
  };
  const realPage = (sort === 'random' && randomPage != null)
    ? randomPage + (page - 1)
    : page;

  const vars = {
    page: realPage, perPage: 24,
    sort: sortValues[sort] || ['POPULARITY_DESC'],
  };
  if (q)      vars.search     = q;
  if (genre)  vars.genres     = [genre];
  if (season && SEASON_MAP[season]) vars.season = SEASON_MAP[season];
  if (year)   vars.seasonYear = +year;
  if (format && FORMAT_PARAM[format]) vars.format = FORMAT_PARAM[format];
  if (status && STATUS_PARAM[status]) vars.status = STATUS_PARAM[status];

  const data = await queryALPage(vars);
  return {
    data:        data.media.map(normalizar),
    hasNextPage: data.pageInfo.hasNextPage,
    source:      'anilist',
  };
}

export async function buscarTop(page = 1, sort = 'popularity', randomPage = null) {
  return buscarConFiltros({ sort, page, randomPage });
}