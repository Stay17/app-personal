import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  Loader2, TrendingUp, Layers, Star, CheckCircle2, PlayCircle,
  Clock, PauseCircle, History, Skull, BarChart3, Clock4, Trophy,
  Flame, Target, BookOpen, Film, Eye, Sparkles, BarChart2,
  Zap, AlertCircle, TrendingDown, ListChecks, Flag, Tv, Folder, Award
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   SUBCOMPONENTES
══════════════════════════════════════════════════════ */

// Count-up animado
const CountUp = ({ target, duration = 1200 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target || isNaN(Number(target))) return;
    let start = null;
    const num = parseFloat(target);
    const isFloat = String(target).includes('.');
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(isFloat ? (num * ease).toFixed(1) : Math.round(num * ease));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{val}</>;
};

// Barra horizontal animada
const HBar = ({ label, count, max, color, icon, delay = 0, total = 0 }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(max > 0 ? (count / max) * 100 : 0), 180 + delay);
    return () => clearTimeout(t);
  }, [count, max, delay]);
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color, fontSize: '0.82rem', fontWeight: 700 }}>
          {icon} {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: '#3a3a3a' }}>
            {total > 0 ? `${((count / total) * 100).toFixed(0)}%` : '0%'}
          </span>
          <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 900, minWidth: '20px', textAlign: 'right' }}>{count}</span>
        </div>
      </div>
      <div style={{ height: '7px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${w}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: '20px',
          transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color}44`,
        }} />
      </div>
    </div>
  );
};

// Donut SVG animado
const DonutChart = ({ segments, size = 136, thickness = 22 }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const totalVal = segments.reduce((a, b) => a + b.value, 0);
  let offset = 0;
  const segs = segments.filter(s => s.value > 0).map(s => {
    const dash = mounted ? (s.value / totalVal) * circ : 0;
    const gap = circ - dash;
    const o = offset;
    offset += dash;
    return { ...s, dash, gap, offset: o };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={thickness} />
      {segs.map((s, i) => (
        <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
          stroke={s.color} strokeWidth={thickness}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          style={{ transition: `stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms`, filter: `drop-shadow(0 0 3px ${s.color}70)` }}
        />
      ))}
    </svg>
  );
};

// Segmento de barra compuesta (necesita ser componente para usar hooks)
const CompoundSeg = ({ count, total, color, delay = 0 }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(total > 0 ? (count / total) * 100 : 0), 200 + delay);
    return () => clearTimeout(t);
  }, [count, total, delay]);
  return <div style={{ height: '100%', width: `${w}%`, background: color, transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)' }} />;
};

// Barra vertical (distribución de notas)
const VBar = ({ label, count, max, color, delay = 0 }) => {
  const [h, setH] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setH(max > 0 ? (count / max) * 100 : 0), 200 + delay);
    return () => clearTimeout(t);
  }, [count, max, delay]);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: count > 0 ? '#fff' : '#2a2a2a' }}>{count}</span>
      <div style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.04)', borderRadius: '7px 7px 3px 3px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
        <div style={{
          width: '100%', height: `${h}%`,
          background: `linear-gradient(180deg, ${color}, ${color}77)`,
          transition: `height 1.1s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          boxShadow: `0 0 12px ${color}55`,
        }} />
      </div>
      <span style={{ fontSize: '0.7rem', color: '#555', fontWeight: 700 }}>{label}</span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════ */
const Statistics = () => {
  const [animes, setAnimes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.from('anime_list').select('*');
        if (error) throw error;
        setAnimes(data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); setTimeout(() => setVisible(true), 60); }
    };
    load();
  }, []);

  /* ── Cálculos ── */
  const total       = animes.length;
  const completados = animes.filter(a => a.estado === 'completado').length;
  const viendo      = animes.filter(a => a.estado === 'viendo').length;
  const pendientes  = animes.filter(a => a.estado === 'pendiente').length;
  const pausados    = animes.filter(a => a.estado === 'pausado').length;
  const atrasados   = animes.filter(a => a.estado === 'atrasado').length;
  const dropeados   = animes.filter(a => a.estado === 'dropeado').length;

  // Episodios y tiempo
  const episodiosVistos = animes.reduce((acc, a) => {
    if (a.estado === 'completado') return acc + (Number(a.episodios_totales) || Number(a.episodio_actual) || 0);
    return acc + (Number(a.episodio_actual) || 0);
  }, 0);
  const minutos = episodiosVistos * 24;
  const horas   = Math.floor(minutos / 60);
  const dias    = (minutos / 60 / 24).toFixed(1);

  // Calificaciones
  const calificados = animes.filter(a => a.calificacion && Number(a.calificacion) > 0);
  const promedio    = calificados.length > 0
    ? (calificados.reduce((acc, a) => acc + Number(a.calificacion), 0) / calificados.length).toFixed(1)
    : '—';
  const notaMax = calificados.length > 0 ? calificados.reduce((a, b) => Number(a.calificacion) > Number(b.calificacion) ? a : b) : null;
  const notaMin = calificados.length > 0 ? calificados.reduce((a, b) => Number(a.calificacion) < Number(b.calificacion) ? a : b) : null;

  // Distribución de notas
  const rangos = [
    { label: '1–4',  min: 0, max: 4.9, color: '#EF4444' },
    { label: '5–6',  min: 5, max: 6.9, color: '#F97316' },
    { label: '7–8',  min: 7, max: 8.9, color: '#F59E0B' },
    { label: '9–10', min: 9, max: 10,  color: '#10B981' },
  ].map(r => ({ ...r, count: calificados.filter(a => Number(a.calificacion) >= r.min && Number(a.calificacion) <= r.max).length }));
  const maxRango = Math.max(...rangos.map(r => r.count), 1);

  // Top personal
  const topAnimes = [...animes].filter(a => a.ranking && a.ranking > 0).sort((a, b) => a.ranking - b.ranking);

  // Tasas
  const tasaCompleto = total > 0 ? ((completados / total) * 100).toFixed(1) : '0.0';
  const tasaDrop     = total > 0 ? ((dropeados   / total) * 100).toFixed(1) : '0.0';

  // Config estados
  const estadosConf = [
    { key:'completado', label:'Completados', count: completados, color:'#10B981', icon:<CheckCircle2 size={14}/> },
    { key:'viendo',     label:'Viendo',      count: viendo,      color:'#3ea6ff', icon:<PlayCircle   size={14}/> },
    { key:'pendiente',  label:'Pendientes',  count: pendientes,  color:'#F59E0B', icon:<Clock        size={14}/> },
    { key:'pausado',    label:'Pausados',    count: pausados,    color:'#F97316', icon:<PauseCircle  size={14}/> },
    { key:'atrasado',   label:'Atrasados',   count: atrasados,   color:'#A78BFA', icon:<History      size={14}/> },
    { key:'dropeado',   label:'Dropeados',   count: dropeados,   color:'#EF4444', icon:<Skull        size={14}/> },
  ];
  const maxEstado  = Math.max(...estadosConf.map(e => e.count), 1);
  const donutSegs  = estadosConf.filter(e => e.count > 0).map(e => ({ value: e.count, color: e.color }));

  // ── EN TU RADAR: recomendaciones inteligentes ──
  const animesViendo = animes.filter(a => a.estado === 'viendo');
  const animesPausados = animes.filter(a => a.estado === 'pausado');

  // Casi termina (episodios_totales > 0 y le quedan <= 3 caps)
  const casiTermina = [...animesViendo, ...animesPausados]
    .filter(a => a.episodios_totales > 0 && (a.episodios_totales - a.episodio_actual) <= 3 && (a.episodios_totales - a.episodio_actual) >= 1)
    .sort((a, b) => (a.episodios_totales - a.episodio_actual) - (b.episodios_totales - b.episodio_actual))
    .slice(0, 2);

  // Le falta más (más caps restantes entre los que está viendo)
  const leQuedaMas = animesViendo
    .filter(a => a.episodios_totales > 0 && (a.episodios_totales - a.episodio_actual) > 3)
    .sort((a, b) => (b.episodios_totales - b.episodio_actual) - (a.episodios_totales - a.episodio_actual))
    .slice(0, 2);

  // Pausados con progreso (para recordarle que los retome)
  const pausadosConProgreso = animesPausados
    .filter(a => a.episodio_actual > 0)
    .sort((a, b) => b.episodio_actual - a.episodio_actual)
    .slice(0, 2);

  // Pendientes más recientes (para empezar)
  const pendientesRecientes = animes
    .filter(a => a.estado === 'pendiente')
    .sort((a, b) => new Date(b.fecha_agregado) - new Date(a.fecha_agregado))
    .slice(0, 2);

  const radarItems = [
    ...casiTermina.map(a => ({
      anime: a,
      tag: <><Flag size={9} style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}/> Casi terminas</>,
      desc: `Te quedan solo ${a.episodios_totales - a.episodio_actual} cap${a.episodios_totales - a.episodio_actual !== 1 ? 's' : ''} — ¡termínalo!`,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.06)',
      border: 'rgba(16,185,129,0.2)',
      pct: a.episodios_totales > 0 ? (a.episodio_actual / a.episodios_totales) * 100 : 0,
    })),
    ...pausadosConProgreso.map(a => ({
      anime: a,
      tag: <><PauseCircle size={9} style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}/> Pausado con progreso</>,
      desc: `Llevas el cap ${a.episodio_actual}${a.episodios_totales > 0 ? ` de ${a.episodios_totales}` : ''} — ¿lo retomas?`,
      color: '#F97316',
      bg: 'rgba(249,115,22,0.06)',
      border: 'rgba(249,115,22,0.2)',
      pct: a.episodios_totales > 0 ? (a.episodio_actual / a.episodios_totales) * 100 : 0,
    })),
    ...leQuedaMas.map(a => ({
      anime: a,
      tag: <><Tv size={9} style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}/> Larga travesía</>,
      desc: `Te quedan ${a.episodios_totales - a.episodio_actual} caps — ¡sigue el ritmo!`,
      color: '#3ea6ff',
      bg: 'rgba(62,166,255,0.06)',
      border: 'rgba(62,166,255,0.2)',
      pct: a.episodios_totales > 0 ? (a.episodio_actual / a.episodios_totales) * 100 : 0,
    })),
    ...pendientesRecientes.map(a => ({
      anime: a,
      tag: <><Folder size={9} style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}/> Pendiente reciente</>,
      desc: `Lo agregaste recientemente — ¡empiézalo!`,
      color: '#A78BFA',
      bg: 'rgba(167,139,250,0.06)',
      border: 'rgba(167,139,250,0.2)',
      pct: 0,
    })),
  ].slice(0, 6); // máximo 6 items

  // Podio helper
  const podioMeta = (rank) => {
    if (rank === 1) return { badge: <Trophy size={13}/>, color: '#FBBF24', glow: 'rgba(251,191,36,0.18)', label: 'ORO' };
    if (rank === 2) return { badge: <Award size={13}/>, color: '#94A3B8', glow: 'rgba(148,163,184,0.14)', label: 'PLATA' };
    if (rank === 3) return { badge: <Award size={13}/>, color: '#CD7F32', glow: 'rgba(205,127,50,0.14)', label: 'BRONCE' };
    return { badge: `#${rank}`, color: '#555', glow: 'transparent', label: `#${rank}` };
  };

  /* ── LOADER ── */
  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh', gap:'14px' }}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg);}}`}</style>
      <Loader2 size={40} color="#F59E0B" style={{ animation:'spin 0.9s linear infinite' }}/>
      <p style={{ color:'#444', fontSize:'0.82rem', letterSpacing:'1.2px', textTransform:'uppercase' }}>Cargando estadísticas...</p>
    </div>
  );

  /* ── RENDER ── */
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s ease', paddingBottom: '60px' }}>
      <style>{`
        @keyframes spin { 100% { transform:rotate(360deg); } }

        /* ── Panel base ── */
        .sp {
          background: rgba(10,10,13,0.93);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 18px;
          padding: 24px 26px;
          box-shadow: 0 6px 28px rgba(0,0,0,0.45);
        }
        .sp-title {
          font-size: 1rem; font-weight: 800; color: #e4e4e7;
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 14px; margin-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,0.055);
        }
        .sp-title-end {
          margin-left: auto; font-size: 0.72rem; color: #3a3a3a; font-weight: 500;
        }

        /* ── KPI card ── */
        .kc {
          background: rgba(14,14,17,0.92);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
        }
        .kc:hover { transform: translateY(-3px); }
        .kc-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kc-val  { font-size: 2rem; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 4px; }
        .kc-lbl  { font-size: 0.67rem; color: #505050; text-transform: uppercase; letter-spacing: 1.4px; font-weight: 700; margin-bottom: 3px; }
        .kc-sub  { font-size: 0.73rem; color: #3a3a3a; }

        /* ── Compound bar ── */
        .cbar { width: 100%; height: 10px; border-radius: 20px; background: rgba(255,255,255,0.04); display: flex; overflow: hidden; margin: 16px 0; }

        /* ── Chip tasas ── */
        .chip {
          flex: 1; text-align: center; border-radius: 10px; padding: 13px 8px;
          border: 1px solid; transition: background 0.2s;
        }
        .chip-val { font-size: 1.5rem; font-weight: 900; line-height: 1; }
        .chip-lbl { font-size: 0.64rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-top: 4px; opacity: 0.6; }

        /* ── Record card ── */
        .rc {
          background: rgba(255,255,255,0.022);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 13px; padding: 18px 20px;
          display: flex; align-items: center; gap: 16px;
          transition: background 0.2s;
        }
        .rc:hover { background: rgba(255,255,255,0.04); }
        .rc-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rc-val  { font-size: 1.5rem; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 6px; }
        .rc-lbl  { font-size: 0.67rem; color: #4a4a4a; text-transform: uppercase; letter-spacing: 1.1px; font-weight: 700; margin-bottom: 4px; }
        .rc-desc { font-size: 0.76rem; color: #3d3d3d; }

        /* ── Radar card ── */
        .radar-card {
          border-radius: 14px; padding: 16px 18px;
          display: flex; align-items: center; gap: 14px;
          transition: transform 0.2s ease, filter 0.2s ease;
          position: relative; overflow: hidden;
        }
        .radar-card:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .radar-poster { width: 46px; height: 62px; object-fit: cover; border-radius: 8px; box-shadow: 0 3px 12px rgba(0,0,0,0.55); flex-shrink: 0; }
        .radar-pbar-track { height: 4px; background: rgba(255,255,255,0.07); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .radar-pbar-fill  { height: 100%; border-radius: 10px; transition: width 1s ease 0.3s; }

        /* ── Rank row ── */
        .rrow {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.045);
          background: rgba(255,255,255,0.018);
          transition: background 0.2s; margin-bottom: 7px;
        }
        .rrow:hover { background: rgba(255,255,255,0.045); }
        .rrow-img { width: 34px; height: 46px; object-fit: cover; border-radius: 5px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.5); }

        /* ── Scrollbar fine ── */
        .fscroll::-webkit-scrollbar { width: 3px; }
        .fscroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 10px; }
        .fscroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* ── TÍTULO ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'26px', flexWrap:'wrap' }}>
        <h2 style={{ fontSize:'1.75rem', fontWeight:900, color:'#F59E0B', textShadow:'0 0 28px rgba(245,158,11,0.25)', display:'flex', alignItems:'center', gap:'10px', margin:0 }}>
          <BarChart3 size={30}/> Dashboard Estadístico
        </h2>
        {total > 0 && <span style={{ fontSize:'0.85rem', color:'#3a3a3a', fontWeight:600 }}>· {total} animes</span>}
      </div>

      {/* ══════════════════════════
          FILA 1 — KPI CARDS
      ══════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'14px', marginBottom:'22px' }}>
        {[
          {
            icon:<Layers size={22}/>, bg:'rgba(245,158,11,0.1)', color:'#F59E0B',
            val: total, lbl:'Animes totales',
            sub: calificados.length > 0 ? `${calificados.length} calificados` : 'Sin calificaciones aún',
          },
          {
            icon:<TrendingUp size={22}/>, bg:'rgba(62,166,255,0.1)', color:'#3ea6ff',
            val: episodiosVistos, lbl:'Episodios vistos',
            sub: horas > 0 ? `${horas}h ${Math.round(minutos % 60)}min de contenido` : 'Empieza a ver animes',
          },
          {
            icon:<Clock4 size={22}/>, bg:'rgba(167,139,250,0.1)', color:'#A78BFA',
            val: Number(dias), lbl:'Días de anime',
            sub: horas > 0 ? `${horas} horas en total` : 'Equivale a horas seguidas',
            isFloat: true,
          },
          {
            icon:<Star size={22}/>, bg:'rgba(251,191,36,0.1)', color:'#FBBF24',
            val: calificados.length > 0 ? Number(promedio) : 0, lbl:'Nota promedio',
            sub: calificados.length > 0 ? `${calificados.length} animes calificados` : 'Califica en Top Personal',
            isFloat: calificados.length > 0,
          },
          {
            icon:<CheckCircle2 size={22}/>, bg:'rgba(16,185,129,0.1)', color:'#10B981',
            val: completados, lbl:'Completados',
            sub: `${tasaCompleto}% de tu biblioteca`,
          },
          {
            icon:<Skull size={22}/>, bg:'rgba(239,68,68,0.1)', color:'#EF4444',
            val: dropeados, lbl:'Dropeados',
            sub: `${tasaDrop}% de abandono`,
          },
        ].map((k, i) => (
          <div key={i} className="kc"
            onMouseEnter={e=>{e.currentTarget.style.borderColor=k.color+'44';e.currentTarget.style.boxShadow=`0 10px 28px ${k.color}14`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.boxShadow='none';}}
          >
            <div className="kc-icon" style={{ background:k.bg, color:k.color }}>{k.icon}</div>
            <div>
              <div className="kc-val">
                {k.isFloat
                  ? <><CountUp target={k.val} />{String(k.val).includes('.') ? '' : '.0'}</>
                  : <CountUp target={k.val} />
                }
              </div>
              <div className="kc-lbl">{k.lbl}</div>
              <div className="kc-sub">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════
          FILA 2 — DISTRIBUCIÓN + BARRAS
      ══════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>

        {/* Donut + leyenda */}
        <div className="sp">
          <div className="sp-title"><Film size={17} color="#3ea6ff"/> Distribución de biblioteca</div>
          {total === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'#2a2a2a', fontSize:'0.86rem' }}>Agrega animes para ver la distribución.</div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:'24px', marginBottom:'4px' }}>
                {/* Donut */}
                <div style={{ position:'relative', flexShrink:0 }}>
                  <DonutChart segments={donutSegs} size={136} thickness={22}/>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                    <span style={{ fontSize:'1.7rem', fontWeight:900, color:'#fff', lineHeight:1 }}>{total}</span>
                    <span style={{ fontSize:'0.6rem', color:'#404040', textTransform:'uppercase', letterSpacing:'1px', marginTop:'2px' }}>Total</span>
                  </div>
                </div>
                {/* Leyenda */}
                <div style={{ flex:1, minWidth:0 }}>
                  {estadosConf.map(e => (
                    <div key={e.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'7px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'7px', color:e.color, fontSize:'0.8rem', fontWeight:700, minWidth:0 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:e.color, flexShrink:0, display:'inline-block' }}/>
                        {e.icon} {e.label}
                      </div>
                      <div style={{ display:'flex', gap:'8px', alignItems:'center', flexShrink:0, marginLeft:'8px' }}>
                        <span style={{ fontSize:'0.7rem', color:'#333' }}>
                          {total > 0 ? `${((e.count/total)*100).toFixed(0)}%` : '0%'}
                        </span>
                        <span style={{ fontSize:'0.85rem', color:'#fff', fontWeight:900, minWidth:'16px', textAlign:'right' }}>{e.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Barra compuesta */}
              <div className="cbar">
                {estadosConf.filter(e=>e.count>0).map((e,i)=>(
                  <CompoundSeg key={e.key} count={e.count} total={total} color={e.color} delay={i*70}/>
                ))}
              </div>
              {/* Tasas */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div className="chip" style={{ borderColor:'rgba(16,185,129,0.2)', background:'rgba(16,185,129,0.05)' }}>
                  <div className="chip-val" style={{ color:'#10B981' }}>{tasaCompleto}%</div>
                  <div className="chip-lbl" style={{ color:'#10B981' }}>Completados</div>
                </div>
                <div className="chip" style={{ borderColor:'rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.05)' }}>
                  <div className="chip-val" style={{ color:'#EF4444' }}>{tasaDrop}%</div>
                  <div className="chip-lbl" style={{ color:'#EF4444' }}>Abandonados</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Barras por estado */}
        <div className="sp">
          <div className="sp-title"><BarChart2 size={17} color="#F59E0B"/> Animes por estado</div>
          {total === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'#2a2a2a', fontSize:'0.86rem' }}>Sin datos disponibles.</div>
          ) : (
            estadosConf.map((e, i) => (
              <HBar key={e.key} label={e.label} count={e.count} max={maxEstado} color={e.color} icon={e.icon} delay={i*65} total={total}/>
            ))
          )}
        </div>

      </div>

      {/* ══════════════════════════
          FILA 3 — EN TU RADAR
      ══════════════════════════ */}
      {radarItems.length > 0 && (
        <div className="sp" style={{ marginBottom:'16px' }}>
          <div className="sp-title">
            <Zap size={17} color="#F59E0B"/> En tu radar
            <span className="sp-title-end">Basado en tu lista actual</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:'12px' }}>
            {radarItems.map((item, i) => (
              <div key={i} className="radar-card" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                <img src={item.anime.imagen} alt={item.anime.titulo} className="radar-poster"/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.66rem', color: item.color, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'4px' }}>
                    {item.tag}
                  </div>
                  <div style={{ fontSize:'0.86rem', color:'#ddd', fontWeight:700, lineHeight:1.25, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', marginBottom:'5px' }}>
                    {item.anime.titulo}
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'#505050' }}>{item.desc}</div>
                  {item.pct > 0 && (
                    <div className="radar-pbar-track">
                      <div className="radar-pbar-fill" style={{ width:`${item.pct}%`, background: item.color }}/>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════
          FILA 4 — NOTAS + DATOS
      ══════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>

        {/* Distribución de notas */}
        <div className="sp">
          <div className="sp-title"><Star size={17} color="#FBBF24"/> Distribución de calificaciones</div>
          {calificados.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'#2a2a2a', fontSize:'0.86rem' }}>
              Califica animes en tu Top Personal para ver esto.
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:'10px', marginBottom:'18px' }}>
                {rangos.map((r, i) => <VBar key={r.label} label={r.label} count={r.count} max={maxRango} color={r.color} delay={i*90}/>)}
              </div>
              {notaMax && (
                <div style={{ background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.13)', borderRadius:'11px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'11px', marginBottom:'9px' }}>
                  <img src={notaMax.imagen} alt={notaMax.titulo} style={{ width:'34px', height:'46px', objectFit:'cover', borderRadius:'6px', flexShrink:0 }}/>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:'0.64rem', color:'#FBBF24', fontWeight:800, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'3px', display:'flex', alignItems:'center', gap:'4px' }}><Trophy size={10}/> Mejor nota</div>
                    <div style={{ fontSize:'0.86rem', color:'#fff', fontWeight:700, lineHeight:1.25, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{notaMax.titulo}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'#FBBF24', fontWeight:900, fontSize:'0.88rem', marginTop:'3px' }}>
                      <Star size={12} fill="#FBBF24"/> {Number(notaMax.calificacion).toFixed(1)} / 10
                    </div>
                  </div>
                </div>
              )}
              {notaMin && notaMin.id !== notaMax?.id && (
                <div style={{ background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.11)', borderRadius:'11px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'11px', marginBottom:'12px' }}>
                  <img src={notaMin.imagen} alt={notaMin.titulo} style={{ width:'34px', height:'46px', objectFit:'cover', borderRadius:'6px', flexShrink:0 }}/>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:'0.64rem', color:'#EF4444', fontWeight:800, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'3px', display:'flex', alignItems:'center', gap:'4px' }}><TrendingDown size={10}/> Peor nota</div>
                    <div style={{ fontSize:'0.86rem', color:'#fff', fontWeight:700, lineHeight:1.25, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{notaMin.titulo}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'#EF4444', fontWeight:900, fontSize:'0.88rem', marginTop:'3px' }}>
                      <Star size={12} fill="#EF4444" color="#EF4444"/> {Number(notaMin.calificacion).toFixed(1)} / 10
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'7px' }}>
                {[
                  { label:'Calificados', val: calificados.length,  color:'#F59E0B' },
                  { label:'Nota ≥ 9.5',  val: calificados.filter(a=>Number(a.calificacion)>=9.5).length, color:'#10B981' },
                  { label:'Nota < 5',    val: calificados.filter(a=>Number(a.calificacion)<5).length,    color:'#EF4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', background:'rgba(255,255,255,0.02)', borderRadius:'9px', padding:'10px 6px' }}>
                    <div style={{ fontSize:'1.2rem', fontWeight:900, color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:'0.62rem', color:'#404040', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:'3px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Datos y récords */}
        <div className="sp">
          <div className="sp-title"><Sparkles size={17} color="#A78BFA"/> Datos y récords</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

            <div className="rc">
              <div className="rc-icon" style={{ background:'rgba(62,166,255,0.1)', color:'#3ea6ff' }}><Eye size={18}/></div>
              <div>
                <div className="rc-val"><CountUp target={episodiosVistos}/></div>
                <div className="rc-lbl">Episodios vistos</div>
                <div className="rc-desc">{horas}h {Math.round(minutos % 60)}min · {dias} días de contenido</div>
              </div>
            </div>

            <div className="rc">
              <div className="rc-icon" style={{ background:'rgba(16,185,129,0.1)', color:'#10B981' }}><Target size={18}/></div>
              <div>
                <div className="rc-val">{total > 0 ? (episodiosVistos / total).toFixed(1) : '—'}</div>
                <div className="rc-lbl">Promedio caps por anime</div>
                <div className="rc-desc">Calculado sobre toda tu biblioteca</div>
              </div>
            </div>

            <div className="rc">
              <div className="rc-icon" style={{ background:'rgba(245,158,11,0.1)', color:'#F59E0B' }}><Flame size={18}/></div>
              <div>
                <div className="rc-val">{viendo + pausados}</div>
                <div className="rc-lbl">Animes en curso</div>
                <div className="rc-desc">{viendo} activos · {pausados} pausados · {atrasados} atrasados</div>
              </div>
            </div>

            <div className="rc">
              <div className="rc-icon" style={{ background:'rgba(167,139,250,0.1)', color:'#A78BFA' }}><ListChecks size={18}/></div>
              <div>
                <div className="rc-val">{pendientes}</div>
                <div className="rc-lbl">Por empezar (pendientes)</div>
                <div className="rc-desc">{pendientes > 0 ? `${Math.round((pendientes/total)*100)}% de tu biblioteca` : 'Cola vacía'}</div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ══════════════════════════
          FILA 5 — TOP PERSONAL
      ══════════════════════════ */}
      {topAnimes.length > 0 && (
        <div className="sp">
          <div className="sp-title">
            <Trophy size={17} color="#FBBF24"/> Top Personal
            <span className="sp-title-end">{topAnimes.length} anime{topAnimes.length !== 1 ? 's' : ''} rankeado{topAnimes.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Podio top 3 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(195px,1fr))', gap:'12px', marginBottom: topAnimes.length > 3 ? '18px' : '0' }}>
            {topAnimes.slice(0,3).map(anime => {
              const m = podioMeta(anime.ranking);
              return (
                <div key={anime.id}
                  style={{ background:`linear-gradient(135deg,rgba(20,20,23,0.95),rgba(10,10,13,0.98))`, border:`1px solid ${m.color}30`, boxShadow:`0 5px 22px ${m.glow}`, borderRadius:'15px', padding:'14px', display:'flex', alignItems:'center', gap:'12px', position:'relative', overflow:'hidden', transition:'transform 0.2s ease', cursor:'default' }}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='none'}
                >
                  <img src={anime.imagen} alt={anime.titulo} style={{ width:'48px', height:'65px', objectFit:'cover', borderRadius:'7px', boxShadow:'0 3px 12px rgba(0,0,0,0.6)', flexShrink:0, zIndex:1 }}/>
                  <div style={{ zIndex:1, flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.64rem', fontWeight:800, color:m.color, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' }}>{m.badge} {m.label}</div>
                    <div style={{ fontWeight:800, color:'#fff', fontSize:'0.85rem', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', marginBottom:'6px' }}>
                      {anime.titulo}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'#FBBF24', fontWeight:900, fontSize:'0.9rem' }}>
                      <Star size={12} fill="#FBBF24" color="#FBBF24"/>
                      {Number(anime.calificacion).toFixed(1)}
                      <span style={{ color:'#303030', fontWeight:400, fontSize:'0.78rem' }}> / 10</span>
                    </div>
                  </div>
                  <div style={{ position:'absolute', right:'6px', bottom:'-10px', fontSize:'3rem', fontWeight:900, color:m.color, opacity:0.09, lineHeight:1, userSelect:'none' }}>
                    #{anime.ranking}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lista del resto */}
          {topAnimes.length > 3 && (
            <div className="fscroll" style={{ maxHeight:'300px', overflowY:'auto', paddingRight:'4px' }}>
              {topAnimes.slice(3).map(anime => (
                <div key={anime.id} className="rrow">
                  <span style={{ fontSize:'0.85rem', fontWeight:900, color:'#404040', minWidth:'26px', textAlign:'center' }}>#{anime.ranking}</span>
                  <img src={anime.imagen} alt={anime.titulo} className="rrow-img"/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.85rem', color:'#ccc', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{anime.titulo}</div>
                    <div style={{ fontSize:'0.74rem', color:'#444', marginTop:'1px', textTransform:'capitalize' }}>{anime.estado}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'3px', color:'#FBBF24', fontWeight:900, fontSize:'0.88rem', flexShrink:0 }}>
                    <Star size={12} fill="#FBBF24" color="#FBBF24"/>
                    {Number(anime.calificacion).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'25vh', gap:'12px' }}>
          <BarChart3 size={48} color="rgba(255,255,255,0.04)"/>
          <p style={{ color:'#2e2e2e', fontSize:'0.88rem', margin:0 }}>Agrega animes para ver tus estadísticas.</p>
        </div>
      )}
    </div>
  );
};

export default Statistics;