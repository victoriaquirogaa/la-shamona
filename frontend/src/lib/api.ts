import { auth } from "../lib/firebase";

// 🏠 LOCAL: Usar para desarrollo y ver imágenes locales (Fernet)
// export const API_URL = "https://viajero-backend-x42g.onrender.com"; // PROD
export const API_URL = "http://localhost:8000"; // LOCAL

const safeFetch = async (endpoint: string, options?: RequestInit) => {
  const fullUrl = `${API_URL}${endpoint}`;
  try {
    const response = await fetch(fullUrl, options);

    if (!response.ok) {
        if (response.status === 404) return response; // Ignoramos 404
        // Devuelve un objeto 'response-like' con json() que retorna null para evitar lanzar
        return {
          ok: false,
          status: response.status,
          json: async () => null
        } as unknown as Response;
    }
    return response;

  } catch (error: any) {
    console.error("Fetch Error:", error);
    // En vez de lanzar, retornamos un objeto 'response-like' para que el UI maneje gracefully
    return {
      ok: false,
      status: 0,
      json: async () => null
    } as unknown as Response;
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

export const api = {
  
  checkHealth: async () => {
    try { const res = await fetch(`${API_URL}/`); return await res.json(); } catch (e) { return null; }
  },

  // --- TRAGOS (Agregado para que funcione Bebidas.tsx) ---
  obtenerTragos: async () => {
    try {
        const res = await safeFetch("/bebidas");
        if (!res || (res as Response).status === 404) return [];
        return await (res as Response).json();
    } catch (e) {
        console.error("Error obteniendo tragos:", e);
        return [];
    }
  },

  toggleLikeBebida: async (bebidaId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No hay usuario logueado");
    const token = await user.getIdToken();

    const res = await fetch(`${API_URL}/bebidas/${bebidaId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("No se pudo toggle like");
    return res.json();
  },

  // --- USUARIOS ---
  sincronizarUsuario: async (user: any) => {
    const response = await fetch(`${API_URL}/usuarios/sincronizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, email: user.email, nombre: user.displayName || "Viajero", avatar: user.photoURL })
    });
    return await response.json();
  },

  actualizarNombreUsuario: async (uid: string, nuevoNombre: string) => {
    const response = await fetch(`${API_URL}/usuarios/${uid}/nombre`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoNombre })
    });
    if (!response.ok) throw new Error("Error al actualizar nombre");
    return await response.json();
  },

  getDatosUsuario: async (uid: string) => {
    try { const res = await fetch(`${API_URL}/usuarios/${uid}`); return res.ok ? await res.json() : null; } catch { return null; }
  },

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
    const idParaBuscar = uidOpcional || getDeviceId();
    const response = await safeFetch(`/usuarios/${idParaBuscar}/permisos`);
    return await response.json();
  },

  // --- JUEGOS ---
  getFraseYoNunca: async (cat: string, esPremium: boolean = false) => (await safeFetch(`/juegos/yo-nunca/${cat}?es_premium=${esPremium}`)).json(),
  getFraseVotacion: async (cat: string, esPremium: boolean = false) => (await safeFetch(`/juegos/votacion/rapido/${cat}?es_premium=${esPremium}`)).json(),
  getPregunta: async (cat: string, esPremium: boolean = false) => (await safeFetch(`/juegos/preguntas/${cat}?es_premium=${esPremium}`)).json(),

  // --- LA JEFA (La Puta) ---
  crearPartidaLaJefa: async (jugadores: string[]) => {
    const res = await safeFetch(`/juegos/la-puta/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jugadores })
    });
    return (res as Response).json();
  },
  sacarCartaLaJefa: async (idSala: string) => {
    const res = await safeFetch(`/juegos/la-puta/sacar-carta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_sala: idSala })
    });
    return (res as Response).json();
  },
  asignarPuta: async (idSala: string, dueño: string, mascota: string) => {
    const res = await safeFetch(`/juegos/la-puta/asignar-puta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_sala: idSala, dueño, mascota })
    });
    return (res as Response).json();
  },
  registrarTrago: async (idSala: string, perdedor: string) => {
    const res = await safeFetch(`/juegos/la-puta/registrar-trago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_sala: idSala, perdedor })
    });
    return (res as Response).json();
  },

  // --- MAZOS COMPLETOS (sin repetición) ---
  getMazoYoNunca: async (cat: string, esPremium: boolean = false): Promise<string[]> => {
    const res = await safeFetch(`/juegos/yo-nunca/mazo/${cat}?es_premium=${esPremium}`);
    const data = await (res as Response).json();
    return data?.frases ?? [];
  },
  getMazoPreguntas: async (cat: string, esPremium: boolean = false): Promise<string[]> => {
    const res = await safeFetch(`/juegos/preguntas/mazo/${cat}?es_premium=${esPremium}`);
    const data = await (res as Response).json();
    return data?.frases ?? [];
  },

  // Online (Simplificado para brevedad, mantener tu lógica original si la usas)
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

  // Update general user data (called after a successful purchase)
  actualizarUsuario: async (uid: string, datos: Record<string, any>) => {
    const res = await safeFetch(`/usuarios/${uid}/actualizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await (res as Response).json();
  },
  
  // --- PEAJE ---
  crearPartidaPeaje: async () => {
    const res = await safeFetch(`/juegos/peaje/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jugadores: [] })
    });
    return (res as Response).json();
  },
  jugarTurnoPeaje: async (idSala: string, prediccion: string) => {
    const res = await safeFetch(`/juegos/peaje/jugar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_sala: idSala, prediccion })
    });
    return (res as Response).json();
  },

  // --- IMPOSTOR (OFFLINE) ---
  getCategoriasImpostor: async () => {
    const res = await safeFetch(`/impostor/categorias`);
    return (res as Response).json();
  },
  crearPartidaImpostorLocal: async (
    jugadores: string[],
    categoriaId: string | undefined,
    tienePermiso: boolean,
    esPremium: boolean
  ) => {
    const res = await safeFetch(`/impostor/crear-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jugadores,
        categoria_id: categoriaId || 'mix',
        tiene_permiso: tienePermiso,
        es_usuario_premium: esPremium
      })
    });
    return (res as Response).json();
  },

  // --- ONLINE: LA JEFA ---
  sacarCartaOnline: async (codigo: string) => {
    const res = await safeFetch(`/juegos/online/jugada/sacar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, juego: 'la-jefa' })
    });
    return (res as Response).json();
  },
  pasarTurnoOnline: async (codigo: string) => {
    const res = await safeFetch(`/juegos/online/jugada/pasar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, juego: '' })
    });
    return (res as Response).json();
  },
  reportarTragoOnline: async (codigo: string, victima: string) => {
    const res = await safeFetch(`/juegos/online/jugada/reportar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, victima })
    });
    return (res as Response).json();
  },
  asignarPutaOnline: async (codigo: string, dueno: string, esclavo: string) => {
    const res = await safeFetch(`/juegos/online/jugada/asignar_puta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, dueno, esclavo })
    });
    return (res as Response).json();
  },
  tomanTodosOnline: async (codigo: string) => {
    const res = await safeFetch(`/juegos/online/jugada/toman_todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, juego: '' })
    });
    return (res as Response).json();
  },
  terminarJuego: async (codigo: string) => {
    const res = await safeFetch(`/juegos/online/terminar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, juego: '' })
    });
    return (res as Response).json();
  },

  // --- ONLINE: IMPOSTOR ---
  votarImpostor: async (codigo: string, votante: string, acusado: string) => {
    const res = await safeFetch(`/juegos/online/votar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, votante, acusado })
    });
    return (res as Response).json();
  },
  cambiarFaseImpostor: async (codigo: string, fase: string) => {
    const res = await safeFetch(`/juegos/online/cambiar-fase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, fase })
    });
    return (res as Response).json();
  },

  // --- ONLINE: VOTACIÓN ---
  votarEncuesta: async (codigo: string, votante: string, opcion: string) => {
    const res = await safeFetch(`/juegos/online/votar-encuesta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, votante, opcion })
    });
    return (res as Response).json();
  },

  // --- ONLINE: PIRÁMIDE ---
  apostarPiramide: async (codigo: string, nombre: string, apuesta: string) => {
    const res = await safeFetch(`/juegos/online/piramide/apostar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, nombre, apuesta })
    });
    return (res as Response).json();
  },
  voltearCarta: async (codigo: string) => {
    const res = await safeFetch(`/juegos/online/piramide/voltear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    });
    return (res as Response).json();
  },
  // Alias para PiramideOnline que usa este nombre
  finalizarJuegoOnline: async (codigo: string) => {
    const res = await safeFetch(`/juegos/online/terminar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, juego: '' })
    });
    return (res as Response).json();
  },
};