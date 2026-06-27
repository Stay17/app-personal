import React, { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { Search, Star, Layers, X, ChevronDown, Loader2, Shuffle, TrendingUp, Trophy, Skull, AlertTriangle } from 'lucide-react';
import * as jikan from '../services/jikanService';
import * as anilist from '../services/anilistService';
import ApiToggle from '../components/ApiToggle';

// ── Géneros hardcoded (nombre AniList + ID Jikan para filtros) ────────────────
const GENRES = [
  { name: 'Action' },        { name: 'Adventure' },   { name: 'Comedy' },
  { name: 'Drama' },         { name: 'Ecchi' },       { name: 'Fantasy' },
  { name: 'Horror' },        { name: 'Mahou Shoujo' },{ name: 'Mecha' },
  { name: 'Music' },         { name: 'Mystery' },     { name: 'Psychological' },
  { name: 'Romance' },       { name: 'Sci-Fi' },      { name: 'Slice of Life' },
  { name: 'Sports' },        { name: 'Supernatural' },{ name: 'Thriller' },
  { name: 'Hentai' },
].sort((a, b) => traducirGenero(a.name).localeCompare(traducirGenero(b.name), 'es'));

// ── Traducciones ──────────────────────────────────────────────────────────────
function traducirEstado(status) {
  const m = { 'Finished Airing': 'Finalizado', 'Currently Airing': 'En emisión', 'Not yet aired': 'No emitido' };
  return m[status] || status || 'Desconocido';
}
function getColorEstado(status) {
  if (status === 'Finished Airing') return '#EF4444';
  if (status === 'Currently Airing') return '#22C55E';
  return '#EAB308';
}
function traducirTemporada(season) {
  const m = { summer: 'Verano', winter: 'Invierno', spring: 'Primavera', fall: 'Otoño' };
  return m[season?.toLowerCase()] || '';
}
function traducirGenero(name) {
  const m = {
    'Action': 'Acción', 'Adventure': 'Aventura', 'Avant Garde': 'Vanguardia',
    'Award Winning': 'Galardonado', 'Boys Love': 'Boys Love', 'Comedy': 'Comedia',
    'Drama': 'Drama', 'Fantasy': 'Fantasía', 'Girls Love': 'Girls Love',
    'Gourmet': 'Gastronomía', 'Horror': 'Terror', 'Mystery': 'Misterio',
    'Romance': 'Romance', 'Sci-Fi': 'Ciencia Ficción', 'Slice of Life': 'Recuentos de la vida',
    'Sports': 'Deportes', 'Supernatural': 'Sobrenatural', 'Suspense': 'Suspenso',
    'Ecchi': 'Ecchi', 'Erotica': 'Erótica', 'Hentai': 'Hentai',
    'Adult Cast': 'Elenco Adulto', 'Anthropomorphic': 'Personajes Antropomórficos',
    'CGDCT': 'Chicas Siendo Lindas', 'Childcare': 'Cuidado de Niños',
    'Combat Sports': 'Deportes de Combate', 'Crossdressing': 'Crossdressing',
    'Delinquents': 'Delincuentes', 'Detective': 'Detectives', 'Educational': 'Educativo',
    'Gag Humor': 'Humor Absurdo', 'Gore': 'Gore / Violencia Extrema', 'Harem': 'Harem',
    'High Stakes Game': 'Juego de Alto Riesgo', 'Historical': 'Histórico',
    'Idols (Female)': 'Idols Femeninas', 'Idols (Male)': 'Idols Masculinos',
    'Isekai': 'Isekai (Otro Mundo)', 'Iyashikei': 'Iyashikei (Relajante)',
    'Love Polygon': 'Polígono Amoroso', 'Love Status Quo': 'Sin Avance Romántico',
    'Magical Sex Shift': 'Cambio Mágico de Género', 'Mahou Shoujo': 'Mahou Shoujo (Chica Mágica)',
    'Martial Arts': 'Artes Marciales', 'Mecha': 'Mecha (Robots)', 'Medical': 'Médico',
    'Military': 'Militar', 'Music': 'Música', 'Mythology': 'Mitología',
    'Organized Crime': 'Crimen Organizado', 'Otaku Culture': 'Cultura Otaku',
    'Parody': 'Parodia', 'Performing Arts': 'Artes Escénicas', 'Pets': 'Mascotas',
    'Psychological': 'Psicológico', 'Racing': 'Carreras', 'Reincarnation': 'Reencarnación',
    'Reverse Harem': 'Reverse Harem', 'Romantic Subtext': 'Subtexto Romántico',
    'Samurai': 'Samurái', 'School': 'Escolar', 'Showbiz': 'Entretenimiento / Showbiz',
    'Space': 'Espacial', 'Strategy Game': 'Juegos de Estrategia', 'Super Power': 'Superpoderes',
    'Survival': 'Supervivencia', 'Team Sports': 'Deportes en Equipo',
    'Time Travel': 'Viajes en el Tiempo', 'Vampire': 'Vampiros', 'Video Game': 'Videojuegos',
    'Visual Arts': 'Artes Visuales', 'Workplace': 'Ambiente Laboral',
    'Urban Fantasy': 'Fantasía Urbana', 'Villainess': 'Villana',
    'Josei': 'Josei (Mujeres Adultas)', 'Kids': 'Infantil',
    'Seinen': 'Seinen (Hombres Adultos)', 'Shoujo': 'Shoujo (Chicas Jóvenes)',
    'Shounen': 'Shounen (Chicos Jóvenes)', 'Thriller': 'Suspenso',
  };
  return m[name] || name;
}

function deduplicar(lista) {
  const vistos = new Set();
  return lista.filter(item => {
    if (vistos.has(item.id)) return false;
    vistos.add(item.id);
    return true;
  });
}

// ── Dropdown de géneros ───────────────────────────────────────────────────────
const GeneroDropdown = ({ filtroGenero, setFiltroGenero }) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const seleccionado = GENRES.find(g => g.name === filtroGenero);
  const textoBoton = seleccionado ? traducirGenero(seleccionado.name) : 'Cualquier';
  const filtrados = GENRES.filter(g =>
    traducirGenero(g.name).toLowerCase().includes(busqueda.toLowerCase())
  );

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) { setAbierto(false); setBusqueda(''); } };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (abierto && inputRef.current) setTimeout(() => inputRef.current?.focus(), 50);
  }, [abierto]);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setAbierto(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', background: 'var(--bg-card, #1a1a1a)',
          border: '1px solid var(--border-color, #333)', borderRadius: '8px',
          color: filtroGenero ? 'var(--accent-color, #3ea6ff)' : 'var(--text-muted, #aaa)',
          fontSize: '0.9rem', cursor: 'pointer', gap: '8px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{textoBoton}</span>
        <ChevronDown size={16} style={{ flexShrink: 0, transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-muted, #aaa)' }} />
      </button>

      {abierto && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 2000,
          background: '#1e1e1e', border: '1px solid var(--border-color, #333)',
          borderRadius: '10px', boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          overflow: 'hidden', minWidth: '220px', width: 'max-content', maxWidth: '300px',
        }}>
          <div style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #aaa)' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar género..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{
                  width: '100%', padding: '7px 10px 7px 30px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px', color: 'var(--text-main, #fff)',
                  fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            <div
              onClick={() => { setFiltroGenero(''); setAbierto(false); setBusqueda(''); }}
              style={{ padding: '9px 14px', cursor: 'pointer', color: !filtroGenero ? 'var(--accent-color, #3ea6ff)' : 'var(--text-muted, #aaa)', fontWeight: !filtroGenero ? '600' : 'normal', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cualquier género
            </div>
            {filtrados.length === 0 && <div style={{ padding: '12px 14px', color: 'var(--text-muted, #aaa)', fontSize: '0.85rem' }}>Sin resultados</div>}
            {filtrados.map(g => (
              <div
                key={g.name}
                onClick={() => { setFiltroGenero(g.name); setAbierto(false); setBusqueda(''); }}
                style={{
                  padding: '8px 14px', cursor: 'pointer',
                  color: filtroGenero === g.name ? 'var(--accent-color, #3ea6ff)' : 'var(--text-main, #fff)',
                  fontWeight: filtroGenero === g.name ? '600' : 'normal',
                  fontSize: '0.88rem', background: 'transparent', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {traducirGenero(g.name)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Modal dropeado ────────────────────────────────────────────────────────────
const ModalDropear = ({ anime, onConfirm, onCancel }) => {
  const [comentario, setComentario] = useState('');
  const [capDropeo, setCapDropeo] = useState('');
  const maxEps = anime?.episodios || null;

  const handleCapChange = (e) => {
    const val = e.target.value;
    if (val === '') { setCapDropeo(''); return; }
    const num = parseInt(val);
    if (isNaN(num) || num < 0) return;
    if (maxEps && num > maxEps) { setCapDropeo(String(maxEps)); return; }
    setCapDropeo(String(num));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '14px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Skull size={18} /> ¿Por qué lo dropeaste?</h3>
        <p style={{ margin: '0 0 18px', color: '#aaa', fontSize: '0.9rem' }}>
          <strong style={{ color: '#fff' }}>{anime?.titulo}</strong> — deja una nota (opcional)
        </p>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: '6px', fontWeight: '600' }}>
            ¿En qué capítulo lo dejaste? {maxEps ? <span style={{ color: '#555' }}>(máx. {maxEps})</span> : null}
          </label>
          <input
            type="number" min="0" max={maxEps || undefined}
            placeholder={maxEps ? `0 – ${maxEps}` : 'Ej: 5'}
            value={capDropeo} onChange={handleCapChange}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', padding: '10px 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
        <textarea
          placeholder="Ej: muy lento, el protagonista me cae mal, etc."
          value={comentario} onChange={e => setComentario(e.target.value)} rows={4}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', padding: '12px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #444', borderRadius: '8px', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem' }}>Cancelar</button>
          <button onClick={() => onConfirm({ comentario, capDropeo: capDropeo !== '' ? parseInt(capDropeo) : 0 })} style={{ flex: 2, padding: '11px', background: '#EF4444', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Dropear anime
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const Explorar = () => {
  const [query, setQuery] = useState('');
  const [apiNombre, setApiNombre] = useState('anilist'); // toggle búsqueda por nombre
  const [estadoParaGuardar, setEstadoParaGuardar] = useState('pendiente');
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [selectedAnime, setSelectedAnime] = useState(null);
  const [sinopsisModal, setSinopsisModal] = useState('');
  const [traduciendo, setTraduciendo] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroEstacion, setFiltroEstacion] = useState('');
  const [filtroFormato, setFiltroFormato] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('random');

  const [animeADropear, setAnimeADropear] = useState(null);

  const requestIdRef = useRef(0);
  const basePageRef  = useRef(1);
  const gridRef      = useRef(null);

  // Ref siempre actualizado — evita stale closure en fetchAnimes
  const filtersRef = useRef({});
  filtersRef.current = { query, filtroGenero, filtroEstado, filtroFormato, filtroAno, filtroEstacion, ordenarPor, apiNombre };

  // ── fetchAnimes estable (lee de ref, sin stale closure) ───────────────────
  //
  //  Algoritmo de decisión:
  //  ┌─────────────────┬──────────────────────────────────────────┐
  //  │ Modo            │ API                                      │
  //  ├─────────────────┼──────────────────────────────────────────┤
  //  │ Random          │ AniList  — estable, página aleatoria     │
  //  │ Popularidad     │ AniList  — ranking confiable             │
  //  │ Top Score       │ Jikan    — score de MAL es el estándar   │
  //  │ Filtros activos │ AniList  — filtros más potentes          │
  //  │ Búsqueda nombre │ Toggle   — usuario elige AniList / MAL   │
  //  └─────────────────┴──────────────────────────────────────────┘
  //
  const fetchAnimes = useCallback(async (currentPage) => {
    const { query, filtroGenero, filtroEstado, filtroFormato, filtroAno, filtroEstacion, ordenarPor, apiNombre } = filtersRef.current;
    const myId = ++requestIdRef.current;

    if (currentPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError('');

    try {
      const hayFiltros = filtroGenero || filtroEstado || filtroFormato || filtroAno || filtroEstacion;
      let result;

      if (!query && !hayFiltros) {
        // ── Categorías sin filtros — cada pill usa su API óptima ───────────
        if (ordenarPor === 'score') {
          result = await jikan.buscarTop(currentPage);
        } else {
          if (currentPage === 1) basePageRef.current = Math.floor(Math.random() * 10) + 1;
          const pg = ordenarPor === 'random'
            ? basePageRef.current + (currentPage - 1)
            : currentPage;
          result = await anilist.buscarTop(pg, ordenarPor);
        }

      } else if (query && !hayFiltros) {
        // ── Búsqueda por nombre — toggle AniList / MAL ─────────────────────
        result = apiNombre === 'jikan'
          ? await jikan.buscarPorNombre(query, currentPage)
          : await anilist.buscarPorNombre(query, currentPage);

      } else {
        // ── Filtros activos — AniList maneja todo ──────────────────────────
        result = await anilist.buscarConFiltros({
          query:   query         || undefined,
          genre:   filtroGenero  || undefined,
          season:  filtroEstacion || undefined,
          year:    filtroAno     || undefined,
          format:  filtroFormato || undefined,
          status:  filtroEstado  || undefined,
          sort:    ordenarPor,
          page:    currentPage,
        });
      }

      if (requestIdRef.current !== myId) return;
      setHasMore(result.hasNextPage);
      setAnimes(prev =>
        currentPage === 1 ? result.data : deduplicar([...prev, ...result.data])
      );

    } catch (err) {
      if (requestIdRef.current !== myId) return;
      console.error('[Explorar]', err);
      setError('Error al obtener datos. Intenta de nuevo.');
    } finally {
      if (requestIdRef.current === myId) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []); // estable — lee filtros de filtersRef, no stale closure

  // ── Cambio de filtros / categoría → reset + fetch(1) con debounce ─────────
  useEffect(() => {
    setAnimes([]);
    setHasMore(true);
    setError('');
    setPage(1);
    const t = setTimeout(() => fetchAnimes(1), 600);
    return () => clearTimeout(t);
  }, [query, filtroGenero, filtroEstado, filtroFormato, filtroAno, filtroEstacion, ordenarPor, apiNombre, fetchAnimes]);

  // ── Load more → fetch(page) solo cuando page > 1 ─────────────────────────
  useEffect(() => {
    if (page <= 1) return;
    fetchAnimes(page);
  }, [page, fetchAnimes]);

  // ── Modal detalle ─────────────────────────────────────────────────────────
  const abrirPanel = async (anime) => {
    setSelectedAnime(anime);
    setEstadoParaGuardar('pendiente');
    document.body.style.overflow = 'hidden';
    setSinopsisModal('');

    if (anime.sinopsis) {
      setTraduciendo(true);
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(anime.sinopsis)}`;
        const res = await fetch(url);
        const data = await res.json();
        setSinopsisModal(data[0].map(item => item[0]).join(''));
      } catch {
        setSinopsisModal(anime.sinopsis);
      } finally {
        setTraduciendo(false);
      }
    } else {
      setSinopsisModal('Sinopsis oficial no disponible.');
    }
  };

  const cerrarPanel = () => {
    setSelectedAnime(null);
    document.body.style.overflow = 'unset';
  };

  // ── Guardar en lista ──────────────────────────────────────────────────────
  const agregarAnimeALista = async (anime, estado, dropData = {}) => {
    const efectiveMalId = anime.mal_id ?? (anime.anilist_id ? -anime.anilist_id : null);
    try {
      const { data: existe, error: err1 } = await supabase
        .from('anime_list').select('id, estado').eq('mal_id', efectiveMalId).single();

      if (err1 && err1.code !== 'PGRST116') throw err1;

      if (existe) {
        Swal.fire({ title: '¡Ya lo tienes!', text: `Ya está en tu lista de "${existe.estado}".`, icon: 'warning', background: '#1a1a1a', color: '#fff', confirmButtonColor: '#3ea6ff' });
        return;
      }

      const payload = {
        mal_id:           efectiveMalId,
        titulo:           anime.titulo,
        imagen:           anime.imagen,
        estado,
        episodio_actual:  estado === 'completado' ? (anime.episodios || 0) : estado === 'dropeado' ? (dropData.capDropeo || 0) : 0,
        episodios_totales: anime.episodios || 0,
      };
      if (estado === 'dropeado' && dropData.comentario) payload.comentario_dropeo = dropData.comentario;

      const { error: err2 } = await supabase.from('anime_list').insert([payload]);
      if (err2) throw err2;

      Swal.fire({ title: estado === 'dropeado' ? 'Dropeado' : '¡Añadido!', text: `"${anime.titulo}" guardado en ${estado}`, icon: 'success', background: '#1a1a1a', color: '#fff', confirmButtonColor: '#3ea6ff', timer: 2000, showConfirmButton: false });
      cerrarPanel();
    } catch (err) {
      console.error('Error al guardar:', err.message);
      Swal.fire({ title: 'Error', text: 'Hubo un problema al guardar.', icon: 'error', background: '#1a1a1a', color: '#fff', confirmButtonColor: '#3ea6ff' });
    }
  };

  const handleGuardar = () => {
    if (estadoParaGuardar === 'dropeado') setAnimeADropear(selectedAnime);
    else agregarAnimeALista(selectedAnime, estadoParaGuardar);
  };

  const listaAnos = Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i);
  const opcionesOrden = [
    { id: 'random',     label: 'Aleatorio',         icon: <Shuffle size={15} />,    color: '#a78bfa' },
    { id: 'popularity', label: 'Popularidad',        icon: <TrendingUp size={15} />, color: '#fb923c' },
    { id: 'score',      label: 'Mejor calificación', icon: <Trophy size={15} />,     color: '#facc15' },
  ];

  return (
    <div>
      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .spin-icon { animation: spin 1s linear infinite; }
        .btn-cargar-mas {
          display:flex;align-items:center;justify-content:center;gap:10px;
          padding:14px 36px;background-color:var(--accent-color);color:#000;
          border:none;border-radius:30px;cursor:pointer;font-weight:800;
          font-family:var(--font-main);font-size:0.95rem;text-transform:uppercase;
          letter-spacing:1.5px;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow:0 4px 15px rgba(0,0,0,0.2);
        }
        .btn-cargar-mas:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 8px 25px rgba(0,0,0,0.4);filter:brightness(1.1)}
        .btn-cargar-mas:active:not(:disabled){transform:translateY(0)}
        .btn-cargar-mas:disabled{background-color:transparent;border:2px solid var(--border-color);color:var(--text-muted);cursor:not-allowed;box-shadow:none}
        .orden-pill{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:20px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.45);font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s ease;white-space:nowrap;letter-spacing:0.3px;user-select:none}
        .orden-pill:hover{border-color:rgba(255,255,255,0.25);color:rgba(255,255,255,0.75);background:rgba(255,255,255,0.07)}
        .orden-pill.activo-random{border-color:#a78bfa;color:#a78bfa;background:rgba(167,139,250,0.1);box-shadow:0 0 12px rgba(167,139,250,0.2)}
        .orden-pill.activo-popularity{border-color:#fb923c;color:#fb923c;background:rgba(251,146,60,0.1);box-shadow:0 0 12px rgba(251,146,60,0.2)}
        .orden-pill.activo-score{border-color:#facc15;color:#facc15;background:rgba(250,204,21,0.1);box-shadow:0 0 12px rgba(250,204,21,0.2)}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="title" style={{ color: '#3ea6ff', margin: 0, fontWeight: 800 }}>Explorador Animes</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            API
          </span>
          <ApiToggle value={apiNombre} onChange={setApiNombre} />
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="search-container">
        <Search className="search-icon" size={24} />
        <input
          type="text" className="search-input" placeholder="Buscar anime..."
          value={query} onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Pills de ordenamiento */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginRight: '4px' }}>
          Ordenar
        </span>
        {opcionesOrden.map(op => (
          <button key={op.id} className={`orden-pill${ordenarPor === op.id ? ` activo-${op.id}` : ''}`} onClick={() => setOrdenarPor(op.id)}>
            {op.icon}{op.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Géneros</label>
          <GeneroDropdown filtroGenero={filtroGenero} setFiltroGenero={setFiltroGenero} />
        </div>
        <div className="filter-group">
          <label>Año</label>
          <div className="select-wrapper">
            <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)}>
              <option value="">Cualquier</option>
              {listaAnos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <ChevronDown className="select-icon" size={16} />
          </div>
        </div>
        <div className="filter-group">
          <label>Estación</label>
          <div className="select-wrapper">
            <select value={filtroEstacion} onChange={e => setFiltroEstacion(e.target.value)}>
              <option value="">Cualquier</option>
              <option value="winter">Invierno</option>
              <option value="spring">Primavera</option>
              <option value="summer">Verano</option>
              <option value="fall">Otoño</option>
            </select>
            <ChevronDown className="select-icon" size={16} />
          </div>
        </div>
        <div className="filter-group">
          <label>Formato</label>
          <div className="select-wrapper">
            <select value={filtroFormato} onChange={e => setFiltroFormato(e.target.value)}>
              <option value="">Cualquier</option>
              <option value="tv">TV</option>
              <option value="movie">Película</option>
              <option value="ova">OVA</option>
              <option value="special">Especial</option>
            </select>
            <ChevronDown className="select-icon" size={16} />
          </div>
        </div>
        <div className="filter-group">
          <label>Estado De Emisión</label>
          <div className="select-wrapper">
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Cualquier</option>
              <option value="airing">En emisión</option>
              <option value="complete">Finalizado</option>
              <option value="upcoming">No emitido</option>
            </select>
            <ChevronDown className="select-icon" size={16} />
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Grid */}
      <div className="anime-grid" ref={gridRef}>
        {loading && page === 1 ? (
          [...Array(12)].map((_, i) => <div key={i} className="skeleton" />)
        ) : animes.length === 0 && !loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem' }}>No se encontraron animes con esos filtros.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Intenta cambiar los filtros o el orden.</p>
          </div>
        ) : (
          animes.map(anime => (
            <div key={anime.id} className="anime-card" onClick={() => abrirPanel(anime)}>
              <img src={anime.imagen} alt={anime.titulo} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', objectPosition: 'center' }} />
              <div className="anime-info">
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', marginBottom: '6px', fontWeight: 'bold' }}>
                  <span style={{ color: getColorEstado(anime.estado) }}>{traducirEstado(anime.estado)}</span>
                  <span style={{ color: 'var(--border-color)' }}>|</span>
                  <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {anime.temporada ? `${traducirTemporada(anime.temporada)} ` : ''}{anime.año || 'P.A.'}
                  </span>
                </div>
                <h3 className="anime-title">{anime.titulo}</h3>
                <div className="anime-meta">
                  <span><Star size={16} fill="#EAB308" color="#EAB308" /> {anime.score || 'N/A'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                    <Layers size={16} color="var(--accent-color)" /> {anime.episodios || '?'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cargar más */}
      {!loading && hasMore && animes.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', paddingBottom: '60px' }}>
          <button className="btn-cargar-mas" disabled={loadingMore} onClick={() => { setLoadingMore(true); setPage(p => p + 1); }}>
            {loadingMore ? <><Loader2 size={20} className="spin-icon" />Cargando Animes...</> : 'Cargar más resultados'}
          </button>
        </div>
      )}

      {/* Modal detalle */}
      {selectedAnime && (
        <div className="modal-overlay" onClick={cerrarPanel}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={cerrarPanel} style={{ zIndex: 10 }}><X size={20} /></button>
            <img src={selectedAnime.imagen} alt={selectedAnime.titulo} className="modal-image" style={{ objectFit: 'contain', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }} />
            <div className="modal-info">
              <h2 style={{ paddingRight: '45px', lineHeight: '1.3', marginBottom: '15px' }}>{selectedAnime.titulo}</h2>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', fontWeight: 'bold', fontSize: '0.95rem' }}>
                <span style={{ color: getColorEstado(selectedAnime.estado) }}>{traducirEstado(selectedAnime.estado)}</span>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {selectedAnime.temporada ? `${traducirTemporada(selectedAnime.temporada)} ` : ''}{selectedAnime.año || 'P.A.'}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '20px', fontSize: '0.95rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', color: '#EAB308', fontWeight: 'bold' }}>
                  <Star size={18} fill="#EAB308" color="#EAB308" style={{ marginRight: '5px' }} />{selectedAnime.score || 'N/A'}
                </span>
                <span style={{ color: 'var(--border-color)', fontWeight: 'bold' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-main)' }}>
                  <Layers size={16} color="var(--accent-color)" style={{ marginRight: '5px' }} />
                  {selectedAnime.episodios ? `${selectedAnime.episodios} caps` : 'En emisión'}
                </span>
                {(selectedAnime.generos || []).map((g, i) => (
                  <React.Fragment key={g.name || i}>
                    <span style={{ color: 'var(--border-color)', fontWeight: 'bold' }}>•</span>
                    <span style={{ color: 'var(--text-main)' }}>{traducirGenero(g.name)}</span>
                  </React.Fragment>
                ))}
              </div>
              <div className="modal-synopsis">
                {traduciendo
                  ? <p style={{ color: 'var(--accent-color)', fontStyle: 'italic' }}>Traduciendo sinopsis al español...</p>
                  : <p>{sinopsisModal}</p>
                }
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '15px', alignItems: 'stretch', borderTop: '1px solid var(--border-color)' }}>
                <select
                  value={estadoParaGuardar} onChange={e => setEstadoParaGuardar(e.target.value)}
                  style={{ flex: '1', backgroundColor: '#1a1a1a', color: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 15px', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', height: '45px' }}
                >
                  <option value="pendiente"  style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Pendiente</option>
                  <option value="viendo"     style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Viendo</option>
                  <option value="completado" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Completado</option>
                  <option value="pausado"    style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Pausado</option>
                  <option value="atrasado"   style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Atrasado</option>
                  <option value="dropeado"   style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Dropeado</option>
                </select>
                <button
                  className="btn-add" onClick={handleGuardar}
                  style={{ flex: '2', margin: 0, height: '45px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', background: estadoParaGuardar === 'dropeado' ? '#EF4444' : undefined }}
                >
                  {estadoParaGuardar === 'dropeado' ? <><Skull size={15} style={{ marginRight: '6px' }} /> Dropear anime</> : 'Guardar en mi lista'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal dropear */}
      {animeADropear && (
        <ModalDropear
          anime={animeADropear}
          onConfirm={dropData => { setAnimeADropear(null); agregarAnimeALista(animeADropear, 'dropeado', dropData); }}
          onCancel={() => setAnimeADropear(null)}
        />
      )}
    </div>
  );
};

export default Explorar;
