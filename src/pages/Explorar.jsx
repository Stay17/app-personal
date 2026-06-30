import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import {
  Search, Star, Layers, X, ChevronDown, Loader2,
  Shuffle, TrendingUp, Trophy, Skull, AlertTriangle,
  GitBranch, ChevronRight, ArrowLeft,
} from 'lucide-react';
import * as jikan    from '../services/jikanService';
import * as anilist  from '../services/anilistService';
import ApiToggle     from '../components/ApiToggle';

// ─────────────────────────────────────────────────────────────────────────────
// TRADUCCIONES
// ─────────────────────────────────────────────────────────────────────────────
function traducirEstado(s) {
  const m = {
    'Finished Airing':'Finalizado','Currently Airing':'En emisión',
    'Not yet aired':'No emitido','Cancelled':'Cancelado','On Hiatus':'En pausa',
  };
  return m[s] || s || 'Desconocido';
}
function colorEstado(s) {
  if (s==='Finished Airing')  return '#EF4444';
  if (s==='Currently Airing') return '#22C55E';
  if (s==='Not yet aired')    return '#EAB308';
  return '#888';
}
function traducirTemporada(s) {
  return {summer:'Verano',winter:'Invierno',spring:'Primavera',fall:'Otoño'}[s?.toLowerCase()]||'';
}
function trad(name) {
  const m = {
    Action:'Acción',Adventure:'Aventura','Avant Garde':'Vanguardia','Award Winning':'Galardonado',
    'Boys Love':'Boys Love',Comedy:'Comedia',Drama:'Drama',Ecchi:'Ecchi',Erotica:'Erótica',
    Fantasy:'Fantasía','Girls Love':'Girls Love',Gourmet:'Gastronomía',Hentai:'Hentai',
    Horror:'Terror','Mahou Shoujo':'Mahou Shoujo',Mecha:'Mecha',Military:'Militar',
    Music:'Música',Mystery:'Misterio',Psychological:'Psicológico',Romance:'Romance',
    'Sci-Fi':'Ciencia Ficción','Slice of Life':'Recuentos de la vida',Sports:'Deportes',
    Supernatural:'Sobrenatural',Suspense:'Suspenso',Thriller:'Thriller',
    'Adult Cast':'Elenco Adulto',Anthropomorphic:'Antropomórfico',CGDCT:'Chicas Siendo Lindas',
    Childcare:'Cuidado de Niños','Combat Sports':'Deportes de Combate',Crossdressing:'Crossdressing',
    Delinquents:'Delincuentes',Detective:'Detectives',Educational:'Educativo',
    'Gag Humor':'Humor Absurdo',Gore:'Gore',Harem:'Harem','High Stakes Game':'Juego de Alto Riesgo',
    Historical:'Histórico','Idols (Female)':'Idols Femeninas','Idols (Male)':'Idols Masculinos',
    Isekai:'Isekai',Iyashikei:'Iyashikei','Love Polygon':'Polígono Amoroso',
    'Love Status Quo':'Sin Avance Romántico','Magical Sex Shift':'Cambio Mágico de Género',
    'Martial Arts':'Artes Marciales',Medical:'Médico',Mythology:'Mitología',
    'Organized Crime':'Crimen Organizado','Otaku Culture':'Cultura Otaku',Parody:'Parodia',
    'Performing Arts':'Artes Escénicas',Pets:'Mascotas',Racing:'Carreras',
    Reincarnation:'Reencarnación','Reverse Harem':'Reverse Harem','Romantic Subtext':'Subtexto Romántico',
    Samurai:'Samurái',School:'Escolar',Showbiz:'Showbiz',Space:'Espacial',
    'Strategy Game':'Juegos de Estrategia','Super Power':'Superpoderes',Survival:'Supervivencia',
    'Team Sports':'Deportes en Equipo','Time Travel':'Viajes en el Tiempo',Vampire:'Vampiros',
    'Video Game':'Videojuegos','Visual Arts':'Artes Visuales',Workplace:'Ambiente Laboral',
    'Urban Fantasy':'Fantasía Urbana',Villainess:'Villana',
    Josei:'Josei',Kids:'Infantil',Seinen:'Seinen',Shoujo:'Shoujo',Shounen:'Shounen',
  };
  return m[name]||name;
}

// Color de badge por tipo de relación
function colorRelacion(rel) {
  const c = {
    'Secuela':           '#3ea6ff',
    'Precuela':          '#a78bfa',
    'Historia Paralela': '#fb923c',
    'Spin-off':          '#f472b6',
    'Alternativa':       '#34d399',
    'Historia Principal':'#facc15',
    'Mismos Personajes': '#94a3b8',
    'Resumen':           '#94a3b8',
    'Relacionado':       '#94a3b8',
    'Compilación':       '#94a3b8',
  };
  return c[rel] || '#94a3b8';
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function dedup(lista) {
  const seen=new Set();
  return lista.filter(a=>{if(seen.has(a.id))return false;seen.add(a.id);return true;});
}
function randomPage(){return Math.floor(Math.random()*12)+1;}
function getGeneros(api){
  if(api==='jikan') return jikan.JIKAN_GENRES.map(g=>g.name).sort((a,b)=>trad(a).localeCompare(trad(b),'es'));
  return anilist.ANILIST_GENRES.slice().sort((a,b)=>trad(a).localeCompare(trad(b),'es'));
}

// ─────────────────────────────────────────────────────────────────────────────
// GÉNERO DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
const GeneroDropdown = ({ valor, setValor, api }) => {
  const [open,setOpen]=useState(false);
  const [busq,setBusq]=useState('');
  const [pos,setPos]=useState({top:0,left:0,width:0});
  const btnRef=useRef(null); const listRef=useRef(null); const inputRef=useRef(null);
  const generos=getGeneros(api);
  const label=valor?trad(valor):'Cualquier';
  const filtrados=generos.filter(g=>trad(g).toLowerCase().includes(busq.toLowerCase())||g.toLowerCase().includes(busq.toLowerCase()));
  useEffect(()=>{if(valor&&!generos.includes(valor))setValor('');},[api]);
  const abrir=()=>{if(btnRef.current){const r=btnRef.current.getBoundingClientRect();setPos({top:r.bottom+window.scrollY+6,left:r.left+window.scrollX,width:Math.max(r.width,220)});}setOpen(true);};
  useEffect(()=>{if(!open)return;const fn=e=>{if(btnRef.current&&!btnRef.current.contains(e.target)&&listRef.current&&!listRef.current.contains(e.target)){setOpen(false);setBusq('');}};document.addEventListener('mousedown',fn);return()=>document.removeEventListener('mousedown',fn);},[open]);
  useEffect(()=>{if(open&&inputRef.current)setTimeout(()=>inputRef.current?.focus(),30);},[open]);
  const cerrar=(v)=>{setValor(v);setOpen(false);setBusq('');};
  return(
    <>
      <button ref={btnRef} type="button" onClick={open?()=>{setOpen(false);setBusq('');}:abrir}
        style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:'8px',color:valor?'var(--accent-color)':'var(--text-muted)',fontSize:'0.9rem',cursor:'pointer',gap:'8px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
        <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{label}</span>
        <ChevronDown size={16} style={{flexShrink:0,transform:open?'rotate(180deg)':'none',transition:'transform .2s',color:'var(--text-muted)'}}/>
      </button>
      {open&&createPortal(
        <div ref={listRef} className="genre-dropdown-portal"
          style={{position:'absolute',top:pos.top,left:pos.left,width:pos.width,maxWidth:300,zIndex:99999,borderRadius:'10px',boxShadow:'0 12px 40px rgba(0,0,0,.65)',overflow:'hidden'}}>
          <div style={{padding:'10px',borderBottom:'1px solid var(--border-color)'}}>
            <div style={{position:'relative'}}>
              <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}/>
              <input ref={inputRef} type="text" placeholder="Buscar género..." value={busq} onChange={e=>setBusq(e.target.value)}
                style={{width:'100%',padding:'7px 10px 7px 30px',background:'var(--bg-input)',border:'1px solid var(--border-color)',borderRadius:'6px',color:'var(--text-main)',fontSize:'0.85rem',outline:'none',boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{maxHeight:260,overflowY:'auto'}}>
            <div onClick={()=>cerrar('')}
              style={{padding:'9px 14px',cursor:'pointer',fontSize:'0.88rem',fontWeight:!valor?700:400,color:!valor?'var(--accent-color)':'var(--text-muted)',borderBottom:'1px solid var(--border-color)',background:'transparent'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--hover-bg,rgba(128,128,128,.08))'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>Cualquier género</div>
            {filtrados.length===0&&<div style={{padding:'12px 14px',color:'var(--text-muted)',fontSize:'0.85rem'}}>Sin resultados</div>}
            {filtrados.map(g=>(
              <div key={g} onClick={()=>cerrar(g)}
                style={{padding:'8px 14px',cursor:'pointer',fontSize:'0.88rem',fontWeight:valor===g?700:400,color:valor===g?'var(--accent-color)':'var(--text-main)',background:'transparent',transition:'background .1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--hover-bg,rgba(128,128,128,.08))'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{trad(g)}</div>
            ))}
          </div>
        </div>,document.body
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DROPEAR
// ─────────────────────────────────────────────────────────────────────────────
const ModalDropear = ({ anime, onConfirm, onCancel }) => {
  const [comentario,setComentario]=useState('');
  const [cap,setCap]=useState('');
  const max=anime?.episodios||null;
  const handleCap=e=>{const v=e.target.value;if(v===''){setCap('');return;}const n=parseInt(v);if(isNaN(n)||n<0)return;setCap(max&&n>max?String(max):String(n));};
  return(
    <div style={{position:'fixed',inset:0,zIndex:10002,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onCancel}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:14,padding:28,maxWidth:400,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,.6)'}}>
        <h3 style={{margin:'0 0 8px',color:'var(--text-main)',fontSize:'1.1rem',display:'flex',alignItems:'center',gap:8}}><Skull size={18}/> ¿Por qué lo dropeaste?</h3>
        <p style={{margin:'0 0 18px',color:'var(--text-muted)',fontSize:'.9rem'}}><strong style={{color:'var(--text-main)'}}>{anime?.titulo}</strong> — nota opcional</p>
        <div style={{marginBottom:14}}>
          <label style={{display:'block',color:'var(--text-muted)',fontSize:'.82rem',marginBottom:6,fontWeight:600}}>¿En qué capítulo lo dejaste? {max&&<span style={{color:'var(--border-color)'}}>(máx. {max})</span>}</label>
          <input type="number" min="0" max={max||undefined} placeholder={max?`0 – ${max}`:'Ej: 5'} value={cap} onChange={handleCap}
            style={{width:'100%',background:'var(--bg-input)',border:'1px solid var(--border-color)',borderRadius:8,color:'var(--text-main)',fontSize:'.9rem',padding:'10px 12px',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
        </div>
        <textarea placeholder="Ej: muy lento, protagonista molesto…" value={comentario} onChange={e=>setComentario(e.target.value)} rows={4}
          style={{width:'100%',background:'var(--bg-input)',border:'1px solid var(--border-color)',borderRadius:8,color:'var(--text-main)',fontSize:'.9rem',padding:12,resize:'vertical',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
        <div style={{display:'flex',gap:12,marginTop:18}}>
          <button onClick={onCancel} style={{flex:1,padding:11,background:'transparent',border:'1px solid var(--border-color)',borderRadius:8,color:'var(--text-muted)',cursor:'pointer',fontSize:'.9rem'}}>Cancelar</button>
          <button onClick={()=>onConfirm({comentario,capDropeo:cap!==''?parseInt(cap):0})}
            style={{flex:2,padding:11,background:'#EF4444',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:'.9rem',fontWeight:'bold'}}>Dropear anime</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN RELACIONADOS — se muestra dentro del modal-info
// ─────────────────────────────────────────────────────────────────────────────
const SeccionRelaciones = ({ anime, onNavegar }) => {
  const [relaciones, setRelaciones] = useState(null); // null = cargando

  useEffect(() => {
    let cancelled = false;
    setRelaciones(null);

    // Usar la misma API de la que vino el anime, para coherencia y consistencia
    const promesa = anime.source === 'jikan'
      ? jikan.buscarRelaciones(anime.mal_id)
      : anilist.buscarRelaciones(anime.anilist_id, anime.mal_id);

    promesa
      .then(data => { if (!cancelled) setRelaciones(data); })
      .catch(() => { if (!cancelled) setRelaciones([]); });

    return () => { cancelled = true; };
  }, [anime.id]);

  // Mientras carga
  if (relaciones === null) {
    return (
      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 18, paddingTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-muted)', fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
          <GitBranch size={15} /> Relacionados
          <Loader2 size={13} className="spin-anim" style={{ marginLeft: 2 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ width: 48, height: 68, flexShrink: 0, borderRadius: 6, background: 'var(--skeleton-from)', animation: 'skeleton-loading 1.5s infinite linear', backgroundSize: '200% 100%' }}/>
              <div style={{ flex:1, height: 14, borderRadius: 4, background: 'var(--skeleton-from)', animation: 'skeleton-loading 1.5s infinite linear', backgroundSize: '200% 100%' }}/>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sin relaciones → no mostrar la sección (anime independiente, único de su franquicia)
  if (relaciones.length === 0) return null;

  return (
    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 18, paddingTop: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-muted)', fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
        <GitBranch size={15} />
        Relacionados
        <span style={{ color: 'var(--border-color)', fontWeight: 400, textTransform:'none', letterSpacing:0 }}>({relaciones.length})</span>
      </div>

      {/* Lista vertical — filas con poster pequeño + info, mucho más legible */}
      <div className="relaciones-lista" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
        {relaciones.map(rel => (
          <div
            key={rel.id}
            onClick={() => onNavegar(rel)}
            className="relacion-row"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px', borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              transition: 'border-color .2s, background .2s, transform .15s',
            }}
          >
            {/* Mini poster */}
            <div style={{ width: 48, height: 68, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
              {rel.imagen
                ? <img src={rel.imagen} alt={rel.titulo} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' }}/>
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'.5rem' }}>—</div>
              }
            </div>

            {/* Info central */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: '.86rem', fontWeight: 700, color: 'var(--text-main)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{rel.titulo}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {rel.año && <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{rel.año}</span>}
                {rel.tipo && (
                  <>
                    <span style={{ color: 'var(--border-color)', fontSize: '.65rem' }}>•</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{rel.tipo}</span>
                  </>
                )}
                {rel.score && (
                  <>
                    <span style={{ color: 'var(--border-color)', fontSize: '.65rem' }}>•</span>
                    <span style={{ display:'flex', alignItems:'center', gap:3, fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Star size={10} fill="#EAB308" color="#EAB308"/>{rel.score}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Badge de tipo de relación + flecha */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <span style={{
                background: colorRelacion(rel.relacion),
                color: '#000', borderRadius: 20, padding: '4px 10px',
                fontSize: '.66rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '.3px', whiteSpace: 'nowrap',
              }}>
                {rel.relacion}
              </span>
              <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink:0 }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE DETALLE (con navegación y relaciones)
// ─────────────────────────────────────────────────────────────────────────────
const ModalDetalle = ({ animeInicial, onClose, onGuardar, onDropear }) => {
  // Pila de navegación: permite volver al anime anterior
  const [stack, setStack]             = useState([animeInicial]);
  const [sinopsis, setSinopsis]       = useState('');
  const [traduciendo, setTraduciendo] = useState(false);
  const [cargandoDet, setCargandoDet] = useState(false);
  const [estadoGuardar, setEstadoGuardar] = useState('pendiente');

  const anime = stack[stack.length - 1];

  // Cargar/traducir sinopsis cuando cambia el anime
  useEffect(() => {
    setSinopsis('');
    setEstadoGuardar('pendiente');
    if (!anime.sinopsis) { setSinopsis('Sinopsis no disponible.'); return; }
    setTraduciendo(true);
    fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(anime.sinopsis)}`)
      .then(r => r.json())
      .then(d => setSinopsis(d[0].map(i=>i[0]).join('')))
      .catch(() => setSinopsis(anime.sinopsis))
      .finally(() => setTraduciendo(false));
  }, [anime.id]);

  // Navegar a un relacionado: carga su detalle completo primero
  const navegarA = async (rel) => {
    setCargandoDet(true);
    try {
      let detalle;
      if (rel.source === 'jikan' || (!rel.anilist_id && rel.mal_id)) {
        detalle = await jikan.buscarDetalleById(rel.mal_id);
      } else if (rel.anilist_id) {
        detalle = await anilist.buscarDetalleById(rel.anilist_id);
      } else {
        throw new Error('Sin ID válido');
      }
      // Si el detalle no trae sinopsis, usar la que haya
      if (!detalle.sinopsis && rel.sinopsis) detalle.sinopsis = rel.sinopsis;
      setStack(prev => [...prev, detalle]);
    } catch {
      // Si falla la carga del detalle, navegar igual con los datos básicos
      // que ya teníamos de la relación (título, imagen, score, etc.)
      setStack(prev => [...prev, {
        ...rel,
        generos:  rel.generos  || [],
        sinopsis: rel.sinopsis || '',
        source:   rel.source || (rel.anilist_id ? 'anilist' : 'jikan'),
      }]);
    } finally {
      setCargandoDet(false);
    }
  };

  const volver = () => setStack(prev => prev.slice(0, -1));

  const handleGuardar = () => {
    if (estadoGuardar === 'dropeado') onDropear(anime);
    else onGuardar(anime, estadoGuardar);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e=>e.stopPropagation()} style={{ maxHeight:'92vh' }}>

        {/* Botón cerrar */}
        <button className="modal-close" onClick={onClose} style={{ zIndex:20 }}><X size={20}/></button>

        {/* Imagen */}
        <img
          src={anime.imagen}
          alt={anime.titulo}
          className="modal-image"
          style={{ objectFit:'contain', backgroundColor:'rgba(0,0,0,.3)', borderRadius:12 }}
        />

        {/* Info panel con scroll */}
        <div className="modal-info" style={{ overflowY:'auto', maxHeight:'92vh' }}>

          {/* Botón volver (si hay historial) */}
          {stack.length > 1 && (
            <button
              onClick={volver}
              style={{
                display:'flex', alignItems:'center', gap:6, marginBottom:14,
                marginRight:44, maxWidth:'calc(100% - 44px)',
                background:'var(--bg-input)', border:'1px solid var(--border-color)',
                borderRadius:8, padding:'7px 12px', cursor:'pointer',
                color:'var(--text-muted)', fontSize:'.8rem', fontWeight:600,
                overflow:'hidden', whiteSpace:'nowrap',
              }}
            >
              <ArrowLeft size={14} style={{ flexShrink:0 }}/>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>
                Volver a {stack[stack.length-2]?.titulo?.split(':')[0] || 'anterior'}
              </span>
            </button>
          )}

          {/* Overlay de carga al navegar */}
          {cargandoDet && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, color:'var(--accent-color)', fontSize:'.85rem' }}>
              <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> Cargando detalle…
            </div>
          )}

          {/* Título */}
          <h2 style={{ paddingRight:45, lineHeight:1.3, marginBottom:12, color:'var(--text-heading)' }}>
            {anime.titulo}
          </h2>

          {/* Estado + temporada/año */}
          <div style={{ display:'flex', gap:10, marginBottom:12, fontWeight:'bold', fontSize:'.9rem', flexWrap:'wrap' }}>
            <span style={{ color:colorEstado(anime.estado) }}>{traducirEstado(anime.estado)}</span>
            <span style={{ color:'var(--border-color)' }}>|</span>
            <span style={{ color:'var(--text-muted)' }}>
              {anime.temporada?`${traducirTemporada(anime.temporada)} `:''}{anime.año||'P.A.'}
            </span>
            {anime.tipo && <><span style={{ color:'var(--border-color)' }}>|</span><span style={{ color:'var(--text-muted)' }}>{anime.tipo}</span></>}
          </div>

          {/* Score + episodios + géneros */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', marginBottom:16, fontSize:'.9rem' }}>
            <span style={{ display:'flex', alignItems:'center', color:'#EAB308', fontWeight:'bold' }}>
              <Star size={16} fill="#EAB308" color="#EAB308" style={{ marginRight:4 }}/>{anime.score||'N/A'}
            </span>
            <span style={{ color:'var(--border-color)', fontWeight:'bold' }}>•</span>
            <span style={{ display:'flex', alignItems:'center', color:'var(--text-main)' }}>
              <Layers size={14} color="var(--accent-color)" style={{ marginRight:4 }}/>
              {anime.episodios?`${anime.episodios} eps`:'En emisión'}
            </span>
            {(anime.generos||[]).map((g,i)=>(
              <React.Fragment key={g.name||i}>
                <span style={{ color:'var(--border-color)', fontWeight:'bold' }}>•</span>
                <span style={{ color:'var(--text-muted)', fontSize:'.85rem' }}>{trad(g.name)}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Sinopsis */}
          <div className="modal-synopsis">
            {traduciendo
              ? <p style={{ color:'var(--accent-color)', fontStyle:'italic' }}>Traduciendo sinopsis…</p>
              : <p>{sinopsis}</p>
            }
          </div>

          {/* ── RELACIONES ─────────────────────────────────────────────── */}
          <SeccionRelaciones anime={anime} onNavegar={navegarA} />

          {/* ── ACCIONES ──────────────────────────────────────────────── */}
          <div style={{ marginTop:16, paddingTop:16, display:'flex', gap:12, alignItems:'stretch', borderTop:'1px solid var(--border-color)' }}>
            <select
              value={estadoGuardar}
              onChange={e=>setEstadoGuardar(e.target.value)}
              style={{ flex:1, backgroundColor:'var(--bg-card)', color:'var(--text-main)', border:'1px solid var(--border-color)', borderRadius:8, padding:'0 12px', fontSize:'.9rem', outline:'none', cursor:'pointer', height:44 }}
            >
              <option value="pendiente">Pendiente</option>
              <option value="viendo">Viendo</option>
              <option value="completado">Completado</option>
              <option value="pausado">Pausado</option>
              <option value="atrasado">Atrasado</option>
              <option value="dropeado">Dropeado</option>
            </select>
            <button
              className="btn-add"
              onClick={handleGuardar}
              style={{ flex:2, margin:0, height:44, borderRadius:8, fontWeight:'bold', display:'flex', justifyContent:'center', alignItems:'center', background:estadoGuardar==='dropeado'?'#EF4444':undefined }}
            >
              {estadoGuardar==='dropeado'
                ? <><Skull size={13} style={{ marginRight:6 }}/>Dropear anime</>
                : 'Guardar en mi lista'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const Explorar = () => {
  const [query,      setQuery]      = useState('');
  const [apiBusq,    setApiBusq]    = useState(()=>localStorage.getItem('api-busqueda')||'anilist');
  const [apiFiltros, setApiFiltros] = useState(()=>localStorage.getItem('api-filtros')||'anilist');
  const [animes,     setAnimes]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingMore,setLoadingMore]= useState(false);
  const [error,      setError]      = useState('');
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [animeDropear,  setAnimeDropear]  = useState(null);
  const [filtroGenero,   setFiltroGenero]   = useState('');
  const [filtroAno,      setFiltroAno]      = useState('');
  const [filtroEstacion, setFiltroEstacion] = useState('');
  const [filtroFormato,  setFiltroFormato]  = useState('');
  const [filtroEstado,   setFiltroEstado]   = useState('');
  const [ordenarPor,     setOrdenarPor]     = useState('random');

  const seedRef      = useRef(randomPage());
  const requestIdRef = useRef(0);
  const filtersRef   = useRef({});
  filtersRef.current = { query, filtroGenero, filtroEstado, filtroFormato, filtroAno, filtroEstacion, ordenarPor, apiBusq, apiFiltros };

  useEffect(()=>localStorage.setItem('api-busqueda',apiBusq),[apiBusq]);
  useEffect(()=>localStorage.setItem('api-filtros',apiFiltros),[apiFiltros]);

  const fetchAnimes = useCallback(async(pg)=>{
    const { query:q, filtroGenero, filtroEstado, filtroFormato, filtroAno, filtroEstacion, ordenarPor, apiBusq, apiFiltros } = filtersRef.current;
    const myId=++requestIdRef.current;
    pg===1?setLoading(true):setLoadingMore(true);
    setError('');
    try{
      const hayFiltros=!!(filtroGenero||filtroEstado||filtroFormato||filtroAno||filtroEstacion);
      const rndPage=ordenarPor==='random'?seedRef.current:null;
      let result;
      if(q&&!hayFiltros){
        result=apiBusq==='jikan'?await jikan.buscarPorNombre(q,pg):await anilist.buscarPorNombre(q,pg);
      } else if(!q&&!hayFiltros){
        result=apiFiltros==='jikan'?await jikan.buscarTop(pg,ordenarPor,rndPage):await anilist.buscarTop(pg,ordenarPor,rndPage);
      } else {
        const params={query:q||undefined,genre:filtroGenero||undefined,season:filtroEstacion||undefined,year:filtroAno||undefined,format:filtroFormato||undefined,status:filtroEstado||undefined,sort:ordenarPor,page:pg,randomPage:rndPage};
        result=apiFiltros==='jikan'?await jikan.buscarConFiltros(params):await anilist.buscarConFiltros(params);
      }
      if(requestIdRef.current!==myId)return;
      setHasMore(result.hasNextPage);
      setAnimes(prev=>pg===1?dedup(result.data):dedup([...prev,...result.data]));
    } catch(err){
      if(requestIdRef.current!==myId)return;
      console.error('[Explorar]',err);
      setError('Error al obtener datos. Intenta de nuevo.');
    } finally{
      if(requestIdRef.current===myId){setLoading(false);setLoadingMore(false);}
    }
  },[]);

  useEffect(()=>{
    if(ordenarPor==='random')seedRef.current=randomPage();
    setAnimes([]);setHasMore(true);setError('');setPage(1);
    const t=setTimeout(()=>fetchAnimes(1),500);
    return()=>clearTimeout(t);
  },[query,filtroGenero,filtroEstado,filtroFormato,filtroAno,filtroEstacion,ordenarPor,apiBusq,apiFiltros,fetchAnimes]);

  useEffect(()=>{if(page>1)fetchAnimes(page);},[page,fetchAnimes]);

  const abrirPanel = anime => {
    setSelectedAnime(anime);
    document.body.style.overflow='hidden';
  };
  const cerrarPanel = () => {
    setSelectedAnime(null);
    document.body.style.overflow='unset';
  };

  const guardar = async (anime, estado, dropData={}) => {
    const malId=anime.mal_id??(anime.anilist_id?-anime.anilist_id:null);
    try{
      const{data:existe,error:e1}=await supabase.from('anime_list').select('id,estado').eq('mal_id',malId).single();
      if(e1&&e1.code!=='PGRST116')throw e1;
      if(existe){Swal.fire({title:'¡Ya lo tienes!',text:`Ya está en "${existe.estado}".`,icon:'warning',background:'var(--bg-card-solid)',color:'var(--text-main)',confirmButtonColor:'#3ea6ff'});return;}
      const payload={mal_id:malId,titulo:anime.titulo,imagen:anime.imagen,estado,episodio_actual:estado==='completado'?(anime.episodios||0):estado==='dropeado'?(dropData.capDropeo||0):0,episodios_totales:anime.episodios||0};
      if(estado==='dropeado'&&dropData.comentario)payload.comentario_dropeo=dropData.comentario;
      const{error:e2}=await supabase.from('anime_list').insert([payload]);
      if(e2)throw e2;
      Swal.fire({title:estado==='dropeado'?'Dropeado':'¡Añadido!',text:`"${anime.titulo}" guardado en ${estado}`,icon:'success',background:'var(--bg-card-solid)',color:'var(--text-main)',confirmButtonColor:'#3ea6ff',timer:2000,showConfirmButton:false});
      cerrarPanel();
    } catch(err){
      console.error(err);
      Swal.fire({title:'Error',text:'Hubo un problema al guardar.',icon:'error',background:'var(--bg-card-solid)',color:'var(--text-main)',confirmButtonColor:'#3ea6ff'});
    }
  };

  const listaAnos=Array.from({length:35},(_,i)=>new Date().getFullYear()-i);
  const pills=[
    {id:'random',    label:'Aleatorio',         icon:<Shuffle size={14}/>,    cls:'pill-random'},
    {id:'popularity',label:'Popularidad',        icon:<TrendingUp size={14}/>, cls:'pill-popularity'},
    {id:'score',     label:'Mejor calificación', icon:<Trophy size={14}/>,     cls:'pill-score'},
  ];

  return(
    <div>
      <style>{`
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        .spin-anim{animation:spin 1s linear infinite}
        .pill{display:flex;align-items:center;gap:6px;padding:7px 15px;border-radius:20px;border:1.5px solid var(--border-color);background:transparent;color:var(--text-muted);font-size:.83rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;user-select:none}
        .pill:hover{border-color:var(--text-muted);color:var(--text-main)}
        .pill-random.active    {border-color:#a78bfa;color:#a78bfa;background:rgba(167,139,250,.12);box-shadow:0 0 10px rgba(167,139,250,.2)}
        .pill-popularity.active{border-color:#fb923c;color:#fb923c;background:rgba(251,146,60,.12);box-shadow:0 0 10px rgba(251,146,60,.2)}
        .pill-score.active     {border-color:#facc15;color:#facc15;background:rgba(250,204,21,.12);box-shadow:0 0 10px rgba(250,204,21,.2)}
        .btn-mas{display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 34px;background-color:var(--accent-color);color:#000;border:none;border-radius:30px;cursor:pointer;font-weight:800;font-size:.9rem;text-transform:uppercase;letter-spacing:1.5px;transition:all .3s}
        .btn-mas:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1)}
        .btn-mas:disabled{background:transparent;border:2px solid var(--border-color);color:var(--text-muted);cursor:not-allowed}
        .api-row{display:flex;align-items:center;gap:10px}
        .api-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-muted);white-space:nowrap}
        .api-toggles-box{display:flex;flex-direction:column;gap:8px;align-items:flex-end;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:10px 14px}
        /* Scrollbar de modal-info y lista de relaciones */
        .modal-info::-webkit-scrollbar{width:5px}
        .modal-info::-webkit-scrollbar-track{background:transparent}
        .modal-info::-webkit-scrollbar-thumb{background:var(--border-color);border-radius:10px}
        .relaciones-lista::-webkit-scrollbar{width:5px}
        .relaciones-lista::-webkit-scrollbar-track{background:transparent}
        .relaciones-lista::-webkit-scrollbar-thumb{background:var(--border-color);border-radius:10px}
        /* Fila de relación: hover sutil */
        .relacion-row:hover{border-color:var(--accent-color);background:var(--bg-nav-hover,rgba(128,128,128,.06));transform:translateX(2px)}
      `}</style>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <h2 className="title" style={{color:'var(--accent-color)',margin:0,fontWeight:800}}>Explorador Animes</h2>
        <div className="api-toggles-box">
          <div className="api-row"><span className="api-label">Búsqueda por nombre</span><ApiToggle value={apiBusq} onChange={setApiBusq}/></div>
          <div style={{height:1,background:'var(--border-color)',margin:'2px 0'}}/>
          <div className="api-row"><span className="api-label">Ordenar y filtros</span><ApiToggle value={apiFiltros} onChange={setApiFiltros}/></div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="search-container">
        <Search className="search-icon" size={22}/>
        <input type="text" className="search-input" placeholder={`Buscar anime vía ${apiBusq==='jikan'?'MAL':'AniList'}…`} value={query} onChange={e=>setQuery(e.target.value)}/>
      </div>

      {/* PILLS */}
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'1.2px',color:'var(--text-muted)',marginRight:2}}>Ordenar</span>
        {pills.map(p=>(
          <button key={p.id} className={`pill ${p.cls}${ordenarPor===p.id?' active':''}`} onClick={()=>setOrdenarPor(p.id)}>{p.icon}{p.label}</button>
        ))}
      </div>

      {/* FILTROS */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Géneros <span style={{fontSize:'.68rem',color:'var(--text-muted)',fontWeight:600}}>({apiFiltros==='jikan'?'MAL':'AniList'})</span></label>
          <GeneroDropdown valor={filtroGenero} setValor={setFiltroGenero} api={apiFiltros}/>
        </div>
        <div className="filter-group">
          <label>Año</label>
          <div className="select-wrapper">
            <select value={filtroAno} onChange={e=>setFiltroAno(e.target.value)}>
              <option value="">Cualquier</option>
              {listaAnos.map(a=><option key={a} value={a}>{a}</option>)}
            </select><ChevronDown className="select-icon" size={16}/>
          </div>
        </div>
        <div className="filter-group">
          <label>Estación</label>
          <div className="select-wrapper">
            <select value={filtroEstacion} onChange={e=>setFiltroEstacion(e.target.value)}>
              <option value="">Cualquier</option><option value="winter">Invierno</option>
              <option value="spring">Primavera</option><option value="summer">Verano</option>
              <option value="fall">Otoño</option>
            </select><ChevronDown className="select-icon" size={16}/>
          </div>
        </div>
        <div className="filter-group">
          <label>Formato</label>
          <div className="select-wrapper">
            <select value={filtroFormato} onChange={e=>setFiltroFormato(e.target.value)}>
              <option value="">Cualquier</option><option value="tv">TV</option>
              <option value="movie">Película</option><option value="ova">OVA</option>
              <option value="special">Especial</option>
              {apiFiltros==='jikan'&&<option value="ona">ONA</option>}
            </select><ChevronDown className="select-icon" size={16}/>
          </div>
        </div>
        <div className="filter-group">
          <label>Estado de Emisión</label>
          <div className="select-wrapper">
            <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
              <option value="">Cualquier</option><option value="airing">En emisión</option>
              <option value="complete">Finalizado</option><option value="upcoming">No emitido</option>
            </select><ChevronDown className="select-icon" size={16}/>
          </div>
        </div>
      </div>

      {/* Indicador API */}
      <div style={{marginBottom:10,fontSize:'.76rem',color:'var(--text-muted)',minHeight:18}}>
        Filtros: <strong style={{color:apiFiltros==='jikan'?'#f87171':'#3ea6ff'}}>{apiFiltros==='jikan'?'MAL':'AniList'}</strong>
        {'  ·  '}Búsqueda: <strong style={{color:apiBusq==='jikan'?'#f87171':'#3ea6ff'}}>{apiBusq==='jikan'?'MAL':'AniList'}</strong>
      </div>

      {error&&<div className="error-message" style={{display:'flex',alignItems:'center',gap:8}}><AlertTriangle size={16}/> {error}</div>}

      {/* GRID */}
      <div className="anime-grid">
        {loading&&page===1
          ?[...Array(12)].map((_,i)=><div key={i} className="skeleton"/>)
          :animes.length===0&&!loading
            ?<div style={{gridColumn:'1/-1',textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>
              <p style={{fontSize:'1.1rem'}}>No se encontraron animes con esos filtros.</p>
              <p style={{fontSize:'.9rem',marginTop:8}}>Intenta cambiar los filtros o el orden.</p>
            </div>
            :animes.map(anime=>(
              <div key={anime.id} className="anime-card" onClick={()=>abrirPanel(anime)}>
                <img src={anime.imagen} alt={anime.titulo} style={{width:'100%',aspectRatio:'2/3',objectFit:'cover',objectPosition:'center'}}/>
                <div className="anime-info">
                  <div style={{display:'flex',gap:8,fontSize:'.8rem',marginBottom:6,fontWeight:'bold'}}>
                    <span style={{color:colorEstado(anime.estado)}}>{traducirEstado(anime.estado)}</span>
                    <span style={{color:'var(--border-color)'}}>|</span>
                    <span style={{color:'var(--text-muted)',textTransform:'uppercase'}}>
                      {anime.temporada?`${traducirTemporada(anime.temporada)} `:''}{anime.año||'P.A.'}
                    </span>
                  </div>
                  <h3 className="anime-title">{anime.titulo}</h3>
                  <div className="anime-meta">
                    <span><Star size={15} fill="#EAB308" color="#EAB308"/> {anime.score||'N/A'}</span>
                    <span style={{display:'flex',alignItems:'center',gap:4,color:'var(--text-muted)'}}>
                      <Layers size={15} color="var(--accent-color)"/> {anime.episodios||'?'}
                    </span>
                  </div>
                </div>
              </div>
            ))
        }
      </div>

      {/* CARGAR MÁS */}
      {!loading&&hasMore&&animes.length>0&&(
        <div style={{display:'flex',justifyContent:'center',marginTop:30,paddingBottom:60}}>
          <button className="btn-mas" disabled={loadingMore} onClick={()=>{setLoadingMore(true);setPage(p=>p+1);}}>
            {loadingMore?<><Loader2 size={18} className="spin-anim"/>Cargando…</>:'Cargar más resultados'}
          </button>
        </div>
      )}

      {/* MODAL DETALLE CON RELACIONES */}
      {selectedAnime && (
        <ModalDetalle
          animeInicial={selectedAnime}
          onClose={cerrarPanel}
          onGuardar={(anime, estado) => guardar(anime, estado)}
          onDropear={(anime) => setAnimeDropear(anime)}
        />
      )}

      {/* MODAL DROPEAR */}
      {animeDropear&&(
        <ModalDropear
          anime={animeDropear}
          onConfirm={d=>{setAnimeDropear(null);guardar(animeDropear,'dropeado',d);}}
          onCancel={()=>setAnimeDropear(null)}
        />
      )}
    </div>
  );
};

export default Explorar;