import React, { createContext, useContext, useEffect, useState } from "react";
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously // <--- 1. IMPORTAMOS ESTO
} from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextType {
  user: any;
  loading: boolean;
  settings: { volumen: number; vibracion: boolean };
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  loginAnonymously: () => Promise<void>; // <--- 2. AGREGAMOS A LA INTERFAZ
  logout: () => Promise<void>;
  updateSettings: (newSettings: any) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ volumen: 50, vibracion: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Lógica inteligente para el nombre:
        // 1. Nombre real (Google)
        // 2. Parte del mail (Email)
        // 3. "Invitado" (Anónimo)
        let nombreDisplay = "Invitado";
        if (currentUser.displayName) nombreDisplay = currentUser.displayName;
        else if (currentUser.email) nombreDisplay = currentUser.email.split('@')[0];

        setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            nombre: nombreDisplay,
            avatar: currentUser.photoURL || "🕵️" // Avatar por defecto para anónimos
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  // --- 3. FUNCIÓN PARA ENTRAR COMO ANÓNIMO ---
  const loginAnonymously = async () => {
    await signInAnonymously(auth);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateSettings = (newSettings: any) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, settings, loginWithGoogle, loginWithEmail, registerWithEmail, loginAnonymously, logout, updateSettings }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};