import { Card, Player, DrinkResult, CardAction } from './types';

// Crear un mazo español (12 cartas × 4 palos = 48 cartas)
export function createDeck(): Card[] {
  const suits: Card['suit'][] = ['oros', 'copas', 'espadas', 'bastos'];
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (let number = 1; number <= 12; number++) {
      deck.push({ number, suit });
    }
  }
  
  return shuffleDeck(deck);
}

// Mezclar el mazo usando Fisher-Yates
export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

// Obtener la acción asociada a cada carta
export function getCardAction(cardNumber: number): CardAction {
  switch (cardNumber) {
    case 1:
      return { type: 'drink_self' };
    case 2:
      return { type: 'choose_player' };
    case 3:
      return { type: 'everyone_drinks' };
    case 5:
      return { type: 'choose_puta' };
    case 10:
      return { type: 'activate_dedito' };
    case 12:
      return { type: 'rest' };
    default:
      return { type: 'pass' };
  }
}

// Obtener descripción de la carta
export function getCardDescription(cardNumber: number): string {
  switch (cardNumber) {
    case 1:
      return 'Tomás vos';
    case 2:
      return 'Elegís quién toma';
    case 3:
      return 'Toman todos';
    case 4:
      return 'Pasa turno';
    case 5:
      return 'Elegís una puta';
    case 6:
      return 'Pasa turno';
    case 7:
      return 'Pasa turno';
    case 8:
      return 'Pasa turno';
    case 9:
      return 'Pasa turno';
    case 10:
      return 'Activás Dedito';
    case 11:
      return 'Pasa turno';
    case 12:
      return 'Descanso';
    default:
      return 'Pasa turno';
  }
}

// Calcular quién toma basándose en el grafo de putas
export function calculateDrinkingChain(
  startPlayerId: string,
  players: Player[]
): DrinkResult[] {
  const drinkCount = new Map<string, number>();
  const playerChains = new Map<string, Set<string>>();
  
  function traverse(playerId: string, pathVisited: Set<string> = new Set()): void {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Evitar bucles infinitos en esta cadena específica
    if (pathVisited.has(playerId)) return;
    
    // Este jugador toma
    drinkCount.set(playerId, (drinkCount.get(playerId) || 0) + 1);
    
    // Agregar a la cadena
    if (!playerChains.has(playerId)) {
      playerChains.set(playerId, new Set());
    }
    pathVisited.forEach(id => {
      const p = players.find(p => p.id === id);
      if (p) playerChains.get(playerId)!.add(p.name);
    });
    playerChains.get(playerId)!.add(player.name);
    
    // Nueva copia del path para esta rama
    const newPath = new Set(pathVisited);
    newPath.add(playerId);
    
    // Recorrer las putas de este jugador
    for (const putaId of player.putas) {
      // Verificar anulación mutua: si A es puta de B y B es puta de A, se anulan
      const puta = players.find(p => p.id === putaId);
      if (puta && puta.putas.includes(playerId)) {
        // Anulación mutua - no continuar esta rama
        continue;
      }
      
      // Continuar la cadena
      traverse(putaId, newPath);
    }
  }
  
  traverse(startPlayerId);
  
  // Convertir a array de resultados
  const results: DrinkResult[] = [];
  drinkCount.forEach((count, playerId) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      const chainSet = playerChains.get(playerId) || new Set([player.name]);
      results.push({
        playerId,
        playerName: player.name,
        count,
        chain: Array.from(chainSet)
      });
    }
  });
  
  return results.sort((a, b) => b.count - a.count);
}

// Calcular "Toman todos" con acumulados
export function calculateEveryoneDrinks(players: Player[]): DrinkResult[] {
  const allResults = new Map<string, DrinkResult>();
  
  // Inicializar todos los jugadores
  players.forEach(player => {
    allResults.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      count: 0,
      chain: []
    });
  });
  
  // Calcular la cadena para cada jugador
  players.forEach(player => {
    const chains = calculateDrinkingChain(player.id, players);
    chains.forEach(result => {
      const current = allResults.get(result.playerId)!;
      current.count += result.count;
      // Agregar cadenas únicas
      result.chain.forEach(name => {
        if (!current.chain.includes(name)) {
          current.chain.push(name);
        }
      });
    });
  });
  
  return Array.from(allResults.values()).sort((a, b) => b.count - a.count);
}

// Verificar si el dedito expiró
export function checkDeditoExpiry(player: Player, currentTurn: number): boolean {
  if (!player.dedito || !player.deditoExpiry) return false;
  return currentTurn >= player.deditoExpiry;
}

// Obtener nombre del palo en español
export function getSuitName(suit: Card['suit']): string {
  const names = {
    'oros': 'Oros',
    'copas': 'Copas',
    'espadas': 'Espadas',
    'bastos': 'Bastos'
  };
  return names[suit];
}

// Obtener emoji del palo
export function getSuitEmoji(suit: Card['suit']): string {
  const emojis = {
    'oros': '🟡',
    'copas': '🏆',
    'espadas': '⚔️',
    'bastos': '🪵'
  };
  return emojis[suit];
}