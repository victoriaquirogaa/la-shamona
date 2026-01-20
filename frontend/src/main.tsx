import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' 
import 'bootstrap/dist/css/bootstrap.min.css';

// 👇 IMPORTAMOS LOS PROVEEDORES DE CONTEXTO
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SoundProvider } from './context/SoundContext'; // 👈 Importar

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SubscriptionProvider>
        <SoundProvider> {/* 👈 AGREGAR ESTO ACÁ */}
            <App />
        </SoundProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </React.StrictMode>,
)