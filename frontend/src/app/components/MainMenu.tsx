import { motion } from 'motion/react';
import { Button } from './ui/button';
import { LogOut, Trophy, Pyramid, MessageCircleQuestion, Flame, Spade, Server } from 'lucide-react';

interface MainMenuProps {
  username: string;
  onSelectGame: (game: string) => void;
  onLogout: () => void;
}

interface GameCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  emoji: string;
}

export function MainMenu({ username, onSelectGame, onLogout }: MainMenuProps) {
  const games: GameCard[] = [
    {
      id: 'la-puta',
      title: 'La Puta 8.0',
      description: 'Juego de cartas con relaciones en cadena',
      icon: <Spade className="w-8 h-8" />,
      gradient: 'from-purple-600 to-pink-600',
      emoji: '🃏'
    },
    {
      id: 'pyramid',
      title: 'La Pirámide',
      description: 'Adivina las cartas y reparte tragos',
      icon: <Pyramid className="w-8 h-8" />,
      gradient: 'from-yellow-500 to-orange-600',
      emoji: '🔺'
    },
    {
      id: 'questions',
      title: 'Preguntas',
      description: 'Ronda de preguntas comprometedoras',
      icon: <MessageCircleQuestion className="w-8 h-8" />,
      gradient: 'from-blue-500 to-cyan-500',
      emoji: '❓'
    },
    {
      id: 'spicy',
      title: 'Picantes',
      description: 'Retos y desafíos atrevidos',
      icon: <Flame className="w-8 h-8" />,
      gradient: 'from-red-500 to-pink-500',
      emoji: '🌶️'
    }
,
    {
      id: 'backend-test',
      title: 'Backend',
      description: 'Probar conexión con el servidor',
      icon: <Server className="w-8 h-8" />,
      gradient: 'from-emerald-500 to-teal-600',
      emoji: '🔌'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 text-white"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-white/80 mb-1">Bienvenido/a</p>
              <h1 className="text-3xl">¡Hola, {username}! 👋</h1>
            </div>
            <Button
              onClick={onLogout}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-2xl"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Salir
            </Button>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl text-white mb-2">Elegí un Juego</h2>
          <p className="text-white/80">Seleccioná tu juego favorito para comenzar</p>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => onSelectGame(game.id)}
                className={`w-full bg-gradient-to-br ${game.gradient} rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all text-left group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 group-hover:bg-white/30 transition-all">
                    {game.icon}
                  </div>
                  <div className="text-5xl">{game.emoji}</div>
                </div>
                <h3 className="text-2xl mb-2">{game.title}</h3>
                <p className="text-white/90 text-sm">{game.description}</p>
                <div className="mt-4 flex items-center text-sm text-white/80">
                  <span className="mr-2">Jugar ahora</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Stats/Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-white text-center"
        >
          <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
          <p className="text-sm text-white/80">
            Todos los juegos incluyen persistencia y multijugador local
          </p>
        </motion.div>
      </div>
    </div>
  );
}
