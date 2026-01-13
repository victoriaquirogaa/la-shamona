import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Card } from '../../types';
import { createDeck, getSuitEmoji } from '../../gameLogic';
import { PlayingCard } from '../PlayingCard';
import { GameModal } from '../GameModal';

interface PyramidProps {
  username: string;
  onBack: () => void;
}

interface PyramidCard extends Card {
  revealed: boolean;
  position: { row: number; col: number };
}

export function Pyramid({ username, onBack }: PyramidProps) {
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [pyramidCards, setPyramidCards] = useState<PyramidCard[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const deck = createDeck();
    
    // Dar 4 cartas al jugador
    const player = deck.splice(0, 4);
    setPlayerCards(player);

    // Crear la pirámide (5 niveles)
    const pyramid: PyramidCard[] = [];
    let cardIndex = 0;
    
    for (let row = 0; row < 5; row++) {
      const cardsInRow = row + 1;
      for (let col = 0; col < cardsInRow; col++) {
        pyramid.push({
          ...deck[cardIndex],
          revealed: false,
          position: { row, col }
        });
        cardIndex++;
      }
    }

    setPyramidCards(pyramid);
    setGameStarted(false);
    setCurrentLevel(0);
  };

  const startGame = () => {
    setShowInstructions(false);
    setGameStarted(true);
  };

  const revealCard = (index: number) => {
    const card = pyramidCards[index];
    if (card.revealed || card.position.row !== currentLevel) return;

    const updated = [...pyramidCards];
    updated[index].revealed = true;
    setPyramidCards(updated);

    // Verificar si el nivel está completo
    const levelCards = pyramidCards.filter(c => c.position.row === currentLevel);
    const allRevealed = levelCards.every(c => c.revealed);
    
    if (allRevealed && currentLevel < 4) {
      setTimeout(() => {
        setCurrentLevel(currentLevel + 1);
      }, 1000);
    }
  };

  const getDrinkValue = (row: number): number => {
    return row + 1; // Fila 0 = 1 trago, Fila 4 = 5 tragos
  };

  const getLevelName = (row: number): string => {
    const names = ['Nivel 1 - Dale', 'Nivel 2 - Reparte 2', 'Nivel 3 - Reparte 3', 'Nivel 4 - Reparte 4', 'Nivel 5 - Reparte 5'];
    return names[row];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 mb-6 text-white">
          <div className="flex justify-between items-center">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-2xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-2xl">🔺 La Pirámide</h1>
              {gameStarted && (
                <p className="text-sm text-white/80">
                  {getLevelName(currentLevel)}
                </p>
              )}
            </div>
            <Button
              onClick={initGame}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-2xl"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {gameStarted ? (
          <>
            {/* Pyramid */}
            <div className="mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map(row => {
                    const rowCards = pyramidCards.filter(c => c.position.row === row);
                    const isActive = row === currentLevel;
                    
                    return (
                      <motion.div
                        key={row}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: row * 0.1 }}
                        className="flex justify-center gap-2"
                      >
                        {rowCards.map((card, idx) => {
                          const globalIndex = pyramidCards.indexOf(card);
                          return (
                            <motion.div
                              key={globalIndex}
                              whileHover={isActive && !card.revealed ? { scale: 1.05 } : {}}
                              className={`relative ${isActive && !card.revealed ? 'cursor-pointer' : ''}`}
                              onClick={() => isActive && !card.revealed && revealCard(globalIndex)}
                            >
                              {card.revealed ? (
                                <div className="w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center border-2 border-gray-200">
                                  <div className="text-center">
                                    <div className="text-2xl">{card.number}</div>
                                    <div className="text-lg">{getSuitEmoji(card.suit)}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className={`w-16 h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-lg shadow-lg flex items-center justify-center border-2 ${
                                  isActive ? 'border-yellow-400 animate-pulse' : 'border-white/20'
                                }`}>
                                  <div className="text-white/30 text-2xl">🎴</div>
                                </div>
                              )}
                              {isActive && !card.revealed && (
                                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                  {getDrinkValue(row)}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Indicator */}
                <div className="mt-6 text-center">
                  <div className="inline-flex bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-white">
                    <p className="text-sm">
                      {currentLevel < 4 
                        ? `Revelá las cartas del ${getLevelName(currentLevel)}`
                        : '¡Pirámide completada! 🎉'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Cards */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
              <p className="text-white text-center mb-4">Tus cartas</p>
              <div className="flex justify-center gap-3">
                {playerCards.map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedCard(idx)}
                  >
                    <div className={`w-20 h-28 bg-white rounded-xl shadow-lg flex items-center justify-center border-4 ${
                      selectedCard === idx ? 'border-yellow-400' : 'border-gray-200'
                    }`}>
                      <div className="text-center">
                        <div className="text-3xl">{card.number}</div>
                        <div className="text-2xl">{getSuitEmoji(card.suit)}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="text-white/80 text-sm text-center mt-4">
                Si tu carta coincide con una revelada, repartís tragos iguales al nivel
              </p>
            </div>
          </>
        ) : null}

        {/* Instructions Modal */}
        <GameModal
          isOpen={showInstructions}
          onClose={() => {}}
          title="Cómo Jugar - La Pirámide"
          showCloseButton={false}
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-2xl p-4">
              <p className="text-gray-800 mb-3">
                <strong>Objetivo:</strong> Adivinar tus cartas y repartir tragos
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p>📌 <strong>1.</strong> Recibirás 4 cartas (no las mires aún)</p>
                <p>📌 <strong>2.</strong> Se revelan las cartas de la pirámide nivel por nivel</p>
                <p>📌 <strong>3.</strong> Si una carta revelada coincide con una tuya, repartís tragos</p>
                <p>📌 <strong>4.</strong> Nivel 1 = 1 trago, Nivel 2 = 2 tragos... hasta 5</p>
                <p>📌 <strong>5.</strong> ¡Memorizá tus cartas para repartir más!</p>
              </div>
            </div>
            <Button
              onClick={startGame}
              className="w-full rounded-2xl bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-4"
            >
              ¡Empezar a Jugar!
            </Button>
          </div>
        </GameModal>
      </div>
    </div>
  );
}
