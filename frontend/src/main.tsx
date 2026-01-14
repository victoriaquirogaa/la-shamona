import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Importamos tu App limpia

// 1. Aquí importamos Bootstrap para TODA la aplicación
import 'bootstrap/dist/css/bootstrap.min.css'; 

// 2. Buscamos el div con id "root" en el HTML y renderizamos la App
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)