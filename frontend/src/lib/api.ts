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
  crearSalaOnline: async (nombreHost: string) => 
    (await fetch(`${API_URL}/juegos/online/crear`, { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ nombre_host: nombreHost }) 
    })).json(),

  unirseSalaOnline: async (codigo: string, nombreJugador: string) => 
    (await fetch(`${API_URL}/juegos/online/unirse`, { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ codigo, nombre_jugador: nombreJugador }) 
    })).json(),

    getSalaOnline: async (codigo: string) => (await fetch(`${API_URL}/juegos/online/estado/${codigo}`)).json(),

    iniciarJuegoOnline: async (codigo: string, juego: string) => 
    (await fetch(`${API_URL}/juegos/online/iniciar`, { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ codigo, juego }) 
    })).json(),
};
