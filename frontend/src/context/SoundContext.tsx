import React, { createContext, useContext, useState, useEffect } from 'react';

interface SoundContextType {
  sonidoHabilitado: boolean;
  vibracionHabilitada: boolean;
  toggleSonido: () => void;
  toggleVibracion: () => void;
  reproducirEfecto: (tipo: 'click' | 'error' | 'exito' | 'trago') => void;
  vibrar: (patron?: number | number[]) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Leemos preferencia guardada o default true
  const [sonidoHabilitado, setSonidoHabilitado] = useState(() => localStorage.getItem('sound') !== 'off');
  const [vibracionHabilitada, setVibracionHabilitada] = useState(() => localStorage.getItem('vibration') !== 'off');

  // Guardar persistencia
  useEffect(() => localStorage.setItem('sound', sonidoHabilitado ? 'on' : 'off'), [sonidoHabilitado]);
  useEffect(() => localStorage.setItem('vibration', vibracionHabilitada ? 'on' : 'off'), [vibracionHabilitada]);

  const toggleSonido = () => setSonidoHabilitado(!sonidoHabilitado);
  const toggleVibracion = () => setVibracionHabilitada(!vibracionHabilitada);

  // 📳 FUNCIÓN DE VIBRAR
  const vibrar = (patron: number | number[] = 200) => {
    if (vibracionHabilitada && navigator.vibrate) {
      navigator.vibrate(patron);
    }
  };

  // 🔊 FUNCIÓN DE SONIDO (Placeholder para cuando metamos audios)
  const reproducirEfecto = (tipo: 'click' | 'error' | 'exito' | 'trago') => {
    if (!sonidoHabilitado) return;
    // Acá en el futuro pondremos: new Audio('/sounds/click.mp3').play();
    console.log(`🔊 Reproduciendo sonido: ${tipo}`);
  };

  return (
    <SoundContext.Provider value={{ 
        sonidoHabilitado, 
        vibracionHabilitada, 
        toggleSonido, 
        toggleVibracion,
        reproducirEfecto,
        vibrar 
    }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound debe usarse dentro de SoundProvider");
  return context;
};