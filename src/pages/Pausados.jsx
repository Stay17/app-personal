import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trash2, PauseCircle, Loader2, Search, Play, Minus, Plus, CalendarDays, Layers } from 'lucide-react';
import Swal from 'sweetalert2';

const Pausados = () => {
  const [animesPausados, setAnimesPausados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const fetchPausados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anime_list')
        .select('*')
        .eq('estado', 'pausado')
        .order('fecha_agregado', { ascending: false });

      if (error) throw error;
      setAnimesPausados(data || []);
    } catch (error) {
      console.error('Error al cargar pausados:', error.message);
      Swal.fire({ 
        title: 'Error', 
        text: 'No se pudieron cargar tus animes pausados.', 
        icon: 'error', 
        background: '#1a1a1a', 
        color: '#fff',
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: { popup: 'swal-error-popup' }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPausados();
  }, []);

  const actualizarEpisodio = async (anime, nuevoEpisodio) => {
    if (nuevoEpisodio < 0) return; 

    if (anime.episodios_totales > 0 && nuevoEpisodio > anime.episodios_totales) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite alcanzado',
        text: `Este anime solo tiene ${anime.episodios_totales} capítulos.`,
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#3ea6ff',
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: { popup: 'swal-warning-popup' }
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('anime_list')
        .update({ episodio_actual: nuevoEpisodio })
        .eq('id', anime.id);

      if (error) throw error;

      setAnimesPausados(prev =>
        prev.map(a =>
          a.id === anime.id ? { ...a, episodio_actual: nuevoEpisodio } : a
        )
      );
    } catch (error) {
      console.error('Error al actualizar episodio:', error.message);
      Swal.fire({ 
        title: 'Error', 
        text: 'No se pudo actualizar el episodio.', 
        icon: 'error', 
        background: '#1a1a1a', 
        color: '#fff',
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: { popup: 'swal-error-popup' }
      });
    }
  };

  const editarEpisodioManual = async (anime) => {
    const { value: formValue } = await Swal.fire({
      title: 'Ir al capítulo...',
      input: 'number',
      inputLabel: anime.episodios_totales > 0 ? `Máximo: ${anime.episodios_totales}` : 'Episodio actual',
      inputValue: anime.episodio_actual || 0,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3ea6ff',
      background: '#1a1a1a',
      color: '#ffffff',
      backdrop: 'rgba(0,0,0,0.8)',
      customClass: { popup: 'swal-info-popup' },
      inputValidator: (value) => {
        if (!value || value < 0) {
          return 'Ingresa un número válido (mayor o igual a 0)';
        }
        if (anime.episodios_totales > 0 && parseInt(value) > anime.episodios_totales) {
          return `El anime solo tiene ${anime.episodios_totales} capítulos.`;
        }
      }
    });

    if (formValue !== undefined) {
      actualizarEpisodio(anime, parseInt(formValue));
    }
  };

  const reanudarAnime = async (id, titulo) => {
    try {
      const { error } = await supabase
        .from('anime_list')
        .update({ estado: 'viendo' })
        .eq('id', id);

      if (error) throw error;

      setAnimesPausados(prev => prev.filter(anime => anime.id !== id));
      
      Swal.fire({ 
        title: '¡Reanudado!', 
        text: `"${titulo}" volvió a tu lista de Viendo.`, 
        icon: 'success', 
        background: '#1a1a1a', 
        color: '#fff', 
        timer: 1500, 
        showConfirmButton: false,
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: { popup: 'swal-success-popup' }
      });
    } catch (error) {
      console.error('Error al reanudar:', error.message);
    }
  };

  const eliminarAnime = async (id, titulo) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar "${titulo}" definitivamente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#3ea6ff',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#1a1a1a',
      color: '#ffffff',
      backdrop: 'rgba(0,0,0,0.8)',
      customClass: { popup: 'swal-delete-popup' }
    });

    if (confirmacion.isConfirmed) {
      try {
        const { error } = await supabase.from('anime_list').delete().eq('id', id);
        if (error) throw error;
        setAnimesPausados(prev => prev.filter(anime => anime.id !== id));
        Swal.fire({ 
          title: '¡Eliminado!', 
          icon: 'success', 
          background: '#1a1a1a', 
          color: '#fff', 
          timer: 1500, 
          showConfirmButton: false,
          backdrop: 'rgba(0,0,0,0.8)',
          customClass: { popup: 'swal-success-popup' }
        });
      } catch (error) {
        console.error('Error al eliminar:', error.message);
      }
    }
  };

  const animesFiltrados = animesPausados.filter(anime =>
    anime.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return 'Reciente';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div>
      <style>{`
        /* SWEETALERT PREMIUM STYLES */
        .swal-success-popup { border: 1px solid rgba(16, 185, 129, 0.4) !important; box-shadow: 0 0 25px rgba(16, 185, 129, 0.15) !important; }
        .swal-delete-popup { border: 1px solid rgba(239, 68, 68, 0.4) !important; box-shadow: 0 0 25px rgba(239, 68, 68, 0.15) !important; }
        .swal-error-popup { border: 1px solid rgba(239, 68, 68, 0.4) !important; box-shadow: 0 0 25px rgba(239, 68, 68, 0.15) !important; }
        .swal-warning-popup { border: 1px solid rgba(245, 158, 11, 0.4) !important; box-shadow: 0 0 25px rgba(245, 158, 11, 0.15) !important; }
        .swal-info-popup { border: 1px solid rgba(62, 166, 255, 0.4) !important; box-shadow: 0 0 25px rgba(62, 166, 255, 0.15) !important; }

        .btn-action {
          background-color: transparent;
          border: none;
          border-radius: 8px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-delete {
          color: rgba(239, 68, 68, 0.7);
        }
        .btn-delete:hover {
          background-color: rgba(239, 68, 68, 0.15);
          color: #EF4444;
          transform: scale(1.1);
        }
        .btn-resume {
          color: rgba(62, 166, 255, 0.7);
        }
        .btn-resume:hover {
          background-color: rgba(62, 166, 255, 0.15);
          color: #3ea6ff;
          transform: scale(1.1);
        }
        
        .badge-pausado-new {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #94A3B8;
          background: rgba(148, 163, 184, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .ep-controls-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 6px 8px;
          border-radius: 8px;
        }

        .ep-btn {
          background: rgba(148, 163, 184, 0.15);
          border: none;
          color: #94A3B8;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .ep-btn:hover:not(:disabled) {
          background: rgba(148, 163, 184, 0.4);
          color: #ffffff;
        }
        .ep-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: #e2e8f0;
          min-width: 50px;
          text-align: center;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .ep-text:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 40vh;
          color: var(--text-muted);
          text-align: center;
        }
        .search-bar-container {
          position: relative;
          max-width: 350px;
          margin-bottom: 25px;
        }
        .search-bar-input {
          width: 100%;
          padding: 10px 16px 10px 40px;
          background-color: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s ease;
        }
        .search-bar-input:focus {
          border-color: var(--accent-color, #3ea6ff);
          box-shadow: 0 0 0 2px rgba(62, 166, 255, 0.2);
        }
        .search-bar-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.4);
          pointer-events: none;
        }

        .anime-title-clamp {
          font-size: 0.95rem;
          line-height: 1.3;
          margin: 0; 
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <h2 className="title" style={{ color: '#3ea6ff', marginBottom: '20px', fontWeight: 800 }}>Animes Pausados ⏸️</h2> 

      {!loading && animesPausados.length > 0 && (
        <div className="search-bar-container">
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Buscar en pausados..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: 'var(--accent-color)' }}>
          <Loader2 size={40} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : animesPausados.length === 0 ? (
        <div className="empty-state">
          <PauseCircle size={60} style={{ marginBottom: '15px', opacity: 0.5 }} />
          <h3>No tienes animes en pausa</h3>
          <p>¡Qué buena racha! Parece que terminas todo lo que empiezas.</p>
        </div>
      ) : animesFiltrados.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron resultados</h3>
          <p>Prueba buscando con otro término.</p>
        </div>
      ) : (
        <div className="anime-grid">
          {animesFiltrados.map((anime) => (
            <div key={anime.id} className="anime-card" style={{ display: 'flex', flexDirection: 'column' }}>
              
              <img src={anime.imagen} alt={anime.titulo} />
              
              {/* Contenedor principal de la info con padding superior extra para respirar */}
              <div className="anime-info" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '16px 14px' }}>
                
                {/* TÍTULO */}
                <h3 className="anime-title-clamp">{anime.titulo}</h3>

                {/* Este contenedor agrupa todo lo de abajo y usa 'gap' para darle espacio EXACTO a cada fila,
                    además usa 'marginTop: auto' para empujarse al fondo y no chocar con el título */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                  
                  {/* FECHA Y CAPÍTULOS TOTALES */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarDays size={14} color="#94A3B8" />
                      {formatearFecha(anime.fecha_agregado)}
                    </span>
                    
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={14} color="var(--accent-color, #3ea6ff)" /> 
                      {anime.episodios_totales > 0 ? anime.episodios_totales : '?'} caps
                    </span>
                  </div>

                  {/* CONTROLES DE EPISODIO */}
                  <div className="ep-controls-container">
                    <button 
                      className="ep-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        actualizarEpisodio(anime, (anime.episodio_actual || 0) - 1);
                      }}
                      disabled={!anime.episodio_actual || anime.episodio_actual <= 0}
                      style={{ opacity: (!anime.episodio_actual || anime.episodio_actual <= 0) ? 0.3 : 1 }}
                    >
                      <Minus size={14} strokeWidth={2.5} />
                    </button>

                    <span 
                      className="ep-text"
                      title="Clic para editar manual"
                      onClick={(e) => {
                        e.stopPropagation();
                        editarEpisodioManual(anime);
                      }}
                    >
                      Cap. {anime.episodio_actual || 0}
                    </span>

                    <button 
                      className="ep-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        actualizarEpisodio(anime, (anime.episodio_actual || 0) + 1);
                      }}
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* LÍNEA SEPARADORA SUTIL */}
                  <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}></div>
                  
                  {/* FOOTER: BADGE Y BOTONES DE ACCIÓN */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    <div className="badge-pausado-new">
                      <PauseCircle size={14} strokeWidth={2.5} />
                      <span>Pausado</span>
                    </div>

                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button 
                        className="btn-action btn-resume"
                        onClick={(e) => {
                          e.stopPropagation();
                          reanudarAnime(anime.id, anime.titulo);
                        }}
                        title="Reanudar (Mover a Viendo)"
                      >
                        <Play size={18} fill="currentColor" />
                      </button>

                      <button 
                        className="btn-action btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarAnime(anime.id, anime.titulo);
                        }}
                        title="Eliminar de la lista"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pausados;