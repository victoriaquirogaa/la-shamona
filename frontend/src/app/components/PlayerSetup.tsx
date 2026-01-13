import { useMemo, useState } from "react";
import { Player } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, UserPlus, Play, ArrowLeft } from "lucide-react";

interface PlayerSetupProps {
  onStartGame: (players: Player[]) => void;
  initialPlayers?: Player[];
  onBack?: () => void;
}

function normalizeName(name: string) {
  // Igual a backend: strip + Title Case
  return name.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PlayerSetup({ onStartGame, initialPlayers = [], onBack }: PlayerSetupProps) {
  const normalizedInitial = useMemo<Player[]>(
    () =>
      initialPlayers.map((p) => {
        const n = normalizeName(p.name);
        return {
          ...p,
          name: n,
          id: n, // clave estable y compatible con backend
          putas: p.putas ?? [],
          dedito: p.dedito ?? false,
        };
      }),
    [initialPlayers]
  );

  const [players, setPlayers] = useState<Player[]>(normalizedInitial);
  const [newPlayerName, setNewPlayerName] = useState("");

  const addPlayer = () => {
    const raw = newPlayerName.trim();
    if (!raw) return;

    const name = normalizeName(raw);

    // Evitar duplicados por nombre (backend trabaja por nombre)
    const exists = players.some((p) => p.name === name);
    if (exists) {
      setNewPlayerName("");
      return;
    }

    const newPlayer: Player = {
      id: name,
      name,
      putas: [],
      dedito: false,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setNewPlayerName("");
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPlayer();
    }
  };

  const canStart = players.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-white/20 rounded-2xl mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Menú
          </Button>
        )}

        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2">🍻</h1>
            <h2 className="text-3xl text-gray-800 mb-1">La Puta 8.0</h2>
            <p className="text-gray-600 text-sm">Juego de cartas social</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nombre del jugador"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded-2xl border-2 border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:ring-0"
              />
              <Button
                onClick={addPlayer}
                disabled={!newPlayerName.trim()}
                className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-6 shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
              </Button>
            </div>

            {players.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Agregá al menos 2 jugadores para comenzar</p>
              </div>
            )}

            {players.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 transition-all hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm">
                        {index + 1}
                      </div>
                      <span className="text-gray-800">{player.name}</span>
                    </div>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={() => onStartGame(players)}
            disabled={!canStart}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 mr-2" />
            {canStart ? "Comenzar Juego" : `Faltan ${2 - players.length} jugadores`}
          </Button>
        </div>

        {players.length > 0 && (
          <p className="text-center text-white/80 text-sm mt-4">
            {players.length} {players.length === 1 ? "jugador agregado" : "jugadores agregados"}
          </p>
        )}
      </div>
    </div>
  );
}
