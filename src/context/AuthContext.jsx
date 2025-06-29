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
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('taaza_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Verify the user data is still valid by checking with Firestore
          if (userData.id) {
            try {
              const userDoc = await getDoc(doc(db, 'users', userData.id));
              if (userDoc.exists()) {
                setUser(userData);
              } else {
                // User no longer exists in database, clear storage
                localStorage.removeItem('taaza_user');
              }
            } catch (error) {
              console.error('Error verifying user data:', error);
              // If there's an error verifying, still set the user to prevent redirect loops
              setUser(userData);
            }
          } else {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('taaza_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
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