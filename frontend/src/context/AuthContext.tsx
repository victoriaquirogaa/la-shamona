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
import { api } from "../lib/api"; 

// 👇 1. CAMBIAMOS LA INTERFAZ: Ahora devuelven Promise<any> en lugar de void
interface AuthContextType {
  user: any;
  loading: boolean;
  settings: { volumen: number; vibracion: boolean };
  loginWithGoogle: () => Promise<any>; 
  loginWithEmail: (email: string, pass: string) => Promise<any>;
  registerWithEmail: (email: string, pass: string) => Promise<any>;
  loginAnonymously: () => Promise<any>;
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        
        let nombreDisplay = "Invitado";
        if (currentUser.displayName) nombreDisplay = currentUser.displayName;
        else if (currentUser.email) nombreDisplay = currentUser.email.split('@')[0];

        setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            nombre: nombreDisplay,
            avatar: currentUser.photoURL || "🕵️" 
        });

        // NOTA: Mantenemos esto aquí también como seguridad
        // por si el usuario recarga la página.
        try {
            await api.sincronizarUsuario(currentUser);
        } catch (error) {
            console.error("Error sync automático:", error);
        }

      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 👇 2. AGREGAMOS LOS RETURN EN CADA FUNCIÓN

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // ¡IMPORTANTE! Devolvemos el resultado para que Welcome.tsx lo reciba
    return signInWithPopup(auth, provider); 
  };

  const loginWithEmail = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginAnonymously = async () => {
    return signInAnonymously(auth);
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