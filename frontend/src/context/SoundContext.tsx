import React, { createContext, useContext, useState, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Definimos qué funciones vamos a compartir con toda la app
interface SoundContextType {
  sonidoHabilitado: boolean;
  vibracionHabilitada: boolean;
  toggleSonido: () => void;
  toggleVibracion: () => void;
  reproducirClick: () => void;
  vibrarSuave: () => void;
  vibrarFuerte: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound debe usarse dentro de SoundProvider");
  return context;
};

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  // Leemos la memoria del celu para ver si lo dejó prendido o apagado
  const [sonidoHabilitado, setSonidoHabilitado] = useState(() => {
    return localStorage.getItem('sound_enabled') !== 'false';
  });
  
  const [vibracionHabilitada, setVibracionHabilitada] = useState(() => {
    return localStorage.getItem('vibration_enabled') !== 'false';
  });

  // Guardamos cambios si el usuario toca los botones
  useEffect(() => {
    localStorage.setItem('sound_enabled', String(sonidoHabilitado));
  }, [sonidoHabilitado]);

  useEffect(() => {
    localStorage.setItem('vibration_enabled', String(vibracionHabilitada));
  }, [vibracionHabilitada]);

  // Funciones para cambiar estado (ON/OFF)
  const toggleSonido = () => setSonidoHabilitado(prev => !prev);
  const toggleVibracion = () => setVibracionHabilitada(prev => !prev);

  // --- ACCIONES REALES ---

  const reproducirClick = () => {
    if (!sonidoHabilitado) return;
    try {
      // Busca el archivo en la carpeta public/sounds
      const audio = new Audio('/sounds/click.mp3'); 
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Error audio (posiblemente falta interacción):", e));
    } catch (error) {
      console.error("Error reproduciendo sonido", error);
    }
  };

  const vibrarSuave = async () => {
    if (!vibracionHabilitada) return;
    try {
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
        console.log("Vibración no soportada en web, solo en celular.");
    }
  };

  const vibrarFuerte = async () => {
    if (!vibracionHabilitada) return;
    try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
        console.log("Vibración no soportada en web.");
    }
  };

  return (
    <SoundContext.Provider value={{
      sonidoHabilitado,
      vibracionHabilitada,
      toggleSonido,
      toggleVibracion,
      reproducirClick,
      vibrarSuave,
      vibrarFuerte
    }}>
      {children}
    </SoundContext.Provider>
  );
};