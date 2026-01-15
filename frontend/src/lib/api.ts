const API_URL = 'http://127.0.0.1:8000';

export const api = {
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_URL}/`);
      return await res.json();
    } catch (e) { return null; }
  },

  // Juegos Simples
  getFraseYoNunca: async (cat: string) => (await fetch(`${API_URL}/juegos/yo-nunca/${cat}`)).json(),
  getFraseVotacion: async (cat: string) => (await fetch(`${API_URL}/juegos/votacion/rapido/${cat}`)).json(),
  getPregunta: async (cat: string) => (await fetch(`${API_URL}/juegos/preguntas/${cat}`)).json(),

  // La Jefa
  crearPartidaLaJefa: async (jugadores: string[]) => (await fetch(`${API_URL}/juegos/la-puta/crear`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ jugadores }) })).json(),
  sacarCartaLaJefa: async (id_sala: string) => (await fetch(`${API_URL}/juegos/la-puta/sacar-carta`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id_sala }) })).json(),
  asignarPuta: async (id_sala: string, dueño: string, mascota: string) => (await fetch(`${API_URL}/juegos/la-puta/asignar-puta`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id_sala, dueño, mascota }) })).json(),
  registrarTrago: async (id_sala: string, perdedor: string) => (await fetch(`${API_URL}/juegos/la-puta/registrar-trago`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id_sala, perdedor }) })).json(),

  // Peaje
  crearPartidaPeaje: async () => (await fetch(`${API_URL}/juegos/peaje/crear`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ jugadores: ["Grupo"] }) })).json(),
  jugarTurnoPeaje: async (id_sala: string, prediccion: string) => (await fetch(`${API_URL}/juegos/peaje/jugar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id_sala, prediccion }) })).json(),

  // Online
  // --- ONLINE ---
  crearSalaOnline: async (nombreHost: string) => (await fetch(`${API_URL}/juegos/online/crear`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ nombre_host: nombreHost }) })).json(),
  unirseSalaOnline: async (codigo: string, nombreJugador: string) => (await fetch(`${API_URL}/juegos/online/unirse`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, nombre_jugador: nombreJugador }) })).json(),
  getSalaOnline: async (codigo: string) => (await fetch(`${API_URL}/juegos/online/estado/${codigo}`)).json(),
  iniciarJuegoOnline: async (codigo: string, juego: string) => (await fetch(`${API_URL}/juegos/online/iniciar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, juego }) })).json(),

  // --- JUGABILIDAD ONLINE ---
  sacarCartaOnline: async (codigo: string) => (await fetch(`${API_URL}/juegos/online/jugada/sacar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, juego: 'la-jefa' }) })).json(),
  
  // EL BOTÓN (Acusar a alguien)
  reportarTragoOnline: async (codigo: string, victima: string) => (await fetch(`${API_URL}/juegos/online/jugada/reportar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, victima }) })).json(),
  
  // SIGUIENTE (Limpiar pantalla y pasar turno)
  pasarTurnoOnline: async (codigo: string) => (await fetch(`${API_URL}/juegos/online/jugada/pasar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, juego: 'la-jefa' }) })).json(),
  asignarPutaOnline: async (codigo: string, dueno: string, esclavo: string) => 
    (await fetch(`${API_URL}/juegos/online/jugada/asignar_puta`, { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ codigo, dueno, esclavo }) 
    })).json(),

  tomanTodosOnline: async (codigo: string) => 
    (await fetch(`${API_URL}/juegos/online/jugada/toman_todos`, { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ codigo, juego: 'la-jefa' }) 
    })).json(),

  // 1. OBTENER LISTA DE CATEGORÍAS
  getCategoriasImpostor: async () => {
    try {
        const res = await fetch(`${API_URL}/impostor/categorias`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
  },

  // 2. CREAR PARTIDA LOCAL (Ahora acepta categoriaId opcional)
  crearPartidaImpostorLocal: async (jugadores: string[], categoriaId?: string) => {
    const deviceId = localStorage.getItem('device_id') || 'browser-client'; 

    const response = await fetch(`${API_URL}/impostor/crear-local`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          jugadores, 
          categoria_id: categoriaId || null, // <--- ACÁ MANDAMOS LA SELECCIÓN
          device_id: deviceId 
      })
    });
    
    if (!response.ok) throw new Error("Error al repartir cartas");
    return await response.json();
  }
};
