export interface Player {
  id: string;
  name: string;
  putas: string[]; // IDs de jugadores que son "putas" de este jugador
  dedito: boolean;
  deditoExpiry?: number; // Índice de turno cuando expira
}

export interface Card {
  number: number; // 1-12
  suit: 'oros' | 'copas' | 'espadas' | 'bastos';
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  usedCards: Card[];
  gameStarted: boolean;
  turnCounter: number; // Para trackear vencimiento del dedito
}

export interface DrinkResult {
  playerId: string;
  playerName: string;
  count: number;
  chain: string[]; // Nombres de la cadena
}

export type CardAction = 
  | { type: 'drink_self' } // 1: Tomás vos
  | { type: 'choose_player' } // 2: Elegís quién toma
  | { type: 'everyone_drinks' } // 3: Toman todos
  | { type: 'choose_puta' } // 5: Elegís una puta
  | { type: 'activate_dedito' } // 10: Activás dedito
  | { type: 'rest' } // 12: Descanso
  | { type: 'pass' }; // Otras cartas
