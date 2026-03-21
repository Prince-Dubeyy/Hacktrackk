import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, isFirebaseConfigValid } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read admin emails from environment, comma-separated
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    if (!isFirebaseConfigValid || !auth) {
      console.warn('Firebase auth is not available; running in offline/guest mode.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error('Firebase auth onAuthStateChanged error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigValid || !auth || !googleProvider) {
      console.warn('Cannot login: Firebase is not configured correctly.');
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('Login Error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login cancelled by user.');
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigValid || !auth) {
      console.warn('Cannot logout: Firebase is not configured correctly.');
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const userEmail = user?.email?.toLowerCase();
  const isAdmin = user && adminEmails.includes(userEmail);

  const value = {
    user,
    isAdmin,
    loginWithGoogle,
    logout,
    loading,
    firebaseEnabled: Boolean(isFirebaseConfigValid && auth),
    adminEmails,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
