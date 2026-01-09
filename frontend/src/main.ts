import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
    <h1>🍻 Previa App</h1>
    <p>Estado del sistema:</p>
    
    <button id="btn-test" style="padding: 10px 20px; font-size: 1.2rem; cursor: pointer;">
      Probar Conexión con Backend
    </button>

    <h2 id="resultado" style="margin-top: 20px; color: gray;">Esperando click...</h2>
  </div>
`

// Lógica del botón
const btn = document.querySelector<HTMLButtonElement>('#btn-test');
const resultado = document.querySelector<HTMLHeadingElement>('#resultado');

btn?.addEventListener('click', async () => {
  try {
    if(resultado) resultado.innerText = "Conectando...";
    
    // Petición al Backend (Asegurate que el puerto sea el 8000)
    const respuesta = await fetch('http://127.0.0.1:8000/');
    const datos = await respuesta.json();

    if (resultado) {
      resultado.innerText = `✅ Éxito: ${datos.mensaje}`;
      resultado.style.color = "green";
    }
    
  } catch (error) {
    console.error(error);
    if (resultado) {
      resultado.innerText = "❌ Error: No se pudo conectar con el Backend.";
      resultado.style.color = "red";
    }
  }
});