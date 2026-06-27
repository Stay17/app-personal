import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Explorar from './pages/Explorar';
import Pendientes from './pages/Pendientes'; 
import Viendo from './pages/Viendo';
import Completados from './pages/Completados';
import Pausados from './pages/Pausados';
import Atrasados from './pages/Atrasados';
import TopPersonal from './pages/TopPersonal';
import DroppedAnimes from './pages/DroppedAnimes'; 
// 1. Importamos la nueva página de Estadísticas (Asegúrate de que el nombre del archivo sea exacto, por ejemplo Statistics.jsx)
import Statistics from './pages/Statistics'; 

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Explorar />} />
            <Route path="/pendientes" element={<Pendientes />} />
            <Route path="/viendo" element={<Viendo />} />
            <Route path="/completados" element={<Completados />} />
            <Route path="/pausados" element={<Pausados />} />
            <Route path="/atrasados" element={<Atrasados />} />
            <Route path="/top" element={<TopPersonal />} />
            <Route path="/dropeados" element={<DroppedAnimes />} />
            {/* 2. Añadimos la ruta para conectar el Sidebar con el componente */}
            <Route path="/estadisticas" element={<Statistics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;