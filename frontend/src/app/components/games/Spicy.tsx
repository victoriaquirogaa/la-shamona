import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { ArrowLeft, Dices, Flame, Zap, Heart } from 'lucide-react';
import { GameModal } from '../GameModal';

interface SpicyProps {
  username: string;
  onBack: () => void;
}

interface Challenge {
  text: string;
  level: 'mild' | 'medium' | 'hot';
  drinks: number;
}

export function Spicy({ username, onBack }: SpicyProps) {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [challengeHistory, setChallengeHistory] = useState<Challenge[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [showResult, setShowResult] = useState(false);

  const challenges: Challenge[] = [
    // Mild
    { text: 'Cantá una canción romántica a alguien del grupo', level: 'mild', drinks: 2 },
    { text: 'Contá un chiste. Si nadie se ríe, tomás doble', level: 'mild', drinks: 2 },
    { text: 'Hacé 10 flexiones o tomá 3 tragos', level: 'mild', drinks: 3 },
    { text: 'Imitá a alguien del grupo hasta que adivinen quién es', level: 'mild', drinks: 2 },
    { text: 'Hablá con acento extranjero durante 3 turnos', level: 'mild', drinks: 2 },
    { text: 'Bailá solo/a durante 30 segundos', level: 'mild', drinks: 2 },
    
    // Medium
    { text: 'Dale un masaje de hombros a la persona de tu derecha', level: 'medium', drinks: 3 },
    { text: 'Mandá un mensaje a tu último contacto diciendo "Te extraño"', level: 'medium', drinks: 4 },
    { text: 'Dejá que alguien vea tus últimas 5 fotos', level: 'medium', drinks: 3 },
    { text: 'Contá tu secreto más vergonzoso o tomá 5 tragos', level: 'medium', drinks: 5 },
    { text: 'Intercambiá una prenda con alguien del grupo', level: 'medium', drinks: 3 },
    { text: 'Comé o tomá algo con los ojos vendados', level: 'medium', drinks: 3 },
    { text: 'Llamá a alguien y decile que estás enamorado/a', level: 'medium', drinks: 4 },
    
    // Hot
    { text: 'Dale un beso en la mejilla a cada persona del grupo', level: 'hot', drinks: 5 },
    { text: 'Revelá tu crush actual del grupo o tomá 7 tragos', level: 'hot', drinks: 7 },
    { text: 'Verdad o reto: respondé cualquier pregunta con total honestidad', level: 'hot', drinks: 5 },
    { text: '7 minutos en el cielo con alguien que elija el grupo', level: 'hot', drinks: 6 },
    { text: 'Mostrá tu chat más comprometedor o tomá 8 tragos', level: 'hot', drinks: 8 },
    { text: 'Hacé un lap dance de 30 segundos a alguien', level: 'hot', drinks: 6 },
    { text: 'Dale un beso en los labios a quien tú elijas o tomá 10 tragos', level: 'hot', drinks: 10 },
    { text: 'Contá tu fantasía más hot en detalle', level: 'hot', drinks: 6 }
  ];

  const getRandomChallenge = () => {
    let availableChallenges = challenges.filter(c => 
      !challengeHistory.includes(c) && 
      (selectedLevel === 'all' || c.level === selectedLevel)
    );

    if (availableChallenges.length === 0) {
      setChallengeHistory([]);
      availableChallenges = challenges.filter(c => 
        selectedLevel === 'all' || c.level === selectedLevel
      );
    }

    const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
    setCurrentChallenge(randomChallenge);
    setChallengeHistory([...challengeHistory, randomChallenge]);
    setShowResult(false);
  };

  const getLevelInfo = (level: string) => {
    const levels: Record<string, { name: string; emoji: string; color: string; icon: React.ReactNode }> = {
      all: { name: 'Todos', emoji: '🎲', color: 'from-purple-500 to-pink-500', icon: <Dices className="w-6 h-6" /> },
      mild: { name: 'Suave', emoji: '😊', color: 'from-green-500 to-emerald-500', icon: <Heart className="w-6 h-6" /> },
      medium: { name: 'Medio', emoji: '😏', color: 'from-yellow-500 to-orange-500', icon: <Zap className="w-6 h-6" /> },
      hot: { name: 'Picante', emoji: '🔥', color: 'from-red-500 to-pink-600', icon: <Flame className="w-6 h-6" /> }
    };
    return levels[level] || levels.all;
  };

  const selectLevel = (level: string) => {
    setSelectedLevel(level);
    setShowLevelModal(false);
    setChallengeHistory([]);
    setCurrentChallenge(null);
  };

  const handleAccept = () => {
    setShowResult(true);
  };

  const handleReject = () => {
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-pink-600 to-orange-600 p-4">
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
              <h1 className="text-2xl">🌶️ Picantes</h1>
              <p className="text-sm text-white/80">
                {getLevelInfo(selectedLevel).name} {getLevelInfo(selectedLevel).emoji}
              </p>
            </div>
            <Button
              onClick={() => setShowLevelModal(true)}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-2xl"
            >
              {getLevelInfo(selectedLevel).icon}
            </Button>
          </div>
        </div>

        {/* Challenge Card */}
        <AnimatePresence mode="wait">
          {currentChallenge ? (
            <motion.div
              key={currentChallenge.text}
              initial={{ scale: 0.8, opacity: 0, rotateX: -90 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateX: 90 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className={`bg-gradient-to-br ${getLevelInfo(currentChallenge.level).color} rounded-3xl shadow-2xl p-8 min-h-[350px] flex flex-col justify-between text-white`}>
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 text-sm`}>
                      {getLevelInfo(currentChallenge.level).name}
                    </div>
                    <div className="text-5xl">
                      {getLevelInfo(currentChallenge.level).emoji}
                    </div>
                  </div>
                  
                  <h2 className="text-3xl mb-6 text-center">
                    {currentChallenge.text}
                  </h2>
                </div>

                {!showResult ? (
                  <div className="space-y-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                      <p className="text-sm">
                        Si no lo hacés: <strong>{currentChallenge.drinks} tragos</strong> 🍺
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleAccept}
                        className="rounded-2xl bg-white text-gray-800 hover:bg-gray-100 py-4"
                      >
                        ✅ Lo hago
                      </Button>
                      <Button
                        onClick={handleReject}
                        className="rounded-2xl bg-black/30 hover:bg-black/40 text-white py-4"
                      >
                        ❌ Prefiero tomar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center"
                  >
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-lg">¡Reto completado!</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8"
            >
              <div className="bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl p-8 min-h-[350px] flex items-center justify-center border-2 border-white/30 border-dashed">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">🌶️</div>
                  <p className="text-xl">Tocá "Nuevo Reto" para comenzar</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={getRandomChallenge}
            className="w-full rounded-2xl bg-white text-gray-800 hover:bg-gray-100 py-6 text-lg shadow-lg"
          >
            <Dices className="w-5 h-5 mr-2" />
            {currentChallenge && showResult ? 'Siguiente Reto' : 'Nuevo Reto'}
          </Button>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-white text-center">
            <p className="text-sm text-white/80">
              {challengeHistory.length} reto{challengeHistory.length !== 1 ? 's' : ''} realizado{challengeHistory.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-yellow-500/20 backdrop-blur-lg rounded-2xl p-4 text-white border-2 border-yellow-500/50"
        >
          <p className="text-sm text-center">
            ⚠️ Recordá: todo debe ser consensuado y con respeto
          </p>
        </motion.div>
      </div>

      {/* Level Selection Modal */}
      <GameModal
        isOpen={showLevelModal}
        onClose={() => currentChallenge ? setShowLevelModal(false) : null}
        title="Elegí el Nivel de Intensidad"
        showCloseButton={!!currentChallenge}
      >
        <div className="space-y-3">
          {['all', 'mild', 'medium', 'hot'].map((lvl) => {
            const info = getLevelInfo(lvl);
            return (
              <Button
                key={lvl}
                onClick={() => selectLevel(lvl)}
                className={`w-full rounded-2xl bg-gradient-to-r ${info.color} hover:opacity-90 text-white py-4 justify-start text-left`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{info.emoji}</div>
                  <div className="flex-1">
                    <p className="font-bold">{info.name}</p>
                    <p className="text-xs text-white/80">
                      {lvl === 'all' ? 'Mezcla de todos los niveles' : 
                       lvl === 'mild' ? 'Retos suaves y divertidos' :
                       lvl === 'medium' ? 'Retos más atrevidos' :
                       'Retos picantes y extremos'}
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-full px-3 py-1 text-sm">
                    {lvl === 'mild' ? '2-3' : lvl === 'medium' ? '3-5' : lvl === 'hot' ? '5-10' : '2-10'} 🍺
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </GameModal>
    </div>
  );
}