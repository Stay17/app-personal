import React, { useState, useEffect } from 'react';
  import { supabase } from '../supabase';
  import Swal from 'sweetalert2';
  import { MessageSquare, Layers, Trash2, Edit3, Skull, Search } from 'lucide-react';

  const DroppedAnimes = () => {
    const [droppedList, setDroppedList] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [query, setQuery]             = useState('');

    const fetchDroppedAnimes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('anime_list')
          .select('*')
          .eq('estado', 'dropeado')
          .order('fecha_agregado', { ascending: false });
          
        if (error) throw error;
        setDroppedList(data || []);
      } catch (error) {
        console.error('Error al cargar dropeados:', error.message);
        Swal.fire({ 
          title: 'Error', 
          text: 'No se pudieron cargar tus animes dropeados.', 
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

    useEffect(() => { fetchDroppedAnimes(); }, []);

    const filtered = droppedList.filter(a =>
      a.titulo.toLowerCase().includes(query.toLowerCase())
    );

    // ── FUNCIÓN 1: ACTUALIZAR SOLO EL EPISODIO (CON VALIDACIÓN) ──
    const handleUpdateEpisode = async (anime) => {
      const { value: newEpisode } = await Swal.fire({
        title: 'Actualizar Episodio',
        background: 'var(--bg-card-solid, #1a1a1a)',
        color: 'var(--text-main, #fff)',
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: { popup: 'swal-info-popup' },
        html: `
          <div style="display:flex;flex-direction:column;gap:14px;text-align:left;margin-top:10px;">
            <p style="color: var(--text-muted);font-size:0.85rem;margin:0;">Estás editando: <strong style="color: var(--text-main);">${anime.titulo}</strong></p>
            <label style="color: var(--text-muted);font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Episodio en el que lo dejaste</label>
            <input 
              id="swal-ep-quick" 
              type="number" 
              min="0" 
              ${anime.episodios_totales ? `max="${anime.episodios_totales}"` : ''}
              class="swal2-input" 
              value="${anime.episodio_actual || 0}"
              style="margin:0;background: var(--border-subtle);color: var(--text-main);border:1px solid rgba(62,166,255,0.25);border-radius:8px;"
            >
            ${anime.episodios_totales ? `<span style="color: var(--text-muted);font-size:0.75rem;">Límite de episodios: ${anime.episodios_totales}</span>` : ''}
          </div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#3ea6ff',
        cancelButtonColor: '#222',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const inputVal = document.getElementById('swal-ep-quick').value;
          const epInt = parseInt(inputVal, 10);
          
          if (isNaN(epInt) || epInt < 0) {
            Swal.showValidationMessage('Ingresa un número válido (mínimo 0).');
            return false;
          }
          // Validación de tope de episodios
          if (anime.episodios_totales && epInt > anime.episodios_totales) {
            Swal.showValidationMessage(`El anime solo tiene ${anime.episodios_totales} episodios.`);
            return false;
          }
          return epInt;
        }
      });

      if (newEpisode !== undefined) {
        setDroppedList(prev => prev.map(a => 
          a.id === anime.id ? { ...a, episodio_actual: newEpisode } : a
        ));

        try {
          const { error } = await supabase
            .from('anime_list')
            .update({ episodio_actual: newEpisode })
            .eq('id', anime.id);

          if (error) throw error;
        } catch (error) {
          console.error('Error al actualizar episodio:', error.message);
          fetchDroppedAnimes();
          Swal.fire({ 
            toast: true, position: 'top-end', icon: 'error', 
            title: 'Error de conexión', showConfirmButton: false, timer: 3000, 
            background: 'var(--bg-card-solid, #1a1a1a)', color: 'var(--text-main, #fff)' 
          });
        }
      }
    };

    const verMotivo = (anime) => {
      Swal.fire({
        title: anime.titulo,
        html: `
          <p style="color: var(--text-muted);font-size:0.72rem;margin:0 0 12px;text-transform:uppercase;letter-spacing:1.4px;font-weight:700;">
            Por qué lo dropeaste
          </p>
          <p style="color: var(--text-main);font-size:0.96rem;line-height:1.75;font-style:italic;margin:0;padding:14px 16px;background: var(--border-subtle);border-radius:10px;border-left:3px solid #3ea6ff;">
            ${anime.comentario_dropeo ? `"${anime.comentario_dropeo}"` : 'Sin comentarios registrados.'}
          </p>`,
        background: 'var(--bg-card-solid, #1a1a1a)',
        color: 'var(--text-main, #fff)',
        confirmButtonColor: '#3ea6ff',
        confirmButtonText: 'Cerrar',
        backdrop: 'rgba(0,0,0,0.8)',
        width: '420px',
        customClass: { popup: 'swal-info-popup' }
      });
    };

    // ── FUNCIÓN 2: MODAL GENERAL DE EDITAR (AHORA CON VALIDACIÓN DE LÍMITE) ──
    const handleEdit = async (anime) => {
      const { value: formValues } = await Swal.fire({
        title: 'Editar detalles',
        background: 'var(--bg-card-solid, #1a1a1a)',
        color: 'var(--text-main, #fff)',
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: { popup: 'swal-info-popup' },
        html: `
          <div style="display:flex;flex-direction:column;gap:14px;text-align:left;margin-top:10px;">
            <label style="color: var(--text-muted);font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Episodios vistos</label>
            <input 
              id="swal-ep" 
              type="number" 
              min="0" 
              ${anime.episodios_totales ? `max="${anime.episodios_totales}"` : ''}
              class="swal2-input" 
              value="${anime.episodio_actual || 0}"
              style="margin:0;background: var(--border-subtle);color: var(--text-main);border:1px solid rgba(62,166,255,0.25);border-radius:8px;"
            >
            ${anime.episodios_totales ? `<span style="color: var(--text-muted);font-size:0.75rem;margin-top:-4px;">Límite de episodios: ${anime.episodios_totales}</span>` : ''}
            
            <label style="color: var(--text-muted);font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Motivo del dropeo</label>
            <textarea id="swal-note" class="swal2-textarea"
              style="margin:0;background: var(--border-subtle);color: var(--text-main);border:1px solid rgba(62,166,255,0.25);border-radius:8px;resize:vertical;min-height:90px;"
            >${anime.comentario_dropeo || ''}</textarea>
          </div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#3ea6ff',
        cancelButtonColor: '#222',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const epVal = document.getElementById('swal-ep').value;
          const epInt = parseInt(epVal, 10);
          const noteVal = document.getElementById('swal-note').value;

          if (isNaN(epInt) || epInt < 0) {
            Swal.showValidationMessage('Ingresa un número válido de episodios (mínimo 0).');
            return false;
          }

          // CANDADO AGREGADO AQUÍ: Validamos que no supere el total
          if (anime.episodios_totales && epInt > anime.episodios_totales) {
            Swal.showValidationMessage(`El anime solo tiene ${anime.episodios_totales} episodios.`);
            return false;
          }

          return {
            episodio_actual: epInt,
            comentario_dropeo: noteVal,
          };
        },
      });

      if (formValues) {
        try {
          const { error } = await supabase
            .from('anime_list')
            .update({
              episodio_actual: formValues.episodio_actual,
              comentario_dropeo: formValues.comentario_dropeo,
            })
            .eq('id', anime.id);

          if (error) throw error;

          Swal.fire({ 
            icon: 'success', 
            title: 'Actualizado', 
            background: 'var(--bg-card-solid, #1a1a1a)', 
            color: 'var(--text-main, #fff)', 
            showConfirmButton: false, 
            timer: 1400,
            backdrop: 'rgba(0,0,0,0.8)',
            customClass: { popup: 'swal-success-popup' }
          });
          fetchDroppedAnimes();
        } catch (error) {
          console.error('Error al actualizar:', error.message);
          Swal.fire({ 
            title: 'Error', 
            text: 'No se pudo actualizar la información.', 
            icon: 'error', 
            background: 'var(--bg-card-solid, #1a1a1a)', 
            color: 'var(--text-main, #fff)',
            backdrop: 'rgba(0,0,0,0.8)',
            customClass: { popup: 'swal-error-popup' }
          });
        }
      }
    };

    const handleDelete = async (id) => {
      const result = await Swal.fire({
        title: '¿Eliminar del cementerio?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        background: 'var(--bg-card-solid, #1a1a1a)',
        color: 'var(--text-main, #fff)',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#222',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: { popup: 'swal-delete-popup' }
      });

      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('anime_list').delete().eq('id', id);
          if (error) throw error;
          
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
          fetchDroppedAnimes();
        } catch (error) {
          console.error('Error al eliminar:', error.message);
        }
      }
    };

    return (
      <div>
        <style>{`
          /* SWEETALERT PREMIUM STYLES */
          .swal-success-popup { border: 1px solid rgba(16, 185, 129, 0.4) !important; box-shadow: 0 0 25px rgba(16, 185, 129, 0.15) !important; }
          .swal-delete-popup { border: 1px solid rgba(239, 68, 68, 0.4) !important; box-shadow: 0 0 25px rgba(239, 68, 68, 0.15) !important; }
          .swal-error-popup { border: 1px solid rgba(239, 68, 68, 0.4) !important; box-shadow: 0 0 25px rgba(239, 68, 68, 0.15) !important; }
          .swal-info-popup { border: 1px solid rgba(62, 166, 255, 0.4) !important; box-shadow: 0 0 25px rgba(62, 166, 255, 0.15) !important; }

          @keyframes spin { to { transform:rotate(360deg); } }
          @keyframes fadeUp {
            from { opacity:0; transform:translateY(16px); }
            to   { opacity:1; transform:translateY(0); }
          }

          /* ── Buscador ── */
          .dg-search-wrap {
            position: relative;
            width: 280px;
            margin-bottom: 28px;
          }
          .dg-search-icon {
            position: absolute;
            left: 13px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            pointer-events: none;
            display: flex;
            align-items: center;
          }
          .dg-search-input {
            width: 100%;
            background: var(--bg-input);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 10px 14px 10px 38px;
            color: var(--text-main);
            font-size: 0.88rem;
            outline: none;
            transition: border-color 0.2s ease, background 0.2s ease;
            box-sizing: border-box;
          }
          .dg-search-input::placeholder { color: var(--text-muted); }
          .dg-search-input:focus {
            border-color: rgba(62,166,255,0.4);
            background: rgba(62,166,255,0.04);
          }

          /* ── Grid ── */
          .dg-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
            gap: 24px;
          }

          /* ── Card ── */
          .dg-card {
            display: flex;
            flex-direction: column;
            border-radius: 14px;
            overflow: hidden;
            background: var(--bg-card-solid);
            border: 1px solid var(--border-color);
            animation: fadeUp 0.35s ease both;
            transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
          }
          .dg-card:hover {
            transform: translateY(-7px);
            border-color: var(--accent-color);
            box-shadow: 0 20px 55px rgba(0,0,0,0.5), 0 0 0 1px rgba(62,166,255,0.08);
          }

          /* ── Poster ── */
          .dg-poster {
            width: 100%;
            aspect-ratio: 2 / 3;
            overflow: hidden;
            background: var(--bg-secondary);
            flex-shrink: 0;
            position: relative;
          }
          .dg-poster img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center top;
            display: block;
            transition: transform 0.45s ease;
          }
          .dg-card:hover .dg-poster img { transform: scale(1.05); }
          .dg-poster::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 35%;
            background: linear-gradient(to top, var(--bg-card-solid) 0%, transparent 100%);
            pointer-events: none;
          }

          /* ── Cuerpo ── */
          .dg-body {
            padding: 14px 14px 15px;
            display: flex;
            flex-direction: column;
            gap: 11px;
            flex-grow: 1;
          }

          /* Título */
          .dg-title {
            font-size: 0.94rem;
            font-weight: 700;
            color: var(--text-heading);
            margin: 0;
            line-height: 1.38;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* ── Fila meta ── */
          .dg-meta-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          /* Badge caps */
          .dg-cap {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: rgba(62,166,255,0.1);
            border: 1px solid rgba(62,166,255,0.2);
            color: #3ea6ff;
            font-size: 0.73rem;
            font-weight: 700;
            padding: 4px 11px;
            border-radius: 20px;
            white-space: nowrap;
            letter-spacing: 0.1px;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s;
          }
          .dg-cap:hover {
            background: rgba(62,166,255,0.18);
            border-color: rgba(62,166,255,0.4);
          }

          /* Badge nota */
          .dg-note-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.69rem;
            font-weight: 600;
            letter-spacing: 0.2px;
          }
          .dg-note-badge.has-note { color: #3ea6ff; }
          .dg-note-badge.no-note  { color: var(--text-muted); }
          .dg-dot {
            width: 5px; height: 5px;
            border-radius: 50%;
            flex-shrink: 0;
          }
          .has-note .dg-dot { background: #3ea6ff; opacity: 0.8; }
          .no-note  .dg-dot { background: var(--border-color); }

          /* Divisor */
          .dg-divider {
            height: 1px;
            background: var(--border-subtle);
            flex-shrink: 0;
          }

          /* ── Botones ── */
          .dg-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: auto;
          }

          .dg-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 0;
            border-radius: 9px;
            font-size: 0.79rem;
            font-weight: 700;
            letter-spacing: 0.2px;
            cursor: pointer;
            border: 1px solid;
            transition: all 0.18s ease;
            width: 100%;
            line-height: 1;
          }
          .dg-btn:active { transform: scale(0.97) !important; box-shadow: none !important; }

          .dg-btn-motivo {
            background: var(--bg-input);
            color: var(--text-muted);
            border-color: var(--border-subtle);
          }
          .dg-btn-motivo:hover {
            background: var(--bg-input-hover);
            color: var(--text-main);
            border-color: var(--border-color);
            transform: translateY(-1px);
          }

          .dg-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .dg-btn-edit {
            background: rgba(62,166,255,0.08);
            color: #3ea6ff;
            border-color: rgba(62,166,255,0.22);
          }
          .dg-btn-edit:hover {
            background: rgba(62,166,255,0.18);
            border-color: rgba(62,166,255,0.5);
            box-shadow: 0 0 14px rgba(62,166,255,0.13);
            transform: translateY(-1px);
          }

          .dg-btn-del {
            background: rgba(239,68,68,0.08);
            color: #ef4444;
            border-color: rgba(239,68,68,0.22);
          }
          .dg-btn-del:hover {
            background: rgba(239,68,68,0.18);
            border-color: rgba(239,68,68,0.5);
            box-shadow: 0 0 14px rgba(239,68,68,0.13);
            transform: translateY(-1px);
          }

          /* ── Estados vacío / loading ── */
          .dg-loading, .dg-empty {
            display:flex; flex-direction:column; align-items:center;
            justify-content:center; padding:90px 20px; gap:18px;
          }
          .dg-spinner {
            width:32px; height:32px;
            border:2.5px solid rgba(62,166,255,0.1);
            border-top-color:#3ea6ff;
            border-radius:50%;
            animation:spin 0.8s linear infinite;
          }
          .dg-loading p, .dg-empty p { font-size:0.88rem; color:var(--text-muted); margin:0; }

          /* Sin resultados de búsqueda */
          .dg-no-results {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px 20px;
            gap: 12px;
            color: var(--text-muted);
            font-size: 0.88rem;
          }
          .dg-no-results span { color: var(--text-muted); font-size: 0.82rem; }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <h2 className="title" style={{ color: '#3ea6ff', fontWeight: 800, margin: 0 }}>CEMENTERIO DE ANIMES</h2>
          <Skull size={22} color="#3ea6ff" />
        </div>

        {/* Buscador */}
        {!loading && droppedList.length > 0 && (
          <div className="dg-search-wrap">
            <span className="dg-search-icon">
              <Search size={15} />
            </span>
            <input
              className="dg-search-input"
              type="text"
              placeholder="Buscar en dropeados..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <div className="dg-loading">
            <div className="dg-spinner" />
            <p>Cargando registros...</p>
          </div>
        ) : droppedList.length === 0 ? (
          <div className="dg-empty">
            <Skull size={46} color="var(--border-color)" />
            <p>No tienes animes dropeados aún.</p>
          </div>
        ) : (
          <div className="dg-grid">
            {filtered.length === 0 ? (
              <div className="dg-no-results">
                <Search size={32} color="var(--border-color)" />
                <p>Sin resultados para "<strong style={{color: 'var(--text-muted)'}}>{query}</strong>"</p>
                <span>Intenta con otro nombre</span>
              </div>
            ) : (
              filtered.map((anime, i) => (
                <div
                  key={anime.id}
                  className="dg-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {/* Poster */}
                  <div className="dg-poster">
                    <img src={anime.imagen} alt={anime.titulo} />
                  </div>

                  {/* Cuerpo */}
                  <div className="dg-body">
                    <h3 className="dg-title">{anime.titulo}</h3>

                    <div className="dg-meta-row">
                      {/* Badge original convertido en botón clickeable */}
                      <span 
                        className="dg-cap" 
                        onClick={() => handleUpdateEpisode(anime)}
                        title="Haz clic para actualizar el episodio"
                      >
                        <Layers size={11} />
                        Cap. {anime.episodio_actual} / {anime.episodios_totales || '?'}
                      </span>
                      
                      <span className={`dg-note-badge ${anime.comentario_dropeo ? 'has-note' : 'no-note'}`}>
                        <span className="dg-dot" />
                        {anime.comentario_dropeo ? 'Con nota' : 'Sin nota'}
                      </span>
                    </div>

                    <div className="dg-divider" />

                    <div className="dg-actions">
                      <button className="dg-btn dg-btn-motivo" onClick={() => verMotivo(anime)}>
                        <MessageSquare size={13} />
                        Ver motivo del dropeo
                      </button>
                      <div className="dg-row">
                        <button className="dg-btn dg-btn-edit" onClick={() => handleEdit(anime)}>
                          <Edit3 size={12} /> Editar
                        </button>
                        <button className="dg-btn dg-btn-del" onClick={() => handleDelete(anime.id)}>
                          <Trash2 size={12} /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  export default DroppedAnimes;