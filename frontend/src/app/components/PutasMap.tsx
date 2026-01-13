import { Player } from "../types";
import { ArrowRight, Users, AlertTriangle } from "lucide-react";

interface PutasMapProps {
  players: Player[];
}

export function PutasMap({ players }: PutasMapProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No hay jugadores todavía</p>
      </div>
    );
  }

  const hasAnyPutas = players.some((p) => (p.putas?.length ?? 0) > 0);

  if (!hasAnyPutas) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="mb-2">🤝</p>
        <p className="text-sm">Todavía no hay putas asignadas</p>
        <p className="text-xs mt-2">Las putas se asignan con la carta 5</p>
      </div>
    );
  }

  // Helper: en este proyecto estamos alineando id = name (Title Case),
  // pero por robustez buscamos por id o por name.
  const findPlayer = (idOrName: string) =>
    players.find((p) => p.id === idOrName) || players.find((p) => p.name === idOrName);

  // Detectar referencias rotas (putas que no existen en players)
  const brokenLinks = players.flatMap((p) =>
    (p.putas ?? []).filter((putaId) => !findPlayer(putaId)).map((putaId) => ({ owner: p.name, putaId }))
  );

  return (
    <div className="space-y-4">
      {brokenLinks.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-yellow-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Hay relaciones desincronizadas</p>
              <p className="text-xs text-yellow-800 mt-1">
                Esto pasa si el mapa del front quedó viejo respecto al backend. Reiniciá la partida si persiste.
              </p>
              <ul className="text-xs mt-2 list-disc pl-5">
                {brokenLinks.slice(0, 5).map((x, idx) => (
                  <li key={`${x.owner}-${x.putaId}-${idx}`}>
                    {x.owner} → {x.putaId}
                  </li>
                ))}
                {brokenLinks.length > 5 && <li>…y {brokenLinks.length - 5} más</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {players.map((player) => {
        const puts = player.putas ?? [];
        if (puts.length === 0) return null;

        return (
          <div key={player.id} className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-800">{player.name}</p>
                <p className="text-xs text-gray-500">
                  {puts.length} {puts.length === 1 ? "puta" : "putas"}
                </p>
              </div>
            </div>

            <div className="space-y-2 pl-4">
              {puts.map((putaId) => {
                const puta = findPlayer(putaId);
                if (!puta) {
                  return (
                    <div key={putaId} className="flex items-center gap-2 text-sm text-gray-500">
                      <ArrowRight className="w-4 h-4 text-purple-500" />
                      <span className="line-through">{putaId}</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        No encontrado
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={puta.id} className="flex items-center gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-700">{puta.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {players.every((p) => (p.putas?.length ?? 0) === 0) && (
        <div className="text-center py-4 text-gray-400 text-sm">No hay relaciones activas</div>
      )}
    </div>
  );
}
