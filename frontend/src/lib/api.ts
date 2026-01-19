export const API_URL = "http://127.0.0.1:8000";

// 🚨 FUNCIÓN ESPÍA: Atrapa el error y te lo muestra en la cara
const safeFetch = async (endpoint: string, options?: RequestInit) => {
  const fullUrl = `${API_URL}${endpoint}`;
  try {
    console.log(`Intentando conectar a: ${fullUrl}`);
    const response = await fetch(fullUrl, options);
    
    if (!response.ok) {
      throw new Error(`Error del Servidor: ${response.status} ${response.statusText}`);
    }
    return response;
  } catch (error: any) {
    // 🛑 ACÁ SALTA EL CARTEL CON EL DATO CLAVE
    alert(`⛔ ERROR DE CONEXIÓN ⛔\n\nURL: ${fullUrl}\n\nMENSAJE: ${error.message}\n\n¿Es la IP correcta?`);
    throw error;
  }
};

export const api = {
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_URL}/`); // Este lo dejamos sin alerta para no molestar al inicio
      return await res.json();
    } catch (e) { return null; }
  },

  // Juegos Simples (Ahora aceptan esPremium para el filtro VIP)
  getFraseYoNunca: async (cat: string, esPremium: boolean = false) => 
      (await safeFetch(`/juegos/yo-nunca/${cat}?es_premium=${esPremium}`)).json(),

  getFraseVotacion: async (cat: string, esPremium: boolean = false) => 
      (await safeFetch(`/juegos/votacion/rapido/${cat}?es_premium=${esPremium}`)).json(),

  getPregunta: async (cat: string, esPremium: boolean = false) => 
      (await safeFetch(`/juegos/preguntas/${cat}?es_premium=${esPremium}`)).json(),

  // La Jefa
  crearPartidaLaJefa: async (jugadores: string[]) => (await safeFetch(`/juegos/la-puta/crear`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ jugadores }) })).json(),
  sacarCartaLaJefa: async (id_sala: string) => (await safeFetch(`/juegos/la-puta/sacar-carta`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id_sala }) })).json(),
  asignarPuta: async (id_sala: string, dueño: string, mascota: string) => (await safeFetch(`/juegos/la-puta/asignar-puta`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id_sala, dueño, mascota }) })).json(),
  registrarTrago: async (id_sala: string, perdedor: string) => (await safeFetch(`/juegos/la-puta/registrar-trago`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id_sala, perdedor }) })).json(),

  // Peaje
  crearPartidaPeaje: async () => (await safeFetch(`/juegos/peaje/crear`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ jugadores: ["Grupo"] }) })).json(),
  jugarTurnoPeaje: async (id_sala: string, prediccion: string) => (await safeFetch(`/juegos/peaje/jugar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id_sala, prediccion }) })).json(),

  // Online
  crearSalaOnline: async (nombreHost: string) => (await safeFetch(`/juegos/online/crear`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ nombre_host: nombreHost }) })).json(),
  unirseSalaOnline: async (codigo: string, nombreJugador: string) => (await safeFetch(`/juegos/online/unirse`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, nombre_jugador: nombreJugador }) })).json(),
  getSalaOnline: async (codigo: string) => (await safeFetch(`/juegos/online/estado/${codigo}`)).json(),
  
  iniciarJuegoOnline: async (codigo: string, juego: string, categoriaId?: string, esPremium: boolean = false) => {
        await safeFetch(`/juegos/online/iniciar`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo, juego, categoria_id: categoriaId, es_usuario_premium: esPremium })
      });
    },

  sacarCartaOnline: async (codigo: string) => (await safeFetch(`/juegos/online/jugada/sacar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, juego: 'la-jefa' }) })).json(),
  
  reportarTragoOnline: async (codigo: string, victima: string) => (await safeFetch(`/juegos/online/jugada/reportar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, victima }) })).json(),
  
  pasarTurnoOnline: async (codigo: string) => (await safeFetch(`/juegos/online/jugada/pasar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, juego: 'la-jefa' }) })).json(),
  
  asignarPutaOnline: async (codigo: string, dueno: string, esclavo: string) => 
    (await safeFetch(`/juegos/online/jugada/asignar_puta`, { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ codigo, dueno, esclavo }) 
    })).json(),

  tomanTodosOnline: async (codigo: string) => 
    (await safeFetch(`/juegos/online/jugada/toman_todos`, { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ codigo, juego: 'la-jefa' }) 
    })).json(),

  // Impostor y otros
  getCategoriasImpostor: async () => {
    try {
        const res = await safeFetch(`/impostor/categorias`);
        return await res.json();
    } catch (e) { return []; }
  },

  // 👇👇👇 FUNCIÓN ACTUALIZADA CON PERMISO VIP 👇👇👇
  crearPartidaImpostorLocal: async (jugadores: string[], categoriaId?: string, tienePermiso: boolean = false, esPremium: boolean = false) => {
    const deviceId = localStorage.getItem('device_id') || 'browser-client'; 
    const response = await safeFetch(`/impostor/crear-local`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          jugadores, 
          categoria_id: categoriaId || null, 
          device_id: deviceId,
          tiene_permiso: tienePermiso,   // Salvoconducto (Video)
          es_usuario_premium: esPremium // 👈 NUEVO: Para filtrar el Mix
      })
    });
    return await response.json();
  },

  votarImpostor: async (codigo: string, votante: string, acusado: string) => {
    await safeFetch(`/juegos/online/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, votante, acusado })
    });
  },

  cambiarFaseImpostor: async (codigo: string, fase: string) => {
    await safeFetch(`/juegos/online/cambiar-fase`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, fase })
    });
  },

  votarEncuesta: async (codigo: string, votante: string, opcion: string) => {
    await safeFetch(`/juegos/online/votar-encuesta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, votante, opcion })
    });
  },

  terminarJuego: async (codigo: string) => {
    return safeFetch(`/juegos/online/terminar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, juego: "reset" }),
    }).then(r => r.json());
  },

  apostarPiramide: async (codigo: string, nombre: string, apuesta: string) => {
        const res = await safeFetch(`/juegos/online/piramide/apostar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, nombre, apuesta }),
        });
        return res.json();
    },

  voltearCarta: async (codigo: string) => {
      const response = await safeFetch(`/juegos/online/piramide/voltear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo }),
      });
      return response.json();
  },

  finalizarJuegoOnline: async (codigo: string) => {
      const response = await safeFetch(`/juegos/online/finalizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo }),
      });
      return response.json();
  },

  cerrarVotacion: async (codigoSala: string) => {
    // Fíjate que apunte a /impostor, NO a /online
    const response = await fetch(`${API_URL}/impostor/cerrar-votacion`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoSala })
    });
    return response.json();
},
};