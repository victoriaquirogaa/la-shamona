export const API_URL = "http://127.0.0.1:8000";

// 🚨 FUNCIÓN ESPÍA: Atrapa el error y te lo muestra en la cara
// 🚨 FUNCIÓN ESPÍA (Versión Relajada)
// En src/lib/api.ts

const safeFetch = async (endpoint: string, options?: RequestInit) => {
  const fullUrl = `${API_URL}${endpoint}`;
  try {
    const response = await fetch(fullUrl, options);
    
    if (!response.ok) {
        if (response.status === 404) return response; // Ignoramos 404
        throw new Error(`Error Backend: ${response.status}`);
    }
    return response;

  } catch (error: any) {
    console.error("Fetch Error:", error);
    
    // 👇👇👇 ¡ESTA ES LA CLAVE! 👇👇👇
    // BORRÁ CUALQUIER LÍNEA QUE DIGA "alert(...)" ACÁ.
    // Solo dejá el console.log o nada.
    
    console.log("Error de conexión silencioso (para no molestar al usuario).");
    
    throw error; // Lanzamos el error para que React lo maneje internamente, pero SIN CARTEL.
  }
};

const getDeviceId = () => {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', id);
  }
  return id;
};

// Objeto principal API
export const api = {
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_URL}/`);
      return await res.json();
    } catch (e) { return null; }
  },

  // --- USUARIOS Y PERFIL (ESTO ES LO QUE TE FALTABA) ---
  
  // 1. Sincronizar (Login)
  sincronizarUsuario: async (user: any) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/sincronizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          nombre: user.displayName || "Viajero Anónimo",
          avatar: user.photoURL
        })
      });
      return await response.json();
    } catch (error) {
      console.error("Error sincronizando usuario:", error);
      return null;
    }
  },

  // 2. Actualizar Nombre (Perfil) - AHORA SÍ ESTÁ DENTRO DE 'api'
  actualizarNombreUsuario: async (uid: string, nuevoNombre: string) => {
    const response = await fetch(`${API_URL}/usuarios/${uid}/nombre`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoNombre })
    });
    if (!response.ok) throw new Error("Error al actualizar nombre");
    return await response.json();
  },

  // 3. Obtener Datos (Para ver si es Amigo)
  getDatosUsuario: async (uid: string) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/${uid}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error obteniendo datos usuario:", error);
      return null;
    }
  },

  // 4. Canjear Código
  canjearCodigo: async (codigo: string) => {
    const deviceId = getDeviceId(); 
    const response = await safeFetch(`/usuarios/canjear-codigo`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, codigo: codigo })
    });
    return await response.json();
  },

  getPermisosUsuario: async (uidOpcional?: string) => {
    const idParaBuscar = uidOpcional || getDeviceId(); // 👈 LÓGICA CLAVE
    console.log("🔍 Buscando permisos para:", idParaBuscar); // Para depurar
    const response = await safeFetch(`/usuarios/${idParaBuscar}/permisos`);
    return await response.json();
  },


  // --- JUEGOS ---

  // Juegos Simples
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

  // Impostor
  getCategoriasImpostor: async () => {
    try {
        const res = await safeFetch(`/impostor/categorias`);
        return await res.json();
    } catch (e) { return []; }
  },

  crearPartidaImpostorLocal: async (jugadores: string[], categoriaId?: string, tienePermiso: boolean = false, esPremium: boolean = false) => {
    const deviceId = localStorage.getItem('device_id') || 'browser-client'; 
    const response = await safeFetch(`/impostor/crear-local`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          jugadores, 
          categoria_id: categoriaId || null, 
          device_id: deviceId,
          tiene_permiso: tienePermiso, 
          es_usuario_premium: esPremium 
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
    const response = await fetch(`${API_URL}/impostor/cerrar-votacion`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoSala })
    });
    return response.json();
  },
};