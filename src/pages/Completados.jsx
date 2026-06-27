import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trash2, CheckCircle2, Loader2, Award, Search, Layers, CalendarDays } from 'lucide-react';
import Swal from 'sweetalert2';

const Completados = () => {
  const [animesCompletados, setAnimesCompletados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const fetchCompletados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anime_list')
        .select('*')
        .eq('estado', 'completado')
        .order('fecha_agregado', { ascending: false });

      if (error) throw error;
      setAnimesCompletados(data || []);
    } catch (error) {
      console.error('Error al cargar completados:', error.message);
      Swal.fire({ 
        title: 'Error', 
        text: 'No se pudieron cargar tus animes completados.', 
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
    fetchCompletados();
  }, []);

  const eliminarAnime = async (id, titulo) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar "${titulo}" de tus completados.`,
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
        setAnimesCompletados(prev => prev.filter(anime => anime.id !== id));
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

  const animesFiltrados = animesCompletados.filter(anime =>
    anime.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Fecha más corta para que encaje mejor (Ej: 24 jun 2026)
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

        .btn-delete {
          background-color: transparent;
          color: rgba(239, 68, 68, 0.7);
          border: none;
          border-radius: 8px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-delete:hover {
          background-color: rgba(239, 68, 68, 0.15);
          color: #EF4444;
          transform: scale(1.1);
        }
        
        /* NUEVO BADGE: Más limpio, vibrante y con forma de píldora */
        .badge-completado-new {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #00e676;
          background: rgba(0, 230, 118, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 1px solid rgba(0, 230, 118, 0.2);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 40vh;
          color: var(--text-muted, #aaa);
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
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Asegurar que el título no rompa el diseño si es muy largo */
        .anime-title-clamp {
          font-size: 0.95rem;
          line-height: 1.3;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <h2 className="title" style={{ color: '#3ea6ff', marginBottom: '20px', fontWeight: 800 }}>Animes Completados ✅</h2>

      {!loading && animesCompletados.length > 0 && (
        <div className="search-bar-container">
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Buscar en completados..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: 'var(--accent-color, #3ea6ff)' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : animesCompletados.length === 0 ? (
        <div className="empty-state">
          <Award size={60} style={{ marginBottom: '15px', opacity: 0.5 }} />
          <h3>Aún no has completado animes</h3>
          <p>¡Sigue viendo tus series favoritas para llenar este salón de la fama!</p>
        </div>
      ) : animesFiltrados.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron resultados</h3>
          <p>Prueba escribiendo otra palabra clave.</p>
        </div>
      ) : (
        <div className="anime-grid">
          {animesFiltrados.map((anime) => (
            <div key={anime.id} className="anime-card" style={{ display: 'flex', flexDirection: 'column' }}>
              
              <img src={anime.imagen} alt={anime.titulo} />
              
              <div className="anime-info" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '12px' }}>
                
                {/* TÍTULO */}
                <h3 className="anime-title-clamp">{anime.titulo}</h3>
                
                {/* FECHA Y CAPÍTULOS EN LA MISMA LÍNEA (Libera espacio abajo) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: 'auto' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CalendarDays size={14} color="#10B981" />
                    {formatearFecha(anime.fecha_agregado)}
                  </span>
                  
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={14} color="var(--accent-color, #3ea6ff)" /> 
                    {anime.episodios_totales > 0 ? anime.episodios_totales : '?'} caps
                  </span>
                </div>

                {/* LÍNEA SEPARADORA SUTIL */}
                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '12px 0 10px 0' }}></div>
                
                {/* FOOTER: BADGE REDISEÑADO Y BOTÓN ELIMINAR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="badge-completado-new">
                    <CheckCircle2 size={14} strokeWidth={2.5} />
                    <span>Terminado</span>
                  </div>

                  <button 
                    className="btn-delete"
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
          ))}
        </div>
      )}
    </div>
  );
};

export default Completados;