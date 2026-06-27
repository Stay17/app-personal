import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Explorar from './pages/Explorar';
import Pendientes from './pages/Pendientes';
import Viendo from './pages/Viendo';
import Completados from './pages/Completados';
import Pausados from './pages/Pausados';
import Atrasados from './pages/Atrasados';
import TopPersonal from './pages/TopPersonal';
import DroppedAnimes from './pages/DroppedAnimes';
import Statistics from './pages/Statistics';

function AppContent() {
  const { bgImage } = useTheme();
  const { authed }  = useAuth();

  if (!authed) return <Login />;

  return (
    <BrowserRouter>
      <div className="app-layout">
        {bgImage && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: -1,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }} />
        )}
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
            <Route path="/estadisticas" element={<Statistics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
