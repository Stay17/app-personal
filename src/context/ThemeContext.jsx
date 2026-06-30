import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('app-bg-image') || '');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (bgImage) {
      document.body.style.backgroundImage = `url(${bgImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.classList.add('has-bg-image');
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      document.body.classList.remove('has-bg-image');
    }
  }, [bgImage]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleBgImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      try {
        localStorage.setItem('app-bg-image', base64);
        setBgImage(base64);
      } catch {
        setBgImage(base64); // aplica aunque no quepa en localStorage
      }
    };
    reader.readAsDataURL(file);
  };

  const clearBgImage = () => {
    localStorage.removeItem('app-bg-image');
    setBgImage('');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, bgImage, handleBgImageUpload, clearBgImage }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);