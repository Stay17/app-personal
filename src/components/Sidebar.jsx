import React from 'react';
import { NavLink } from 'react-router-dom';
// Añadimos el ícono 'Skull' a las importaciones
import { Compass, PlayCircle, CheckSquare, PauseCircle, Clock, ListTodo, Trophy, BarChart2, Skull } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Explorar', path: '/', icon: <Compass size={20} /> },
    { name: 'Viendo', path: '/viendo', icon: <PlayCircle size={20} /> },
    { name: 'Completados', path: '/completados', icon: <CheckSquare size={20} /> },
    { name: 'Pausados', path: '/pausados', icon: <PauseCircle size={20} /> },
    { name: 'Atrasados', path: '/atrasados', icon: <Clock size={20} /> },
    { name: 'Pendientes', path: '/pendientes', icon: <ListTodo size={20} /> },
    // Aquí agregamos la nueva opción para Dropeados
    { name: 'Dropeados', path: '/dropeados', icon: <Skull size={20} /> }, 
    { name: 'Top Personal', path: '/top', icon: <Trophy size={20} /> },
    { name: 'Estadísticas', path: '/estadisticas', icon: <BarChart2 size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <h1>Mi Anime List</h1>
      <nav>
        {menuItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;