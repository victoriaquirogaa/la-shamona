import { api } from "./client";

const BASE = "/juegos/la-puta";

export type AccionRequerida =
  | "NINGUNA"
  | "ELEGIR_VICTIMA"
  | "ELEGIR_PUTA"
  | "INICIAR_DEDITO"
  | "ELEGIR_PERDEDOR";

export type SacarCartaResponse = {
  carta: string; // "5 de Oro"
  jugador: string; // nombre del jugador actual
  regla: string; // texto regla
  accion_requerida: AccionRequerida;
  datos_extra: any; // { opciones: [...] } | { toman_lista: [...] } | { detalle_toman_todos: [...] } | etc
};

export type EstadoActual = Record<string, { putas?: string[] }>;

export type CrearPartidaRequest = { jugadores: string[] };
export type CrearPartidaResponse = { id_sala: string; mensaje: string };

export type SacarCartaRequest = { id_sala: string };

export type AsignarPutaRequest = { id_sala: string; dueño: string; mascota: string };
export type AsignarPutaResponse = { mensaje: string; estado_actual: EstadoActual };

export type RegistrarTragoRequest = { id_sala: string; perdedor: string };
export type RegistrarTragoResponse = { mensaje: string; toman: string[]; cantidad_afectados: number };

export async function crearPartida(payload: CrearPartidaRequest) {
  return api<CrearPartidaResponse>(`${BASE}/crear`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sacarCarta(payload: SacarCartaRequest) {
  return api<SacarCartaResponse>(`${BASE}/sacar-carta`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function asignarPuta(payload: AsignarPutaRequest) {
  return api<AsignarPutaResponse>(`${BASE}/asignar-puta`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registrarTrago(payload: RegistrarTragoRequest) {
  return api<RegistrarTragoResponse>(`${BASE}/registrar-trago`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
