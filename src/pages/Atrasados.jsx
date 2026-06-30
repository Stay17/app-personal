import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trash2, History, Loader2, Search, MonitorPlay, Layers, Hourglass } from 'lucide-react';
import Swal from 'sweetalert2';

const Atrasados = () => {
  const [animesAtrasados, setAnimesAtrasados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // 1. CARGAR LOS ANIMES ATRASADOS
  const fetchAtrasados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anime_list')
        .select('*')
        .eq('estado', 'atrasado')
        .order('fecha_agregado', { ascending: false });

      if (error) throw error;
      setAnimesAtrasados(data || []);
    } catch (error) {
      console.error('Error al cargar atrasados:', error.message);
      Swal.fire({ 
        title: 'Error', 
        text: 'No se pudieron cargar tus animes atrasados.', 
        icon: 'error', 
        background: 'var(--bg-card-solid, #1a1a1a)', 
        color: 'var(--text-main, #fff)',
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: { popup: 'swal-error-popup' }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtrasados();
  }, []);

  // 2. FUNCIÓN PARA EMPEZAR A VER (Mover a "Viendo")
  const empezarTemporada = async (id, titulo) => {
    try {
      const { error } = await supabase
        .from('anime_list')
        .update({ estado: 'viendo' }) // Lo mandamos a la parrilla activa
        .eq('id', id);

      if (error) throw error;

      setAnimesAtrasados(prev => prev.filter(anime => anime.id !== id));
      
      Swal.fire({ 
        title: '¡A ponerte al día!', 
        text: `"${titulo}" se movió a Viendo. ¡Disfruta la temporada!`, 
        icon: 'success', 
        background: 'var(--bg-card-solid, #1a1a1a)', 
        color: 'var(--text-main, #fff)', 
        timer: 2000, 
        showConfirmButton: false,
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: { popup: 'swal-purple-popup' }
      });
    } catch (error) {
      console.error('Error al reanudar:', error.message);
    }
  };

  // 3. FUNCIÓN PARA ELIMINAR
  const eliminarAnime = async (id, titulo) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar "${titulo}" de tu lista de espera.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#3ea6ff',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-card-solid, #1a1a1a)',
      color: 'var(--text-main, #fff)',
      backdrop: 'rgba(0,0,0,0.8)',
      customClass: { popup: 'swal-delete-popup' }
    });

    if (confirmacion.isConfirmed) {
      try {
        const { error } = await supabase.from('anime_list').delete().eq('id', id);
        if (error) throw error;
        setAnimesAtrasados(prev => prev.filter(anime => anime.id !== id));
        Swal.fire({ 
          title: '¡Eliminado!', 
          icon: 'success', 
          background: 'var(--bg-card-solid, #1a1a1a)', 
          color: 'var(--text-main, #fff)', 
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

  const animesFiltrados = animesAtrasados.filter(anime =>
    anime.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <style>{`
        /* SWEETALERT PREMIUM STYLES */
        .swal-success-popup { border: 1px solid rgba(16, 185, 129, 0.4) !important; box-shadow: 0 0 25px rgba(16, 185, 129, 0.15) !important; }
        .swal-delete-popup { border: 1px solid rgba(239, 68, 68, 0.4) !important; box-shadow: 0 0 25px rgba(239, 68, 68, 0.15) !important; }
        .swal-error-popup { border: 1px solid rgba(239, 68, 68, 0.4) !important; box-shadow: 0 0 25px rgba(239, 68, 68, 0.15) !important; }
        .swal-purple-popup { border: 1px solid rgba(167, 139, 250, 0.4) !important; box-shadow: 0 0 25px rgba(167, 139, 250, 0.15) !important; }

        .btn-action {
          background-color: transparent;
          border: none;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-delete {
          color: #EF4444;
        }
        .btn-delete:hover {
          background-color: rgba(239, 68, 68, 0.15);
          transform: scale(1.1);
        }
        .btn-start {
          color: #A78BFA; /* Morado ligeramente más claro para destacar los íconos */
        }
        .btn-start:hover {
          background-color: rgba(139, 92, 246, 0.15);
          transform: scale(1.1);
        }
        
        /* ESTILO MORADO MEJORADO PARA EL BACKLOG */
        .badge-atrasado {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: rgba(139, 92, 246, 0.1); 
          color: #A78BFA; 
          padding: 6px 10px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8rem;
          border: 1px solid rgba(139, 92, 246, 0.25);
          white-space: nowrap; /* Evita que el texto se rompa */
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .badge-atrasado:hover {
          background-color: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.4);
        }
        .badge-atrasado span {
          overflow: hidden;
          text-overflow: ellipsis;
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
        /* search-bar: estilos movidos a index.css */
      `}</style>

      <h2 className="title" style={{ color: '#3ea6ff', marginBottom: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><Hourglass size={22} />Temporadas Atrasadas</h2>

      {!loading && animesAtrasados.length > 0 && (
        <div className="search-bar-container">
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Buscar para ponerte al día..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: '#8B5CF6' }}>
          <Loader2 size={40} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : animesAtrasados.length === 0 ? (
        <div className="empty-state">
          <History size={60} style={{ marginBottom: '15px', opacity: 0.5 }} />
          <h3>No tienes temporadas pendientes</h3>
          <p>Llevas tu lista perfectamente al día. ¡Felicidades!</p>
        </div>
      ) : animesFiltrados.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron resultados</h3>
          <p>Prueba buscando con otro nombre.</p>
        </div>
      ) : (
        <div className="anime-grid">
          {animesFiltrados.map((anime) => (
            <div key={anime.id} className="anime-card" style={{ display: 'flex', flexDirection: 'column' }}>
              
              <img src={anime.imagen} alt={anime.titulo} />
              
              <div className="anime-info" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                
                <div style={{ fontSize: '0.8rem', color: '#A78BFA', fontWeight: 'bold', marginBottom: '5px' }}>
                  En lista de espera
                </div>

                <h3 className="anime-title" style={{ marginBottom: 'auto' }}>{anime.titulo}</h3>
                
                {/* CONTENEDOR AJUSTADO PARA EVITAR QUE SE APLASTEN LOS ELEMENTOS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', gap: '8px' }}>
                  
                  {/* BADGE DE CAPÍTULOS */}
                  <div className="badge-atrasado" title={anime.episodios_totales > 0 ? `${anime.episodios_totales} capítulos pendientes por ver` : 'En emisión'}>
                    <Layers size={14} style={{ flexShrink: 0 }} />
                    <span>{anime.episodios_totales > 0 ? `${anime.episodios_totales} caps` : 'Emisión'}</span>
                  </div>

                  {/* BOTONES CON flexShrink: 0 PARA PROTEGER SU ESPACIO */}
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    <button 
                      className="btn-action btn-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        empezarTemporada(anime.id, anime.titulo);
                      }}
                      title="Empezar a ver (Mover a Viendo)"
                    >
                      <MonitorPlay size={20} />
                    </button>

                    <button 
                      className="btn-action btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarAnime(anime.id, anime.titulo);
                      }}
                      title="Eliminar de la lista"
                    >
                      <Trash2 size={20} />
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

export default Atrasados;