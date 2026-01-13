import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { User, LogIn } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLogin: (username: string) => void;
}

function normalizeName(name: string) {
  // Igual que backend: strip + Title Case
  return name.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");

  const canSubmit = username.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onLogin(normalizeName(username));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-6xl mb-4"
            >
              🎮
            </motion.div>
            <h1 className="text-4xl text-gray-800 mb-2">Juegos de Bebida</h1>
            <p className="text-gray-600">Iniciá sesión para comenzar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Tu nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 pl-12 pr-4 py-6 text-lg focus:border-purple-500 focus:ring-0"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Iniciar Sesión
            </Button>
          </form>

          {/* Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Tu nombre se usará para identificarte en los juegos
            </p>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/80 text-sm mt-6"
        >
          ¡Juegos sociales para pasarla bien! 🍻
        </motion.p>
      </motion.div>
    </div>
  );
}
