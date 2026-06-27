import React from 'react';
import Switch from './Switch';

const ApiToggle = ({ value, onChange }) => {
  const isJikan = value === 'jikan';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.5px',
        color: !isJikan ? '#3ea6ff' : 'rgba(255,255,255,0.25)',
        transition: 'color 0.25s',
        userSelect: 'none',
      }}>
        AniList
      </span>

      <Switch
        checked={isJikan}
        onChange={e => onChange(e.target.checked ? 'jikan' : 'anilist')}
      />

      <span style={{
        fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.5px',
        color: isJikan ? '#f87171' : 'rgba(255,255,255,0.25)',
        transition: 'color 0.25s',
        userSelect: 'none',
      }}>
        MAL
      </span>
    </div>
  );
};

export default ApiToggle;
