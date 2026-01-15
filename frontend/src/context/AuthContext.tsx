import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Definimos qué tiene un Usuario
interface UserProfile {
  nombre: string;
  esInvitado: boolean; // true = solo puso nombre, false = login real (futuro)
  avatar?: string;     // URL de la imagen (o un emoji por ahora)
}

// Definimos las Configuraciones
interface AppSettings {
  volumen: number;     // 0 a 100
  vibracion: boolean;
  idioma: 'ES' | 'EN';
}

interface AuthContextType {
  user: UserProfile | null;
  settings: AppSettings;
  login: (nombre: string) => void;
  logout: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Configuración por defecto
  const [settings, setSettings] = useState<AppSettings>({
    volumen: 50,
    vibracion: true,
    idioma: 'ES'
  });

  // 1. Al iniciar, buscamos si ya había sesión guardada
  useEffect(() => {
    const savedUser = localStorage.getItem('lajefa_user');
    const savedSettings = localStorage.getItem('lajefa_settings');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  // 2. Función para Iniciar Sesión (Por ahora solo Nombre)
  const login = (nombre: string) => {
    const newUser = { nombre, esInvitado: true, avatar: '😎' };
    setUser(newUser);
    localStorage.setItem('lajefa_user', JSON.stringify(newUser));
  };

  // 3. Función para Cerrar Sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem('lajefa_user');
  };

  // 4. Actualizar Configuración
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('lajefa_settings', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, settings, login, logout, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar esto fácil en cualquier lado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};