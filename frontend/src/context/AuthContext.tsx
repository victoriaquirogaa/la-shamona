import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithCredential // 👈 Importante: Para conectar Google Nativo con Firebase
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { api } from "../lib/api"; 
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'; // 👈 El Plugin
import { Capacitor } from '@capacitor/core'; // 👈 El detector de celular

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
  actualizarNombreLocal: (nuevoNombre: string) => void;
  actualizarAvatarLocal: (nuevoAvatar: string) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ volumen: 50, vibracion: true });

  // 👇 Inicialización opcional (ayuda en algunos celus a prevenir errores)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
       GoogleAuth.initialize();
    }
  }, []);

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

  // 👇 LA FUNCIÓN HÍBRIDA (La clave de todo)
  const loginWithGoogle = async () => {
    // 1. Preguntamos: ¿Es celular?
    if (Capacitor.isNativePlatform()) {
        console.log("📱 Modo Celular: Iniciando Login Nativo...");
        
        // A. Abrimos la ventanita gris de Android
        const googleUser = await GoogleAuth.signIn();
        
        // B. Obtenemos el token de seguridad
        const idToken = googleUser.authentication.idToken;
        
        // C. Creamos la credencial para Firebase
        const credential = GoogleAuthProvider.credential(idToken);
        
        // D. Entramos
        return signInWithCredential(auth, credential);

    } else {
        // 2. Si es PC, usamos el Popup de siempre
        console.log("💻 Modo Web: Iniciando Popup...");
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }
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

  // 👇 EL LOGOUT BLINDADO (Anti-Crash)
  const logout = async () => {
    // Intentamos desconectar Google solo si es celular
    if (Capacitor.isNativePlatform()) {
        try {
            await GoogleAuth.signOut();
        } catch (error) {
            // Si falla (ej: eras invitado), no pasa nada, seguimos.
            console.log("No se pudo cerrar sesión nativa (o no era necesaria):", error);
        }
    }
    // Cerramos sesión en Firebase (esto funciona siempre)
    await signOut(auth);
    setUser(null);
  };

  const updateSettings = (newSettings: any) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Updates the display name in local state without triggering a full page reload
  const actualizarNombreLocal = (nuevoNombre: string) => {
      setUser((prev: any) => ({ ...prev, nombre: nuevoNombre }));
  };

  // Updates the avatar/photoURL in local state without triggering a full page reload
  const actualizarAvatarLocal = (nuevoAvatar: string) => {
      setUser((prev: any) => ({ ...prev, avatar: nuevoAvatar, photoURL: nuevoAvatar }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, settings, loginWithGoogle, loginWithEmail, registerWithEmail, loginAnonymously, logout, updateSettings, actualizarNombreLocal, actualizarAvatarLocal }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};