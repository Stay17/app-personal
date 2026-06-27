import React, { useState, useRef } from 'react';
import { Eye, EyeOff, LogIn, Tv2, ImageIcon, X, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AVATAR_KEY = 'app-avatar';

const Login = () => {
  const { login }                                              = useAuth();
  const { bgImage, handleBgImageUpload, clearBgImage }        = useTheme();
  const [username, setUsername] = useState('User');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [shaking, setShaking]   = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [avatar, setAvatar]     = useState(() => localStorage.getItem(AVATAR_KEY) || '');
  const fileRef                 = useRef(null);
  const avatarRef               = useRef(null);

  const handleAvatarChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target.result;
      try { localStorage.setItem(AVATAR_KEY, b64); } catch {}
      setAvatar(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = login(username.trim(), password);
    if (!ok) {
      setError('Usuario o contraseña incorrectos.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
    }}>
      <style>{`
        @keyframes shake {
          0%,100%{ transform: translateX(0); }
          20%    { transform: translateX(-8px); }
          40%    { transform: translateX(8px); }
          60%    { transform: translateX(-5px); }
          80%    { transform: translateX(5px); }
        }
        .login-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 48px 40px;
          width: 100%;
          max-width: 400px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
        }
        .login-card.shake { animation: shake 0.45s ease; }
        .login-input {
          width: 100%;
          padding: 13px 16px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-main);
          font-family: var(--font-main);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .login-label {
          display: block;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 7px;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          background: var(--accent-color);
          color: var(--text-on-accent);
          border: none;
          border-radius: 12px;
          font-family: var(--font-main);
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--accent-glow);
        }
        .login-btn:active { transform: translateY(0); }
        .pw-wrapper { position: relative; }
        .pw-eye {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          cursor: pointer;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          padding: 0;
        }
        .pw-eye:hover { color: var(--text-main); }
        .login-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.35);
          color: #f87171;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.84rem;
          font-weight: 600;
          text-align: center;
        }
        /* Botones de fondo en esquina inferior derecha */
        .login-bg-controls {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .login-bg-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 14px;
          border-radius: 10px;
          font-family: var(--font-main);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: var(--text-muted);
          transition: all 0.2s ease;
        }
        .login-bg-btn:hover {
          color: var(--text-main);
          border-color: var(--accent-color);
        }
        .login-bg-btn.danger:hover {
          color: #f87171;
          border-color: #f87171;
        }
      `}</style>

      {/* Tarjeta de login */}
      <div className={`login-card${shaking ? ' shake' : ''}`}>
        {/* Avatar / título */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          {/* Avatar circular — clickeable para cambiar */}
          <div
            role="button"
            tabIndex={0}
            title="Cambiar foto de perfil"
            onClick={() => avatarRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && avatarRef.current?.click()}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '84px', height: '84px',
              borderRadius: '50%',
              background: avatar
                ? 'transparent'
                : 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%)',
              marginBottom: '18px',
              boxShadow: '0 8px 28px var(--accent-glow)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              border: '2.5px solid var(--accent-color)',
              transition: 'box-shadow 0.2s, border-color 0.2s',
              outline: 'none',
            }}
          >
            {avatar
              ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Tv2 size={34} color="var(--text-on-accent)" />
            }
            {/* Overlay al hover */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: avatarHover ? 1 : 0,
              transition: 'opacity 0.2s',
            }}>
              <Camera size={20} color="#fff" />
            </div>
          </div>

          {/* File input oculto */}
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleAvatarChange(e.target.files[0])}
          />

          <h2 style={{
            color: 'var(--text-heading)',
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            margin: 0,
          }}>
            Mi Anime List
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '6px' }}>
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="login-label">Usuario</label>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoComplete="username"
              spellCheck={false}
            />
          </div>

          <div>
            <label className="login-label">Contraseña</label>
            <div className="pw-wrapper">
              <input
                className="login-input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                style={{ paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button type="button" className="pw-eye" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" style={{ marginTop: '4px' }}>
            <LogIn size={17} />
            Entrar
          </button>
        </form>
      </div>

      {/* Controles de fondo — esquina inferior derecha */}
      <div className="login-bg-controls">
        {bgImage && (
          <button className="login-bg-btn danger" onClick={clearBgImage}>
            <X size={14} />
            Quitar fondo
          </button>
        )}
        <label className="login-bg-btn" style={{ cursor: 'pointer' }}>
          <ImageIcon size={14} />
          {bgImage ? 'Cambiar fondo' : 'Poner fondo'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleBgImageUpload(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
};

export default Login;
