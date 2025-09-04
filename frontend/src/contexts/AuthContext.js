import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

// Buat context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Simpan data user (misal id, name, role)
  const [loading, setLoading] = useState(true); // Loading saat cek token
  const [error, setError] = useState(null);

  // Fungsi untuk cek token dan ambil data user dari backend
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Contoh API untuk ambil data user (buat endpoint di backend jika belum ada)
      const res = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error('Auth check failed', err);
      setUser(null);
      localStorage.removeItem('token');
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Fungsi login (misal dari form login)
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  // Fungsi logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
