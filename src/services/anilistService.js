import axios from 'axios';

const URL = 'https://graphql.anilist.co';

const QUERY = `
query($page:Int,$perPage:Int,$search:String,$genres:[String],$season:MediaSeason,
      $seasonYear:Int,$format:MediaFormat,$status:MediaStatus,$sort:[MediaSort]){
  Page(page:$page,perPage:$perPage){
    pageInfo{hasNextPage}
    media(type:ANIME,search:$search,genre_in:$genres,season:$season,
          seasonYear:$seasonYear,format:$format,status:$status,sort:$sort){
      id idMal
      title{romaji english native}
      coverImage{large extraLarge}
      averageScore episodes status season seasonYear format genres description popularity
    }
  }
}`;

const STATUS = {
  FINISHED:         'Finished Airing',
  RELEASING:        'Currently Airing',
  NOT_YET_RELEASED: 'Not yet aired',
  CANCELLED:        'Cancelled',
  HIATUS:           'On Hiatus',
};
const FORMAT  = { TV:'TV', MOVIE:'Movie', OVA:'OVA', SPECIAL:'Special', ONA:'ONA' };
const SEASON  = { winter:'WINTER', spring:'SPRING', summer:'SUMMER', fall:'FALL' };
const FMTP    = { tv:'TV', movie:'MOVIE', ova:'OVA', special:'SPECIAL' };
const STATUSP = { airing:'RELEASING', complete:'FINISHED', upcoming:'NOT_YET_RELEASED' };

// ── Formato unificado ─────────────────────────────────────────────────────────
function normalizar(m) {
  return {
    id:             `al-${m.id}`,
    mal_id:         m.idMal || null,
    anilist_id:     m.id,
    titulo:         m.title.romaji,
    titulo_ingles:  m.title.english || m.title.romaji,
    titulo_japones: m.title.native,
    imagen:         m.coverImage.extraLarge || m.coverImage.large,
    score:          m.averageScore ? +(m.averageScore / 10).toFixed(2) : null,
    episodios:      m.episodes,
    generos:        (m.genres || []).map(name => ({ name })),
    año:            m.seasonYear,
    temporada:      m.season?.toLowerCase() || null,
    tipo:           FORMAT[m.format] || m.format,
    estado:         STATUS[m.status] || m.status,
    sinopsis:       m.description?.replace(/<[^>]*>/g, '').replace(/\n/g, ' ') || '',
    popularidad:    m.popularity,
    source:         'anilist',
  };
}

async function query(variables) {
  const res = await axios.post(URL, { query: QUERY, variables }, { timeout: 20000 });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.Page;
}

// ── Top anime por popularidad (Random/Popularidad) ────────────────────────────
export async function buscarTop(page = 1, sort = 'popularity') {
  const sortMap = { popularity: ['POPULARITY_DESC'], random: ['POPULARITY_DESC'] };
  const page_data = await query({ page, perPage: 24, sort: sortMap[sort] || ['POPULARITY_DESC'] });
  return {
    data:        page_data.media.map(normalizar),
    hasNextPage: page_data.pageInfo.hasNextPage,
    source:      'anilist',
  };
}

// ── Búsqueda por nombre ───────────────────────────────────────────────────────
export async function buscarPorNombre(queryStr, page = 1) {
  const page_data = await query({
    page, perPage: 24,
    search: queryStr,
    sort: ['POPULARITY_DESC'],
  });
  return {
    data:        page_data.media.map(normalizar),
    hasNextPage: page_data.pageInfo.hasNextPage,
    source:      'anilist',
  };
}

// ── Búsqueda con filtros (género, año, estación, formato, estado) ─────────────
export async function buscarConFiltros({ query: q, genre, season, year, format, status, sort = 'popularity', page = 1 }) {
  const sortMap = { popularity: ['POPULARITY_DESC'], score: ['SCORE_DESC'], random: ['POPULARITY_DESC'] };
  const vars = { page, perPage: 24, sort: sortMap[sort] || ['POPULARITY_DESC'] };

  if (q)      vars.search     = q;
  if (genre)  vars.genres     = [genre];
  if (season) vars.season     = SEASON[season];
  if (year)   vars.seasonYear = +year;
  if (format) vars.format     = FMTP[format];
  if (status) vars.status     = STATUSP[status];

  const page_data = await query(vars);
  return {
    data:        page_data.media.map(normalizar),
    hasNextPage: page_data.pageInfo.hasNextPage,
    source:      'anilist',
  };
}
