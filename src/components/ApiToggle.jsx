import React from 'react';

/**
 * Toggle AniList ↔ MAL — estilo switch deslizante
 * value: 'anilist' | 'jikan'
 */
const ApiToggle = ({ value, onChange }) => {
  const isMAL = value === 'jikan';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{
        fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.4px',
        color: !isMAL ? '#3ea6ff' : 'var(--text-muted)',
        transition: 'color 0.25s', userSelect: 'none',
      }}>AniList</span>

      {/* Switch deslizante */}
      <div
        onClick={() => onChange(isMAL ? 'anilist' : 'jikan')}
        style={{
          width: 46, height: 26, borderRadius: 999, cursor: 'pointer',
          position: 'relative', transition: 'background 0.3s',
          background: isMAL ? '#f87171' : '#3ea6ff',
          boxShadow: isMAL ? '0 0 10px rgba(248,113,113,.4)' : '0 0 10px rgba(62,166,255,.4)',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3,
          left: isMAL ? 'calc(100% - 23px)' : '3px',
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,.3)',
          transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      <span style={{
        fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.4px',
        color: isMAL ? '#f87171' : 'var(--text-muted)',
        transition: 'color 0.25s', userSelect: 'none',
      }}>MAL</span>
    </div>
  );
};

export default ApiToggle;