import { useEffect, useMemo, useState } from "react";
import { Player, DrinkResult } from "../types";
import { PlayingCard } from "./PlayingCard";
import { GameModal } from "./GameModal";
import { PutasMap } from "./PutasMap";
import { Button } from "./ui/button";
import { Map, Hand, Menu, Home, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { crearPartida, sacarCarta, asignarPuta, registrarTrago } from "../api/LaPuta";
import type { SacarCartaResponse } from "../api/LaPuta";

// --- helpers ---
function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildDrinkResultsFromNames(names: string[]): DrinkResult[] {
  // Backend devuelve una lista en orden; mostramos a todos con 1 trago
  const chain = names;
  return names.map((n) => ({
    playerId: n,
    playerName: n,
    count: 1,
    chain,
  }));
}

function buildDrinkResultsFromCounts(items: Array<{ nombre: string; tragos: number }>): DrinkResult[] {
  return items.map((x) => ({
    playerId: x.nombre,
    playerName: x.nombre,
    count: x.tragos,
    chain: [],
  }));
}

type Accion =
  | "NINGUNA"
  | "ELEGIR_VICTIMA"
  | "ELEGIR_PERDEDOR"
  | "ELEGIR_PUTA"
  | "INICIAR_DEDITO";

interface GameBoardProps {
  initialPlayers: Player[];
  onRestart: () => void;
  onBackToMenu?: () => void;
}

export function GameBoard({ initialPlayers, onRestart, onBackToMenu }: GameBoardProps) {
  // Normalizamos jugadores para alinear con backend (id = name)
  const initial = useMemo<Player[]>(
    () =>
      (initialPlayers ?? []).map((p) => {
        const name = normalizeName(p.name);
        return {
          ...p,
          id: name,
          name,
          putas: p.putas ?? [],
          dedito: p.dedito ?? false,
          deditoExpiry: p.deditoExpiry,
        };
      }),
    [initialPlayers]
  );

  const [players, setPlayers] = useState<Player[]>(initial);

  // Sala / turno backend
  const [idSala, setIdSala] = useState<string | null>(null);
  const [turno, setTurno] = useState<SacarCartaResponse | null>(null);

  // UI carta actual (backend devuelve string: "5 de Oro")
  const [currentCard, setCurrentCard] = useState<string | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Modales y resultados
  const [showActionModal, setShowActionModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPutasMap, setShowPutasMap] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [drinkResults, setDrinkResults] = useState<DrinkResult[]>([]);
  const [actionMessage, setActionMessage] = useState("");

  // Control de acciones
  const [waitingForAction, setWaitingForAction] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<Accion>("NINGUNA");
  const [drawerName, setDrawerName] = useState<string>(""); // el que sacó la carta
  const [options, setOptions] = useState<string[]>([]);

  // Dedito (local)
  const [turnCounter, setTurnCounter] = useState(0);
  const [deditoMode, setDeditoMode] = useState(false);

  const currentPlayerIndex = useMemo(() => {
    // Si todavía no hubo turno, asumimos índice 0
    if (!drawerName) return 0;
    // Backend ya avanzó el turno al siguiente; nuestro "current" es el siguiente al drawer
    const idx = players.findIndex((p) => p.name === drawerName);
    if (idx === -1) return 0;
    return (idx + 1) % players.length;
  }, [drawerName, players]);

  const currentPlayer = players[currentPlayerIndex];

  // Crear sala al montar
  useEffect(() => {
    const boot = async () => {
      try {
        if (!players || players.length < 2) {
          toast.error("Necesitás al menos 2 jugadores para iniciar");
          onRestart();
          return;
        }

        const jugadores = players.map((p) => p.name);
        const res = await crearPartida({ jugadores });
        setIdSala(res.id_sala);
        setActionMessage(`Sala creada: ${res.id_sala}`);
      } catch (e: any) {
        console.error(e);
        toast.error("No se pudo crear la sala en el backend");
      }
    };

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vencimiento de dedito (local): expira luego de N turnos (players.length)
  useEffect(() => {
    if (!players.length) return;

    setPlayers((prev) =>
      prev.map((p) => {
        if (!p.dedito) return p;
        if (typeof p.deditoExpiry !== "number") return p;
        if (turnCounter >= p.deditoExpiry) {
          return { ...p, dedito: false, deditoExpiry: undefined };
        }
        return p;
      })
    );
  }, [turnCounter, players.length]);

  const resetCardUI = () => {
    setCurrentCard(null);
    setIsCardFlipped(false);
    setActionMessage("");
    setTurno(null);
    setAccionPendiente("NINGUNA");
    setOptions([]);
    setWaitingForAction(false);
    setDeditoMode(false);
  };

  const applyEstadoActualToPlayers = (estado: Record<string, { putas?: string[] }>) => {
    setPlayers((prev) =>
      prev.map((p) => {
        const data = estado[p.name] || estado[p.id];
        const putas = data?.putas ?? [];
        // guardamos IDs como nombres (alineado al backend)
        return { ...p, putas };
      })
    );
  };

  const drawCard = async () => {
    if (!idSala) return;
    if (waitingForAction) return;

    try {
      setWaitingForAction(true);

      const res = await sacarCarta({ id_sala: idSala });
      setTurno(res);

      setDrawerName(res.jugador);
      setCurrentCard(res.carta);
      setIsCardFlipped(true);

      // Incrementamos contador de turnos (para dedito local)
      setTurnCounter((t) => t + 1);

      // Mensaje principal: regla
      setActionMessage(res.regla);

      const accion = (res.accion_requerida ?? "NINGUNA") as Accion;
      setAccionPendiente(accion);

      const extra = res.datos_extra ?? {};

      // Resolver según acción
      if (accion === "NINGUNA") {
        // Caso típico: "1" (toma vos y sus putas) devuelve toman_lista
        if (Array.isArray((extra as any).toman_lista)) {
          const names = (extra as any).toman_lista as string[];
          setDrinkResults(buildDrinkResultsFromNames(names));
          setShowResultModal(true);
        } else if (Array.isArray((extra as any).detalle_toman_todos)) {
          const items = (extra as any).detalle_toman_todos as Array<{ nombre: string; tragos: number }>;
          setDrinkResults(buildDrinkResultsFromCounts(items));
          setShowResultModal(true);
        } else {
          // Nada más que hacer (ej: carta 12 descanso)
          // Dejamos que el usuario continúe manualmente (cerrando el modal de resultado no aplica aquí)
          setWaitingForAction(false);
        }
        return;
      }

      if (accion === "INICIAR_DEDITO") {
        // Dedito es local: se asigna al que sacó la carta
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.name !== normalizeName(res.jugador)) return p;
            return {
              ...p,
              dedito: true,
              deditoExpiry: turnCounter + players.length, // expira en N turnos
            };
          })
        );
        setActionMessage(`${res.jugador} activó el Dedito 👆`);
        setWaitingForAction(false);
        return;
      }

      // Acciones que requieren elegir alguien
      if (accion === "ELEGIR_VICTIMA" || accion === "ELEGIR_PERDEDOR" || accion === "ELEGIR_PUTA") {
        const opts = Array.isArray((extra as any).opciones) ? ((extra as any).opciones as string[]) : [];
        setOptions(opts);

        setShowActionModal(true);
        // seguimos esperando hasta que el usuario elija
        return;
      }

      setWaitingForAction(false);
    } catch (e: any) {
      console.error(e);
      toast.error("Error al sacar carta. Verificá que el backend esté corriendo.");
      setWaitingForAction(false);
    }
  };

  const handlePlayerChoice = async (targetNameRaw: string) => {
    if (!idSala) return;

    const targetName = normalizeName(targetNameRaw);

    try {
      // Dedito mode: usar dedito fuera del flujo normal (pero computamos por backend)
      if (deditoMode) {
        const res = await registrarTrago({ id_sala: idSala, perdedor: targetName });
        setDrinkResults(buildDrinkResultsFromNames(res.toman ?? []));
        setShowActionModal(false);
        setShowResultModal(true);
        setWaitingForAction(false);
        // No reseteamos deditoMode acá, se hace al cerrar resultados
        return;
      }

      if (!turno) return;

      if (accionPendiente === "ELEGIR_PUTA") {
        const res = await asignarPuta({
          id_sala: idSala,
          dueño: drawerName,
          mascota: targetName,
        });

        if (res?.estado_actual) {
          applyEstadoActualToPlayers(res.estado_actual);
        }

        setActionMessage(res?.mensaje ?? `${drawerName} asignó una puta`);
        setShowActionModal(false);
        setWaitingForAction(false);

        // No necesariamente hay "toman" acá; el juego sigue
        return;
      }

      if (accionPendiente === "ELEGIR_VICTIMA" || accionPendiente === "ELEGIR_PERDEDOR") {
        const res = await registrarTrago({ id_sala: idSala, perdedor: targetName });

        setActionMessage(res?.mensaje ?? `Perdió ${targetName}.`);
        setDrinkResults(buildDrinkResultsFromNames(res.toman ?? []));

        setShowActionModal(false);
        setShowResultModal(true);
        setWaitingForAction(false);
        return;
      }

      setWaitingForAction(false);
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo completar la acción con el backend");
      setWaitingForAction(false);
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);

    // Si estábamos en deditoMode, no reiniciamos flujo completo; solo salimos del modo dedito
    if (deditoMode) {
      setDeditoMode(false);
      return;
    }

    // Limpiamos UI de carta y acción
    setTimeout(() => {
      resetCardUI();
    }, 250);
  };

  const useDedito = () => {
    // Dedito lo tiene el jugador actual (siguiente al drawer)
    const p = currentPlayer;
    if (!p?.dedito) return;

    setShowMenu(false);
    setWaitingForAction(true);
    setActionMessage(`${p.name} usó el Dedito 👆 Elegí quién toma`);
    setOptions(players.map((x) => x.name).filter((n) => n !== p.name));
    setShowActionModal(true);

    // Removemos dedito local
    setPlayers((prev) =>
      prev.map((x) => (x.name === p.name ? { ...x, dedito: false, deditoExpiry: undefined } : x))
    );

    setDeditoMode(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl mb-1">La Puta 8.0</h1>
              <p className="text-sm text-white/80">
                Turno de: <span className="font-bold">{currentPlayer?.name ?? "—"}</span>
                {currentPlayer?.dedito && " 👆"}
              </p>
              {idSala && <p className="text-xs text-white/70 mt-1">Sala: {idSala}</p>}
            </div>

            <Button
              onClick={() => setShowMenu(true)}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-2xl"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Card Area */}
        <div className="flex flex-col items-center justify-center mb-8 min-h-[400px]">
          {!currentCard && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <PlayingCard card={null} onClick={drawCard} />
              <p className="text-white mt-4 text-lg">Tocá para sacar una carta</p>
            </motion.div>
          )}

          {currentCard && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <PlayingCard card={currentCard} isFlipped={isCardFlipped} />
              {actionMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white mt-4 text-xl bg-black/30 backdrop-blur-sm rounded-2xl px-6 py-3"
                >
                  {actionMessage}
                </motion.p>
              )}
            </motion.div>
          )}
        </div>

        {/* Players Display */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4">
          <div className="grid grid-cols-2 gap-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`rounded-2xl p-3 transition-all ${
                  index === currentPlayerIndex ? "bg-white text-gray-800 shadow-lg scale-105" : "bg-white/10 text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      index === currentPlayerIndex
                        ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{player.name}</p>
                    {player.dedito && <p className="text-xs opacity-80">Tiene dedito 👆</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Modal - Elegir jugador */}
      <GameModal
        isOpen={showActionModal}
        onClose={() => {}}
        title={accionPendiente === "ELEGIR_PUTA" ? "Elegí una puta" : "Elegí quién toma"}
        showCloseButton={false}
      >
        <div className="space-y-2">
          {options
            .map((n) => normalizeName(n))
            .filter((n) => n !== normalizeName(drawerName) || deditoMode) // en modo normal, backend ya suele excluir dueño en ELEGIR_PUTA
            .filter((n) => n !== normalizeName(currentPlayer?.name ?? "") ? true : true)
            .map((name) => (
              <Button
                key={name}
                onClick={() => handlePlayerChoice(name)}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                  {name.charAt(0).toUpperCase()}
                </div>
                {name}
              </Button>
            ))}
        </div>
      </GameModal>

      {/* Result Modal - Quién toma */}
      <GameModal isOpen={showResultModal} onClose={closeResultModal} title="Toman:">
        <div className="space-y-3">
          {drinkResults.map((result, index) => (
            <div key={`${result.playerId}-${index}`} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-gray-800">{result.playerName}</p>
                    <p className="text-xs text-gray-500">
                      {result.count} {result.count === 1 ? "trago" : "tragos"}
                    </p>
                  </div>
                </div>
                <div className="text-3xl">{result.count === 1 ? "🍺" : result.count === 2 ? "🍺🍺" : "🍻"}</div>
              </div>
              {result.chain.length > 1 && (
                <div className="text-xs text-gray-600 mt-2 bg-white/50 rounded-xl p-2">
                  Cadena: {result.chain.join(" → ")}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={closeResultModal}
          className="w-full mt-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
        >
          Continuar
        </Button>
      </GameModal>

      {/* Putas Map Modal */}
      <GameModal isOpen={showPutasMap} onClose={() => setShowPutasMap(false)} title="Mapa de Putas">
        <PutasMap players={players} />
      </GameModal>

      {/* Menu Modal */}
      <GameModal isOpen={showMenu} onClose={() => setShowMenu(false)} title="Menú">
        <div className="space-y-3">
          {currentPlayer?.dedito && (
            <Button
              onClick={useDedito}
              className="w-full rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-4 justify-start"
            >
              <Hand className="w-5 h-5 mr-3" />
              Usar Dedito 👆
            </Button>
          )}

          <Button
            onClick={() => {
              setShowMenu(false);
              setShowPutasMap(true);
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 justify-start"
          >
            <Map className="w-5 h-5 mr-3" />
            Ver Mapa de Putas
          </Button>

          <Button
            onClick={() => {
              if (confirm("¿Estás seguro que querés reiniciar el juego?")) {
                onRestart();
              }
            }}
            variant="outline"
            className="w-full rounded-2xl py-4 justify-start border-2"
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            Reiniciar Juego
          </Button>

          {onBackToMenu && (
            <Button
              onClick={() => {
                if (confirm("¿Querés volver al menú? Se perderá el progreso del juego.")) {
                  onBackToMenu();
                }
              }}
              variant="outline"
              className="w-full rounded-2xl py-4 justify-start border-2"
            >
              <Home className="w-5 h-5 mr-3" />
              Volver al Menú
            </Button>
          )}
        </div>
      </GameModal>
    </div>
  );
}
