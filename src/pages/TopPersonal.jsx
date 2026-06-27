import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Star, Award, Loader2, Plus, X, Flame, Search, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';

const TopPersonal = () => {
  const [topAnimes, setTopAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animesDisponibles, setAnimesDisponibles] = useState([]);
  const [modalSearch, setModalSearch] = useState('');
  const [animeSeleccionado, setAnimeSeleccionado] = useState(null);
  const [puestoInput, setPuestoInput] = useState('');
  const [notaInput, setNotaInput] = useState('');

  const fetchTop = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anime_list')
        .select('*')
        .not('ranking', 'is', null)
        .order('ranking', { ascending: true })
        .order('calificacion', { ascending: false });

      if (error) throw error;
      setTopAnimes(data || []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTop();
  }, []);

  const abrirModalCoronar = async () => {
    const { data } = await supabase
      .from('anime_list')
      .select('*')
      .is('ranking', null)
      .eq('estado', 'completado')
      .order('titulo', { ascending: true });

    if (!data || data.length === 0) {
      return Swal.fire({ 
        title: 'Lista vacía', 
        text: 'No tienes animes completados disponibles para coronar.', 
        icon: 'info', 
        background: '#1a1a1a', 
        color: '#fff',
        confirmButtonColor: '#F59E0B',
        customClass: { popup: 'swal-premium-info' } // <-- Añadido
      });
    }

    setAnimesDisponibles(data);
    setAnimeSeleccionado(null);
    setPuestoInput('');
    setNotaInput('');
    setModalSearch('');
    setIsModalOpen(true);
  };

  const guardarEnTop = async () => {
    if (!animeSeleccionado || !puestoInput || !notaInput) {
      Swal.fire({ 
        title: 'Faltan datos', 
        text: 'Selecciona un anime, su puesto y su nota.', 
        icon: 'warning', 
        background: '#1a1a1a', 
        color: '#fff', 
        timer: 2000,
        customClass: { popup: 'swal-premium-warning' } // <-- Añadido
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('anime_list')
        .update({ 
          ranking: parseInt(puestoInput), 
          calificacion: parseFloat(notaInput)
        })
        .eq('id', animeSeleccionado.id);

      if (error) throw error;

      setIsModalOpen(false);
      Swal.fire({ 
        title: '¡Coronado!', 
        icon: 'success', 
        background: '#1a1a1a', 
        color: '#fff', 
        timer: 1500, 
        showConfirmButton: false,
        customClass: { popup: 'swal-premium-success' } // <-- Añadido
      });
      fetchTop();
    } catch (error) {
      console.error(error.message);
    }
  };

  const quitarDelTop = async (id, titulo) => {
    const { isConfirmed } = await Swal.fire({
      title: `¿Quitar a ${titulo}?`,
      text: "Saldrá de tu Top Personal, pero seguirá en Completados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      background: '#1a1a1a',
      color: '#ffffff',
      customClass: { popup: 'swal-premium-danger' } // <-- Añadido
    });

    if (isConfirmed) {
      await supabase.from('anime_list').update({ ranking: null }).eq('id', id);
      fetchTop();
    }
  };

  const getPodiumStyle = (puesto) => {
    if (puesto === 1) return { badgeClass: 'rank-gold', label: '#1 ORO', color: '#FBBF24' };
    if (puesto === 2) return { badgeClass: 'rank-silver', label: '#2 PLATA', color: '#94A3B8' };
    if (puesto === 3) return { badgeClass: 'rank-bronze', label: '#3 BRONCE', color: '#CD7F32' };
    return { badgeClass: 'rank-normal', label: `#${puesto}`, color: '#a1a1aa' };
  };

  const animesFiltrados = topAnimes.filter(anime => anime.titulo.toLowerCase().includes(busqueda.toLowerCase()));
  const disponiblesFiltrados = animesDisponibles.filter(anime => anime.titulo.toLowerCase().includes(modalSearch.toLowerCase()));

  return (
    <div style={{ paddingBottom: '40px', maxWidth: '1600px', margin: '0 auto' }}>
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
          border: 1px solid rgba(245, 158, 11, 0.4) !important;
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.15) !important;
        }
        .swal-premium-info {
          border: 1px solid rgba(62, 166, 255, 0.4) !important;
          box-shadow: 0 0 30px rgba(62, 166, 255, 0.15) !important;
        }
        /* ----------------------------------------------- */

        /* =========================================
           SISTEMA DE GRID - ALINEADO A LA IZQUIERDA
           ========================================= */
        .anime-grid {
          display: grid;
          /* auto-fill crea las columnas y si sobran espacios se quedan vacíos, anclando todo a la izquierda */
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 25px;
          padding: 20px 0;
          justify-content: start; 
        }

        /* =========================================
           TARJETA PRINCIPAL (CARD)
           ========================================= */
        .anime-card {
          display: flex;
          flex-direction: column;
          background-color: #1f1f1f;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .anime-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.6);
          border-color: rgba(245, 158, 11, 0.3); /* Brillo dorado suave al pasar el mouse */
        }

        .anime-poster {
          width: 100%;
          aspect-ratio: 2 / 3;
          object-fit: cover;
          display: block;
        }

        .anime-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          padding: 16px;
          background: linear-gradient(to bottom, #1f1f1f 0%, #151515 100%);
        }

        .anime-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 15px 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* =========================================
           BADGES Y CONTROLES DE LA TARJETA
           ========================================= */
        .rank-gold { background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.25)); color: #FBBF24; border: 1px solid rgba(251, 191, 36, 0.4); box-shadow: 0 0 10px rgba(251, 191, 36, 0.1); }
        .rank-silver { background: linear-gradient(135deg, rgba(226, 232, 240, 0.1), rgba(148, 163, 184, 0.2)); color: #CBD5E1; border: 1px solid rgba(148, 163, 184, 0.3); }
        .rank-bronze { background: linear-gradient(135deg, rgba(253, 186, 116, 0.1), rgba(202, 138, 4, 0.2)); color: #FDBA74; border: 1px solid rgba(202, 138, 4, 0.3); }
        .rank-normal { background: rgba(255, 255, 255, 0.03); color: rgba(255, 255, 255, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); }
        
        .badge-rank { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .remove-btn { background: rgba(239, 68, 68, 0.05); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); width: 28px; height: 28px; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .remove-btn:hover { background: #EF4444; color: white; transform: scale(1.05); }

        /* =========================================
           ENCABEZADO Y BÚSQUEDA
           ========================================= */
        .top-title { color: #3ea6ff; font-size: 1.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        
        .btn-add-top { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom: 25px; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2); }
        .btn-add-top:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(245, 158, 11, 0.4); filter: brightness(1.1); }

        .search-bar-container { position: relative; max-width: 350px; margin-bottom: 25px; }
        .search-bar-input { width: 100%; padding: 12px 16px 12px 42px; background-color: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; color: white; font-size: 0.95rem; outline: none; transition: all 0.3s ease; }
        .search-bar-input:focus { border-color: #F59E0B; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2); }
        .search-bar-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255, 255, 255, 0.4); }

        /* =========================================
           MODAL MEJORADO
           ========================================= */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
        .modal-content { background: #18181b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; width: 100%; max-width: 480px; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); display: flex; flex-direction: column; gap: 18px; animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 5px; }
        .modal-header h3 { margin: 0; color: #fff; font-size: 1.4rem; display: flex; align-items: center; gap: 10px; font-weight: 700; }
        
        .btn-close { background: rgba(255,255,255,0.05); border: none; color: #aaa; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 8px; }
        .btn-close:hover { color: #fff; background: rgba(239, 68, 68, 0.8); transform: rotate(90deg); }
        
        .modal-list-container { max-height: 240px; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 8px; margin-top: 5px; }
        .modal-list-container::-webkit-scrollbar { width: 8px; }
        .modal-list-container::-webkit-scrollbar-track { background: transparent; }
        .modal-list-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        .modal-list-container::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        
        .modal-item { padding: 14px 16px; border-radius: 8px; cursor: pointer; color: #d4d4d8; font-size: 0.95rem; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .modal-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .modal-item.selected { background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 600; box-shadow: inset 0 0 15px rgba(245, 158, 11, 0.05); }
        
        .modal-inputs { display: flex; gap: 20px; margin-top: 10px; }
        .modal-input-group { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .modal-input-group label { color: #a1a1aa; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .modal-input { background: #111; border: 1px solid rgba(255,255,255,0.1); padding: 12px 16px; border-radius: 10px; color: white; outline: none; transition: all 0.3s; font-size: 1rem; }
        .modal-input:focus { border-color: #F59E0B; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15); background: #1a1a1a; }
        
        .btn-save-modal { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border: none; padding: 16px; border-radius: 10px; font-weight: 800; cursor: pointer; margin-top: 15px; transition: all 0.2s; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2); }
        .btn-save-modal:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4); filter: brightness(1.1); }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 className="top-title">
          MI TOP PERSONAL <Award color="#FBBF24" size={28} />
        </h2>
        <button className="btn-add-top" onClick={abrirModalCoronar}>
          <Plus size={20} strokeWidth={2.5} /> Coronar Anime
        </button>
      </div>

      {!loading && topAnimes.length > 0 && (
        <div className="search-bar-container">
          <Search size={18} className="search-bar-icon" />
          <input type="text" className="search-bar-input" placeholder="Filtrar tus joyas..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: '#FBBF24' }}>
          <Loader2 size={45} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : topAnimes.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', color: '#a1a1aa', textAlign: 'center' }}>
          <Award size={70} style={{ marginBottom: '20px', opacity: 0.3 }} />
          <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '10px' }}>Aún no tienes animes en tu Top</h3>
          <p style={{ fontSize: '1rem' }}>Dale al botón "Coronar Anime" para empezar a armar tu podio.</p>
        </div>
      ) : (
        <div className="anime-grid">
          {animesFiltrados.map((anime) => {
            const podium = getPodiumStyle(anime.ranking);
            return (
              <div key={anime.id} className="anime-card">
                <img className="anime-poster" src={anime.imagen} alt={anime.titulo} loading="lazy" />
                
                <div className="anime-info">
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className={`badge-rank ${podium.badgeClass}`}>
                      {anime.ranking <= 3 && <Flame size={14} fill={podium.color} />}
                      {podium.label}
                    </div>
                    
                    <button className="remove-btn" onClick={() => quitarDelTop(anime.id, anime.titulo)} title="Quitar del Top">
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  <h3 className="anime-title">{anime.titulo}</h3>
                  
                  {/* Contenedor flexible para empujar la nota hacia abajo si el título es corto */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: '500' }}>Nota oficial</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontWeight: '800', fontSize: '1.1rem' }}>
                      <span>{Number(anime.calificacion).toFixed(1)}</span>
                      <Star size={16} fill="#F59E0B" color="#F59E0B" /> 
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <h3>👑 Coronar Anime</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)} title="Cerrar"><X size={22} strokeWidth={2.5} /></button>
            </div>

            <div className="search-bar-container" style={{ margin: '0 0 10px 0', maxWidth: '100%' }}>
              <Search size={18} className="search-bar-icon" />
              <input type="text" className="search-bar-input" placeholder="Buscar en tu lista de completados..." value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} />
            </div>

            <div className="modal-list-container">
              {disponiblesFiltrados.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#71717a' }}>No se encontraron animes completados con ese nombre.</div>
              ) : (
                disponiblesFiltrados.map(anime => (
                  <div 
                    key={anime.id} 
                    className={`modal-item ${animeSeleccionado?.id === anime.id ? 'selected' : ''}`}
                    onClick={() => setAnimeSeleccionado(anime)}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                      {anime.titulo}
                    </span>
                    {animeSeleccionado?.id === anime.id && <CheckCircle2 size={18} strokeWidth={2.5} />}
                  </div>
                ))
              )}
            </div>

            <div className="modal-inputs">
              <div className="modal-input-group">
                <label>Puesto Exacto</label>
                <input type="number" className="modal-input" placeholder="Ej: 1" value={puestoInput} onChange={(e) => setPuestoInput(e.target.value)} min="1" />
              </div>
              <div className="modal-input-group">
                <label>Nota (1.0 - 10.0)</label>
                <input type="number" className="modal-input" placeholder="Ej: 9.5" value={notaInput} onChange={(e) => setNotaInput(e.target.value)} min="1" max="10" step="0.1" />
              </div>
            </div>

            <button className="btn-save-modal" onClick={guardarEnTop}>
              Guardar en el Top
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default TopPersonal;