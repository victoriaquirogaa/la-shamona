import { Card } from "../types";
import { getSuitEmoji, getSuitName } from "../gameLogic";
import { motion } from "motion/react";

type BackendCard = string; // ej: "5 de Oro", "10 de Espada"

interface PlayingCardProps {
  card: Card | BackendCard | null;
  isFlipped?: boolean;
  onClick?: () => void;
}

function parseBackendCard(raw: string): Card | null {
  // Espera: "<numero> de <palo>" donde palo = Espada|Basto|Oro|Copa
  // Ej: "5 de Oro"
  const m = raw.trim().match(/^(\d{1,2})\s+de\s+(.+)$/i);
  if (!m) return null;

  const number = Number(m[1]);
  const palo = m[2].trim().toLowerCase();

  const suitMap: Record<string, Card["suit"]> = {
    oro: "oros",
    oros: "oros",
    copa: "copas",
    copas: "copas",
    espada: "espadas",
    espadas: "espadas",
    basto: "bastos",
    bastos: "bastos",
  };

  const suit = suitMap[palo];
  if (!suit) return null;
  if (!Number.isFinite(number) || number < 1 || number > 12) return null;

  return { number, suit };
}

export function PlayingCard({ card, isFlipped = false, onClick }: PlayingCardProps) {
  // Estado sin carta (dorso clickeable)
  if (!card) {
    return (
      <div
        onClick={onClick}
        className="w-48 h-72 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-2xl cursor-pointer flex items-center justify-center border-4 border-white/20"
      >
        <div className="text-white/30 text-6xl">🎴</div>
      </div>
    );
  }

  // Si viene del backend como string, lo parseamos a Card
  const normalizedCard: Card | null =
    typeof card === "string" ? parseBackendCard(card) : card;

  // Si no se pudo parsear, mostramos una carta genérica con el texto
  if (!normalizedCard) {
    return (
      <div
        onClick={onClick}
        className="w-48 h-72 bg-white rounded-2xl shadow-2xl border-4 border-gray-200 p-4 flex flex-col justify-between cursor-pointer"
      >
        <div className="text-sm text-gray-500">Carta</div>
        <div className="text-center text-xl text-gray-800 font-semibold">
          {typeof card === "string" ? card : "Carta"}
        </div>
        <div className="text-xs text-gray-400 text-center">Formato no reconocido</div>
      </div>
    );
  }

  const suitColors: Record<Card["suit"], string> = {
    oros: "text-yellow-600",
    copas: "text-red-600",
    espadas: "text-gray-800",
    bastos: "text-green-700",
  };

  return (
    <motion.div
      initial={{ rotateY: 180, scale: 0.8 }}
      animate={{ rotateY: isFlipped ? 0 : 180, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ transformStyle: "preserve-3d" }}
      onClick={onClick}
      className="w-48 h-72 cursor-pointer"
    >
      <div className="w-full h-full relative" style={{ transformStyle: "preserve-3d" }}>
        {/* Frente */}
        <div
          className="absolute inset-0 bg-white rounded-2xl shadow-2xl border-4 border-gray-200 p-4 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Número superior */}
          <div className="flex justify-between items-start">
            <div className={`text-4xl ${suitColors[normalizedCard.suit]}`}>
              {normalizedCard.number}
            </div>
            <div className="text-2xl">{getSuitEmoji(normalizedCard.suit)}</div>
          </div>

          {/* Centro */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-7xl mb-2 ${suitColors[normalizedCard.suit]}`}>
                {normalizedCard.number}
              </div>
              <div className="text-4xl mb-1">{getSuitEmoji(normalizedCard.suit)}</div>
              <div className={`text-sm uppercase tracking-wider ${suitColors[normalizedCard.suit]}`}>
                {getSuitName(normalizedCard.suit)}
              </div>
            </div>
          </div>

          {/* Número inferior */}
          <div className="flex justify-between items-end rotate-180">
            <div className={`text-4xl ${suitColors[normalizedCard.suit]}`}>
              {normalizedCard.number}
            </div>
            <div className="text-2xl">{getSuitEmoji(normalizedCard.suit)}</div>
          </div>
        </div>

        {/* Dorso */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-2xl border-4 border-white/20 flex items-center justify-center"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="text-white/30 text-6xl">🎴</div>
        </div>
      </div>
    </motion.div>
  );
}
