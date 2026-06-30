import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trash2, Layers, Loader2, Search, Play, Folder } from 'lucide-react';
import Swal from 'sweetalert2';

const Pendientes = () => {
  const [animesPendientes, setAnimesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const fetchPendientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anime_list')
        .select('*')
        .eq('estado', 'pendiente')
        .order('fecha_agregado', { ascending: false });

      if (error) throw error;
      
      setAnimesPendientes(data || []);
    } catch (error) {
      console.error('Error al cargar pendientes:', error.message);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar tus animes pendientes.',
        icon: 'error',
        background: 'var(--bg-card-solid, #1a1a1a)',
        color: 'var(--text-main, #fff)',
        customClass: { popup: 'swal-premium-danger' } // <-- Añadido
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendientes();
  }, []);

  const empezarAnime = async (id, titulo) => {
    const confirmacion = await Swal.fire({
      title: '¿Empezar a ver?',
      text: `¿Quieres mover "${titulo}" a tu lista de Viendo?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#3ea6ff',
      confirmButtonText: 'Sí, empezar',
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-card-solid, #1a1a1a)',
      color: 'var(--text-main, #fff)',
      customClass: { popup: 'swal-premium-question' } // <-- Añadido
    });

    if (confirmacion.isConfirmed) {
      try {
        const { error } = await supabase
          .from('anime_list')
          .update({ estado: 'viendo' })
          .eq('id', id);

        if (error) throw error;

        setAnimesPendientes(prev => prev.filter(anime => anime.id !== id));

        Swal.fire({
          title: '¡Añadido a Viendo!',
          text: 'Prepara las palomitas',
          icon: 'success',
          background: 'var(--bg-card-solid, #1a1a1a)',
          color: 'var(--text-main, #fff)',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'swal-premium-success' } // <-- Añadido
        });
      } catch (error) {
        console.error('Error al mover a viendo:', error.message);
      }
    }
  };

  const eliminarAnime = async (id, titulo) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar "${titulo}" de tu lista de pendientes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#3ea6ff',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-card-solid, #1a1a1a)',
      color: 'var(--text-main, #fff)',
      customClass: { popup: 'swal-premium-danger' } // <-- Añadido
    });

    if (confirmacion.isConfirmed) {
      try {
        const { error } = await supabase
          .from('anime_list')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setAnimesPendientes(prev => prev.filter(anime => anime.id !== id));

        Swal.fire({
          title: 'Eliminado!',
          text: 'El anime fue removido de tu lista.',
          icon: 'success',
          background: 'var(--bg-card-solid, #1a1a1a)',
          color: 'var(--text-main, #fff)',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'swal-premium-success' } // <-- Añadido
        });
      } catch (error) {
        console.error('Error al eliminar:', error.message);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el anime.',
          icon: 'error',
          background: 'var(--bg-card-solid, #1a1a1a)',
          color: 'var(--text-main, #fff)',
          customClass: { popup: 'swal-premium-danger' } // <-- Añadido
        });
      }
    }
  };

  const animesFiltrados = animesPendientes.filter(anime =>
    anime.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  // NUEVA FUNCIÓN: Transforma la fecha de Supabase a un texto legible
  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return 'Añadido recientemente';
    const fecha = new Date(fechaIso);
    return `Añadido el ${fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })}`;
  };

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
        .swal-premium-question {
          border: 1px solid rgba(62, 166, 255, 0.4) !important;
          box-shadow: 0 0 30px rgba(62, 166, 255, 0.15) !important;
        }
        /* ----------------------------------------------- */

        .btn-delete { background-color: transparent; color: #EF4444; border: none; border-radius: 8px; padding: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
        .btn-delete:hover { background-color: rgba(239, 68, 68, 0.15); transform: scale(1.1); }
        
        .btn-play { background-color: transparent; color: #10B981; border: none; border-radius: 8px; padding: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
        .btn-play:hover { background-color: rgba(16, 185, 129, 0.15); transform: scale(1.1); }
        .action-buttons { display: flex; gap: 5px; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 40vh; color: var(--text-muted, #aaa); text-align: center; }

        /* search-bar: estilos movidos a index.css */

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <h2 className="title" style={{ color: '#3ea6ff', marginBottom: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><Folder size={22} />Mis Animes Pendientes</h2>

      {!loading && animesPendientes.length > 0 && (
        <div className="search-bar-container">
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Buscar en pendientes..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: 'var(--accent-color, #3ea6ff)' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : animesPendientes.length === 0 ? (
        <div className="empty-state">
          <Layers size={60} style={{ marginBottom: '15px', opacity: 0.5 }} />
          <h3>No tienes animes pendientes</h3>
          <p>Ve a "Explorar" and agrega los animes que planeas ver en el futuro.</p>
        </div>
      ) : animesFiltrados.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron resultados</h3>
          <p>Prueba con otro nombre o comprueba si está bien escrito.</p>
        </div>
      ) : (
        <div className="anime-grid">
          {animesFiltrados.map((anime) => (
            <div key={anime.id} className="anime-card" style={{ display: 'flex', flexDirection: 'column' }}>

              <img src={anime.imagen} alt={anime.titulo} />
              
              <div className="anime-info" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                
                {/* AQUI APLICAMOS LA FECHA DINÁMICA */}
                <div style={{ fontSize: '0.8rem', color: '#EAB308', fontWeight: 'bold', marginBottom: '5px' }}>
                  {formatearFecha(anime.fecha_agregado)}
                </div>
                
                <h3 className="anime-title" style={{ marginBottom: 'auto' }}>{anime.titulo}</h3>
                
                <div className="anime-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted, #aaa)' }}>
                    <Layers size={16} color="var(--accent-color, #3ea6ff)" /> 
                    {anime.episodios_totales > 0 ? `${anime.episodios_totales} caps` : 'Emisión/Desconocido'}
                  </span>

                  <div className="action-buttons">
                    <button 
                      className="btn-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        empezarAnime(anime.id, anime.titulo);
                      }}
                      title="Empezar a ver"
                    >
                      <Play size={18} fill="currentColor" />
                    </button>

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pendientes;