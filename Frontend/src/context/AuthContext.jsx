import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // wait for Firebase auth state

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid:          firebaseUser.uid,
          name:         firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email:        firebaseUser.email,
          photoURL:     firebaseUser.photoURL,
          // policyNumber is stored in localStorage per-uid (Firebase doesn't store custom fields)
          policyNumber: localStorage.getItem(`cia_policy_${firebaseUser.uid}`) || 'N/A',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Email / Password register ─────────────────────────────────────────
  const register = async ({ name, email, password, policyNumber }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Store policy number locally (keyed by uid)
    localStorage.setItem(`cia_policy_${cred.user.uid}`, policyNumber);
    return cred.user;
  };

  // ── Email / Password login ────────────────────────────────────────────
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  // ── Google Sign-In ────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  };

  // ── Sign Out ──────────────────────────────────────────────────────────
  const logout = () => signOut(auth);

  const value = { user, loading, register, login, logout, signInWithGoogle };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render children until Firebase has resolved the auth state */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
