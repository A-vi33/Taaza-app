import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { type: 'customer' | 'admin', ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email === 'admin@taaza.com') {
          setUser({ type: 'admin', email: firebaseUser.email });
        } else {
          // Temporarily skip Firestore access to avoid permission errors
          // TODO: Update Firestore rules to allow read/write access
          setUser({ 
            type: 'customer', 
            email: firebaseUser.email, 
            uid: firebaseUser.uid,
            name: 'Customer', // Fallback name
            phone: '' // Fallback phone
          });
          
          /* Original code (commented out until rules are fixed):
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              setUser({ ...userDoc.data(), type: 'customer' });
            } else {
              setUser({ type: 'customer', email: firebaseUser.email, uid: firebaseUser.uid });
            }
          } catch (err) {
            setUser({ type: 'customer', email: firebaseUser.email, uid: firebaseUser.uid });
          }
          */
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      setUser(null);
      // Clear any stored cart data
      localStorage.removeItem('taazaCart');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = { user, setUser, loading, logout };
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
} 