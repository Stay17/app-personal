import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trash2, Minus, Plus, Loader2, Tv, Search, Skull } from 'lucide-react';
import Swal from 'sweetalert2';

const Viendo = () => {
  const [animesViendo, setAnimesViendo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const fetchViendo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anime_list')
        .select('*')
        .eq('estado', 'viendo')
        .order('fecha_agregado', { ascending: false });

      if (error) throw error;
      setAnimesViendo(data || []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViendo();
  }, []);

  const actualizarEpisodio = async (anime, accion) => {
    let nuevoEpisodio = anime.episodio_actual;
    if (accion === 'sumar') nuevoEpisodio += 1;
    if (accion === 'restar') nuevoEpisodio -= 1;

    try {
      if (anime.episodios_totales > 0 && nuevoEpisodio === anime.episodios_totales) {
        const result = await Swal.fire({
          title: '¡Felicidades!',
          text: `¿Terminaste de ver "${anime.titulo}"? ¿Quieres moverlo a completados?`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#3ea6ff',
          confirmButtonText: 'Sí, ¡completado!',
          cancelButtonText: 'Seguir viendo',
          background: '#1a1a1a',
          color: '#ffffff',
          customClass: { popup: 'swal-premium-success' } // <-- Añadido
        });

        if (result.isConfirmed) {
          const { error } = await supabase
            .from('anime_list')
            .update({ episodio_actual: nuevoEpisodio, estado: 'completado' })
            .eq('id', anime.id);
          if (error) throw error;
          setAnimesViendo(prev => prev.filter(item => item.id !== anime.id));
          return;
        }
      }

      const { error } = await supabase
        .from('anime_list')
        .update({ episodio_actual: nuevoEpisodio })
        .eq('id', anime.id);

      if (error) throw error;

      setAnimesViendo(prev =>
        prev.map(item => item.id === anime.id ? { ...item, episodio_actual: nuevoEpisodio } : item)
      );
    } catch (error) {
      console.error(error.message);
    }
  };

  const eliminarAnime = async (id, titulo) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar "${titulo}" de tu lista.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#3ea6ff',
      confirmButtonText: 'Sí, eliminar',
      background: '#1a1a1a',
      color: '#ffffff',
      customClass: { popup: 'swal-premium-danger' } // <-- Añadido
    });

    if (confirmacion.isConfirmed) {
      try {
        const { error } = await supabase.from('anime_list').delete().eq('id', id);
        if (error) throw error;
        setAnimesViendo(prev => prev.filter(anime => anime.id !== id));
      } catch (error) {
        console.error(error.message);
      }
    }
  };

  // ── NUEVA FUNCIÓN: Mover al cementerio ──────────────────────────────────────
  const handleDropear = async (anime) => {
    const { value: comentario } = await Swal.fire({
      title: 'Mandar al cementerio',
      html: `
        <p style="color: #aaa; font-size: 0.9rem; margin-bottom: 15px;">
          Te quedaste en el <b style="color:#D4AF37;">capítulo ${anime.episodio_actual}</b>.
          Este progreso se guardará automáticamente.
        </p>
      `,
      input: 'textarea',
      inputPlaceholder: 'Escribe por qué lo dropeás (opcional)...',
      inputAttributes: { style: 'background:rgba(255,255,255,0.05);color:#fff;border:1px solid rgba(212,175,55,0.3);border-radius:8px;resize:vertical;' },
      background: 'rgba(20, 20, 20, 0.95)',
      color: '#D4AF37',
      backdrop: 'rgba(0,0,0,0.8)',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#333333',
      confirmButtonText: 'Dropear Anime',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'swal-premium-warning' } // <-- Añadido
    });

    // comentario puede ser "" (vacío) si el usuario no escribió nada, o undefined si canceló
    if (comentario !== undefined) {
      try {
        const { error } = await supabase
          .from('anime_list')
          .update({
            estado: 'dropeado',
            comentario_dropeo: comentario,
            // episodio_actual NO se toca: queda exactamente donde estaba
          })
          .eq('id', anime.id);

        if (error) throw error;

        // Sacarlo de la lista local inmediatamente
        setAnimesViendo(prev => prev.filter(item => item.id !== anime.id));

        Swal.fire({
          icon: 'success',
          title: 'Movido al cementerio',
          background: 'rgba(20, 20, 20, 0.95)',
          color: '#D4AF37',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: 'swal-premium-warning' } // <-- Añadido
        });
      } catch (error) {
        console.error('Error al dropear:', error.message);
      }
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  const animesFiltrados = animesViendo.filter(anime =>
    anime.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <style>{`
        /* --- ESTILOS PREMIUM PARA MODALES SWEETALERT --- */
        .swal-premium-success {
          border: 1px solid rgba(16, 185, 129, 0.4) !important;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.15) !important;
        }
        .swal-premium-danger {
          border: 1px solid rgba(239, 68, 68, 0.4) !important;
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.15) !important;
        }
        .swal-premium-warning {
          border: 1px solid rgba(212, 175, 55, 0.4) !important;
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.15) !important;
        }
        /* ----------------------------------------------- */

        .btn-drop {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 0;
          background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%);
          color: #D4AF37;
          border: 1px solid rgba(212,175,55,0.45);
          border-radius: 10px;
          font-size: 0.8rem; font-weight: 700; letter-spacing: 0.4px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 0 0 rgba(212,175,55,0);
        }
        .btn-drop:hover {
          background: linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.12) 100%);
          border-color: rgba(212,175,55,0.8);
          box-shadow: 0 0 12px rgba(212,175,55,0.25);
          transform: translateY(-1px);
        }
        .btn-drop:active { transform: translateY(0); box-shadow: none; }

        .btn-delete {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 0;
          background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%);
          color: #f87171;
          border: 1px solid rgba(239,68,68,0.45);
          border-radius: 10px;
          font-size: 0.8rem; font-weight: 700; letter-spacing: 0.4px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 0 0 rgba(239,68,68,0);
        }
        .btn-delete:hover {
          background: linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.12) 100%);
          border-color: rgba(239,68,68,0.8);
          box-shadow: 0 0 12px rgba(239,68,68,0.25);
          transform: translateY(-1px);
        }
        .btn-delete:active { transform: translateY(0); box-shadow: none; }
        .episode-controls { display: flex; align-items: center; justify-content: center; gap: 10px; background-color: rgba(255, 255, 255, 0.05); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); flex: 1; }
        .btn-circle { width: 28px; height: 28px; border-radius: 50%; border: none; background-color: #3ea6ff; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s; }
        .btn-circle:hover { background-color: #2b8ee0; }
        .btn-circle:disabled { background-color: #555; cursor: not-allowed; }
        .episodes-text { font-weight: bold; font-size: 0.85rem; color: #fff; min-width: 65px; text-align: center; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 40vh; color: #aaa; text-align: center; }
        
        /* SEARCH BAR */
        .search-bar-container { position: relative; max-width: 350px; margin-bottom: 25px; }
        .search-bar-input { width: 100%; padding: 10px 16px 10px 40px; background-color: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white; font-size: 0.9rem; outline: none; transition: all 0.2s ease; }
        .search-bar-input:focus { border-color: #3ea6ff; box-shadow: 0 0 0 2px rgba(62, 166, 255, 0.2); }
        .search-bar-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255, 255, 255, 0.4); pointer-events: none; }

        /* PROGRESS BAR BARRA PREMIUM */
        .progress-container { width: 100%; height: 5px; background-color: rgba(255, 255, 255, 0.1); border-radius: 3px; margin-top: 10px; overflow: hidden; }
        .progress-bar { height: 100%; background-color: #3ea6ff; transition: width 0.3s ease; }

        /* KEYFRAMES PARA EL SPIN */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <h2 className="title" style={{ color: '#3ea6ff', marginBottom: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><Tv size={22} />Viendo Actualmente</h2>
      {!loading && animesViendo.length > 0 && (
        <div className="search-bar-container">
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Buscar en esta sección..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: '#3ea6ff' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : animesViendo.length === 0 ? (
        <div className="empty-state">
          <Tv size={60} style={{ marginBottom: '15px', opacity: 0.5 }} />
          <h3>No estás viendo ningún anime</h3>
          <p>Ve a "Explorar" para empezar una nueva aventura.</p>
        </div>
      ) : animesFiltrados.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron resultados</h3>
          <p>Prueba con otro título o revisa si está bien escrito.</p>
        </div>
      ) : (
        <div className="anime-grid">
          {animesFiltrados.map((anime) => {
            const porcentaje = anime.episodios_totales > 0
              ? (anime.episodio_actual / anime.episodios_totales) * 100
              : 0;

            return (
              <div key={anime.id} className="anime-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <img src={anime.imagen} alt={anime.titulo} />

                <div className="anime-info" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 className="anime-title" style={{ marginBottom: 'auto' }}>{anime.titulo}</h3>

                  {anime.episodios_totales > 0 && (
                    <div className="progress-container" title={`${porcentaje.toFixed(0)}% completado`}>
                      <div className="progress-bar" style={{ width: `${porcentaje}%` }}></div>
                    </div>
                  )}

                  {/* Fila 1: controles de episodio */}
                  <div className="episode-controls" style={{ margin: '15px 0 8px 0' }}>
                    <button
                      className="btn-circle"
                      onClick={() => actualizarEpisodio(anime, 'restar')}
                      disabled={anime.episodio_actual <= 0}
                    >
                      <Minus size={16} />
                    </button>

                    <span className="episodes-text">
                      Cap {anime.episodio_actual} / {anime.episodios_totales > 0 ? anime.episodios_totales : '?'}
                    </span>

                    <button
                      className="btn-circle"
                      onClick={() => actualizarEpisodio(anime, 'sumar')}
                      disabled={anime.episodios_totales > 0 && anime.episodio_actual >= anime.episodios_totales}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Fila 2: botones de acción */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-drop"
                      title="Mandar al cementerio"
                      onClick={(e) => { e.stopPropagation(); handleDropear(anime); }}
                    >
                      <Skull size={14} />
                      Dropear
                    </button>

                    <button
                      className="btn-delete"
                      title="Eliminar de la lista"
                      onClick={(e) => { e.stopPropagation(); eliminarAnime(anime.id, anime.titulo); }}
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Viendo;