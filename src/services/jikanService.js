import axios from 'axios';

const BASE = 'https://api.jikan.moe/v4';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function get(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { timeout: 15000 });
    } catch (err) {
      const s = err.response?.status;
      if ((s === 429 || s === 504 || s === 503 || !s) && i < retries - 1) {
        await delay(1500 * (i + 1));
        continue;
      }
      throw err;
    }
  }
}

// ── Formato unificado ─────────────────────────────────────────────────────────
function normalizar(a) {
  return {
    id:             `mal-${a.mal_id}`,
    mal_id:         a.mal_id,
    anilist_id:     null,
    titulo:         a.title,
    titulo_ingles:  a.title_english || a.title,
    titulo_japones: a.title_japanese,
    imagen:         a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url,
    score:          a.score,
    episodios:      a.episodes,
    generos:        [...(a.genres || []), ...(a.themes || []), ...(a.demographics || [])],
    año:            a.year || a.aired?.prop?.from?.year,
    temporada:      a.season?.toLowerCase() || null,
    tipo:           a.type,
    estado:         a.status,
    sinopsis:       a.synopsis || '',
    popularidad:    a.popularity,
    source:         'jikan',
  };
}

// ── Top anime por score (MAL score es el estándar) ────────────────────────────
export async function buscarTop(page = 1) {
  const safePage = Math.min(page, 4);
  const res = await get(`${BASE}/top/anime?page=${safePage}`);
  return {
    data:        (res.data.data || []).map(normalizar),
    hasNextPage: res.data.pagination?.has_next_page || false,
    source:      'jikan',
  };
}

// ── Búsqueda por nombre (sfw=false = sin censura) ─────────────────────────────
export async function buscarPorNombre(query, page = 1) {
  const params = new URLSearchParams({
    q:        query,
    page,
    limit:    24,
    order_by: 'popularity',
    sort:     'asc',
    sfw:      false,
  });
  const res = await get(`${BASE}/anime?${params}`);
  return {
    data:        (res.data.data || []).map(normalizar),
    hasNextPage: res.data.pagination?.has_next_page || false,
    source:      'jikan',
  };
}
