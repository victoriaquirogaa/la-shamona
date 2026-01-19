import React, { createContext, useContext, useEffect, useState } from "react";
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously 
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { api } from "../lib/api"; // 👈 1. IMPORTAMOS LA API

interface AuthContextType {
  user: any;
  loading: boolean;
  settings: { volumen: number; vibracion: boolean };
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
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
    // Escuchamos cambios en la autenticación (Login, Logout, Recarga de página)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        
        // A. Lógica para determinar el nombre a mostrar
        let nombreDisplay = "Invitado";
        if (currentUser.displayName) nombreDisplay = currentUser.displayName;
        else if (currentUser.email) nombreDisplay = currentUser.email.split('@')[0];

        // B. Guardamos en el estado local de la App (Contexto)
        setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            nombre: nombreDisplay,
            avatar: currentUser.photoURL || "🕵️" 
        });

        // C. 🚀 SINCRONIZAMOS CON EL BACKEND (BD)
        // Esto crea el documento en Firebase si no existe, o lo actualiza.
        try {
            await api.sincronizarUsuario(currentUser);
            console.log("✅ Usuario sincronizado con la Base de Datos");
        } catch (error) {
            console.error("❌ Error sincronizando usuario:", error);
        }

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