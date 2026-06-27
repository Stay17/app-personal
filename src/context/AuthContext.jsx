import React, { createContext, useContext, useState } from 'react';

const CREDENTIALS = { username: 'User', password: 'Acuario17' };
const SESSION_KEY  = 'app-session';
const SESSION_MS   = 30 * 24 * 60 * 60 * 1000; // 30 días

function sessionValid() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { expiresAt } = JSON.parse(raw);
    return Date.now() < expiresAt;
  } catch {
    return false;
  }
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authed, setAuthed] = useState(() => sessionValid());

  const login = (username, password) => {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      const expiresAt = Date.now() + SESSION_MS;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt }));
      setAuthed(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
