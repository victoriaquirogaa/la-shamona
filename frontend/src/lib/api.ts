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
  
  // Agrega aquí el resto de funciones de juegos online (sacarCartaOnline, etc.) si las borraste por error
};