import { PlayerRole } from '../types';

export function generateRoomCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code as `${number}${number}${number}${number}${number}${number}`;
}

export function generatePlayerId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function assignRoles(
  players: { id: string; username: string; avatar?: string; isHost: boolean; role: 'innocent' | 'impostor' | 'jester' | 'spectator'; isConnected: boolean; answer: string; hasVoted: boolean }[], 
  impostorCount: number = 1, 
  hasJester: boolean = false
): PlayerRole[] {
  // Filter out spectators from role assignment
  const playingPlayers = players.filter(player => player.role !== 'spectator');
  const playerCount = playingPlayers.length;
  const roles: PlayerRole[] = [];
  
  // Validate impostor count - allow up to floor((playerCount-1)/2) (impostors must be less than half)
  // But ensure at least 1 impostor is possible
  const maxImpostors = Math.max(1, Math.floor((playerCount - 1) / 2));
  const actualImpostorCount = Math.min(impostorCount, maxImpostors);
  
  // Add impostors
  for (let i = 0; i < actualImpostorCount; i++) {
    roles.push('impostor');
  }
  
  // Add jester if enabled and we have enough players (5+)
  if (hasJester && playerCount >= 5) {
    roles.push('jester');
  }
  
  // Fill remaining slots with innocent players
  const remainingSlots = playerCount - roles.length;
  for (let i = 0; i < remainingSlots; i++) {
    roles.push('innocent');
  }
  
  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  
  // Create a map of playing players to their assigned roles
  const roleMap: Record<string, PlayerRole> = {};
  playingPlayers.forEach((player, index) => {
    roleMap[player.id] = roles[index];
  });
  
  // Return roles for all players, keeping spectators as spectators
  return players.map(player => 
    player.role === 'spectator' ? 'spectator' : roleMap[player.id]
  );
}

export function getRandomImpostorCount(playerCount: number): number {
  const maxImpostors = Math.max(1, Math.floor((playerCount - 1) / 2));
  return Math.max(1, Math.floor(Math.random() * maxImpostors) + 1);
}

export function shouldShowJesterHint(nonImpostorCount: number, playerId: string, allPlayerIds: string[]): boolean {
  const hintRecipientCount = Math.floor(nonImpostorCount / 2);
  const shuffledIds = [...allPlayerIds].sort();
  return shuffledIds.slice(0, hintRecipientCount).includes(playerId);
}