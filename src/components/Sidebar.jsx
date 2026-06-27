import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass, PlayCircle, CheckSquare, PauseCircle, Clock,
  ListTodo, Trophy, BarChart2, Skull, Sun, Moon, ImageIcon, X, LogOut,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { theme, toggleTheme, bgImage, handleBgImageUpload, clearBgImage } = useTheme();
  const { logout } = useAuth();
  const fileInputRef = useRef(null);

  const menuItems = [
    { name: 'Explorar',     path: '/',            icon: <Compass size={20} /> },
    { name: 'Viendo',       path: '/viendo',      icon: <PlayCircle size={20} /> },
    { name: 'Completados',  path: '/completados', icon: <CheckSquare size={20} /> },
    { name: 'Pausados',     path: '/pausados',    icon: <PauseCircle size={20} /> },
    { name: 'Atrasados',    path: '/atrasados',   icon: <Clock size={20} /> },
    { name: 'Pendientes',   path: '/pendientes',  icon: <ListTodo size={20} /> },
    { name: 'Dropeados',    path: '/dropeados',   icon: <Skull size={20} /> },
    { name: 'Top Personal', path: '/top',         icon: <Trophy size={20} /> },
    { name: 'Estadísticas', path: '/estadisticas',icon: <BarChart2 size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <h1>Mi Anime List</h1>

      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-settings">
        <button className="sidebar-btn" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        </button>

        <label className="sidebar-btn" style={{ cursor: 'pointer' }}>
          <ImageIcon size={16} />
          Fondo personalizado
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleBgImageUpload(e.target.files[0])}
          />
        </label>

        {bgImage && (
          <button className="sidebar-btn danger" onClick={clearBgImage}>
            <X size={16} />
            Quitar fondo
          </button>
        )}

        <button className="sidebar-btn danger" onClick={logout} style={{ marginTop: '4px' }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
