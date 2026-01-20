import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' 
import 'bootstrap/dist/css/bootstrap.min.css';

// 👇 IMPORTAMOS LOS PROVEEDORES DE CONTEXTO
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SoundProvider } from './context/SoundContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. Auth: Maneja el usuario de Google */}
    <AuthProvider>
      {/* 2. Subscription: Maneja VIP y Amigos */}
      <SubscriptionProvider>
        {/* 3. Sound: Maneja Sonido y Vibración */}
        <SoundProvider>
            <App />
        </SoundProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </React.StrictMode>,
)