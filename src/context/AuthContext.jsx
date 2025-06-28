import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user data on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('taaza_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('taaza_user');
      }
    }
    setLoading(false);
  }, []);

  // Function to update user data
  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('taaza_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('taaza_user');
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('taaza_user');
  };

  const value = {
    user,
    setUser: updateUser,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 