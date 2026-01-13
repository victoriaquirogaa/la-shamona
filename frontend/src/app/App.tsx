import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { MainMenu } from "./components/MainMenu";
import { PlayerSetup } from "./components/PlayerSetup";
import { GameBoard } from "./components/GameBoard";
import { Pyramid } from "./components/games/Pyramid";
import { Questions } from "./components/games/Questions";
import { Spicy } from "./components/games/Spicy";
import { BackendTest } from "./components/BackendTest";
import { Player } from "./types";
import { Toaster } from "sonner";

type Screen =
  | "login"
  | "menu"
  | "la-puta-setup"
  | "la-puta-game"
  | "pyramid"
  | "questions"
  | "spicy"
  | "backend-test";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [username, setUsername] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);

  // Cargar usuario al iniciar (persistencia simple)
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
      setUsername(savedUsername);
      setCurrentScreen("menu");
    }
  }, []);

  const handleLogin = (name: string) => {
    setUsername(name);
    localStorage.setItem("username", name);
    setCurrentScreen("menu");
  };

  const handleLogout = () => {
    setUsername("");
    setPlayers([]);
    localStorage.removeItem("username");

    // Limpieza: ya no usamos gameState para La Puta (backend-driven),
    // pero si quedó algo viejo lo borramos.
    localStorage.removeItem("gameState");

    setCurrentScreen("login");
  };

  const handleSelectGame = (gameId: string) => {
    if (gameId === "la-puta") {
      setPlayers([]); // cada partida se crea de nuevo en backend
      localStorage.removeItem("gameState");
      setCurrentScreen("la-puta-setup");
      return;
    }

    setCurrentScreen(gameId as Screen);
  };

  const handleBackToMenu = () => {
    setCurrentScreen("menu");
  };

  const handleStartLaPuta = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    // Nota: La sala se crea dentro de GameBoard (boot effect).
    setCurrentScreen("la-puta-game");
  };

  const handleRestartLaPuta = () => {
    setPlayers([]);
    localStorage.removeItem("gameState"); // limpieza
    setCurrentScreen("la-puta-setup");
  };

  return (
    <>
      {currentScreen === "login" && <Login onLogin={handleLogin} />}

      {currentScreen === "menu" && (
        <MainMenu username={username} onSelectGame={handleSelectGame} onLogout={handleLogout} />
      )}

      {currentScreen === "la-puta-setup" && (
        <PlayerSetup onStartGame={handleStartLaPuta} initialPlayers={players} onBack={handleBackToMenu} />
      )}

      {currentScreen === "la-puta-game" && (
        <GameBoard initialPlayers={players} onRestart={handleRestartLaPuta} onBackToMenu={handleBackToMenu} />
      )}

      {currentScreen === "pyramid" && <Pyramid username={username} onBack={handleBackToMenu} />}

      {currentScreen === "questions" && <Questions username={username} onBack={handleBackToMenu} />}

      {currentScreen === "spicy" && <Spicy username={username} onBack={handleBackToMenu} />}

      {currentScreen === 'backend-test' && (
  <BackendTest onBack={handleBackToMenu} />
)}

      <Toaster position="top-center" />
    </>
  );
}
