import { GameState, Language } from '../types';
import { User, Vote, ArrowRight, Clock, Users, AlertTriangle, X, Skull, RefreshCw } from 'lucide-react';

interface VoteResultsScreenProps {
  gameState: GameState;
  currentUsername: string;
  onContinueGame: () => void;
  onFinishGame: () => void;
  onStartTieBreaker: () => void;
  onContinueRandomize: () => void;
  onFinishRandomize: () => void;
  language: Language;
}

export default function VoteResultsScreen({
  gameState,
  currentUsername,
  onContinueGame,
  onFinishGame,
  onStartTieBreaker,
  onContinueRandomize,
  onFinishRandomize,
  language
}: VoteResultsScreenProps) {
  const { players, votes, eliminatedPlayers, isRandomizeMode } = gameState;

  const isHost = players.find(p => p.username === currentUsername)?.isHost;

  const texts = {
    en: {
      voteResults: 'Vote Results',
      eliminated: 'Eliminated',
      tieBreaker: 'Tie-Breaker!',
      waitingForHost: 'Waiting for host...',
      continueGame: 'Continue Game',
      finishGame: 'Finish Game',
      startTieBreaker: 'Start Tie-Breaker',
      waitingForHostToDecide: 'Waiting for host to decide...',
      whoVotedForWhom: 'Vote Results',
      revealWinners: 'Reveal the Winners'
    },
    ru: {
      voteResults: 'Результаты Голосования',
      eliminated: 'Исключен',
      tieBreaker: 'Тай-брейк!',
      waitingForHost: 'Ожидание хоста...',
      continueGame: 'Продолжить Игру',
      finishGame: 'Закончить Игру',
      startTieBreaker: 'Начать Тай-брейк',
      waitingForHostToDecide: 'Ожидание решения хоста...',
      whoVotedForWhom: 'Результаты Голосования',
      revealWinners: 'Показать победителей'
    },
    ka: {
      voteResults: 'ხმის მიცემის შედეგები',
      eliminated: 'გამოეთიშა',
      tieBreaker: 'დამატებითი რაუნდი!',
      waitingForHost: 'ელოდება მასპინძელს...',
      continueGame: 'თამაშის გაგრძელება',
      finishGame: 'თამაშის დასრულება',
      startTieBreaker: 'დამატებითი რაუნდის დაწყება',
      waitingForHostToDecide: 'ელოდება მასპინძლის გადაწყვეტილებას...',
      whoVotedForWhom: 'ხმის მიცემის შედეგები',
      revealWinners: 'გამარჯვებულების ჩვენება'
    }
  };

  const t = texts[language];

  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const mainVoteCounts = Object.values(gameState.originalVotes || votes).flat().reduce((acc, playerId) => {
    acc[playerId] = (acc[playerId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sortedMainVotes = Object.entries(mainVoteCounts).sort(([, a], [, b]) => b - a);
  
  const tieBreakerRounds = gameState.tieBreakerVotes || [];
  
  // Get all eliminated players
  // Exclude host spectators (in custom packs) but include player spectators (in randomize mode when eliminated)
  const allEliminatedPlayers = players.filter(p => {
    const isActuallyEliminated = eliminatedPlayers.includes(p.id) || p.isEliminated;
    const isHostSpectator = gameState.selectedPackType === 'custom' && p.role === 'spectator' && p.isHost;
    
    return isActuallyEliminated && !isHostSpectator;
  });
  
  // Get players eliminated in this round only
  const eliminatedThisRound = players.filter(p => {
    const isInEliminatedList = eliminatedPlayers.includes(p.id);
    const wasNotPreviouslyEliminated = !gameState.previousEliminatedPlayers?.includes(p.id);
    return isInEliminatedList && wasNotPreviouslyEliminated;
  });

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#101721' }}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-md mx-auto">
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <span className="text-2xl">🗳️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight text-white">
            {gameState.isTieVote ? t.tieBreaker : t.voteResults}
          </h1>
        </div>

        {/* Eliminated Players Display - Only for Randomize Mode */}
        {isRandomizeMode && allEliminatedPlayers.length > 0 && (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              {t.eliminated} ({allEliminatedPlayers.length})
            </h3>
            <div className="space-y-3">
              {allEliminatedPlayers.map((player, index) => {
                const isEliminatedThisRound = eliminatedThisRound.some(p => p.id === player.id);
                
                return (
                  <div key={`eliminated-${player.id}-${index}`} className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all ${
                    isEliminatedThisRound 
                      ? 'bg-red-500/30 border-red-400/60 animate-pulse shadow-lg' 
                      : 'bg-red-500/20 border-red-500/40'
                  }`}>
                    {/* Elimination Order Number */}
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    {/* Player Avatar with Skull Overlay */}
                    <div className="relative flex-shrink-0">
                      {player.avatar && player.avatar.startsWith('data:') ? (
                        <img src={player.avatar} alt={player.username} className="w-12 h-12 rounded-full object-cover opacity-70" />
                      ) : (
                        <div className={`w-12 h-12 ${player.avatar || 'bg-gray-500'} rounded-full flex items-center justify-center opacity-70`}>
                          <User className="w-7 h-7 text-white" />
                        </div>
                      )}
                      {/* Skull overlay on profile picture */}
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <Skull className="w-6 h-6 text-red-400" />
                      </div>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-red-200 text-lg truncate line-through">
                        {player.username}
                      </div>
                      {isEliminatedThisRound && (
                        <div className="text-xs text-red-300 font-medium">
                          Just eliminated
                        </div>
                      )}
                    </div>
                    
                    {/* Elimination Status */}
                    <div className="text-xs text-red-300 bg-red-500/30 px-2 py-1 rounded-full flex-shrink-0">
                      Eliminated
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VOTE BREAKDOWN - Original Round (All modes) */}
        {sortedMainVotes.length > 0 && (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            <h3 className="text-xl font-bold text-white mb-6 text-center">{gameState.tieBreakerVotes && gameState.tieBreakerVotes.length > 0 ? 'Original Vote' : t.whoVotedForWhom}</h3>
            <div className="space-y-3">
              {sortedMainVotes.map(([playerId, count], index) => {
                const player = getPlayerById(playerId);
                if (!player) return null;
                const isEliminated = eliminatedPlayers.includes(playerId);
                return (
                  <div key={`main-vote-${playerId}-${index}`} className={`p-4 rounded-xl border-2 ${
                    isEliminated 
                      ? 'bg-red-500/20 border-red-500/50' 
                      : 'bg-gray-700/50 border-gray-600/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-600 text-white">
                          {index + 1}
                        </div>
                        {player.avatar && player.avatar.startsWith('data:') ? (
                          <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 ${player.avatar || 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <span className={`font-bold text-white ${isEliminated ? 'line-through' : ''}`}>{player.username}</span>
                         {isEliminated && (
                          <span className="text-xs bg-red-500/30 text-red-300 px-2 py-1 rounded-full">
                            Eliminated
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{count}</div>
                        <div className="text-xs text-gray-400">vote{count > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VOTE BREAKDOWN - Tie-Breaker Rounds (All modes) */}
        {tieBreakerRounds.map((roundVotes, roundIndex) => {
          const roundVoteCounts = Object.values(roundVotes).flat().reduce((acc, playerId) => {
            acc[playerId] = (acc[playerId] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const sortedRoundVotes = Object.entries(roundVoteCounts).sort(([, a], [, b]) => b - a);

          return (
            <div key={roundIndex} className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <h3 className="text-xl font-bold text-white mb-6 text-center">Tie-Breaker Round {roundIndex + 1}</h3>
              <div className="space-y-4">
                {sortedRoundVotes.map(([playerId, count], voteIndex) => {
                  const player = getPlayerById(playerId);
                  if (!player) return null;
                  const isEliminated = eliminatedPlayers.includes(playerId);
                  return (
                    <div key={`tiebreaker-${roundIndex}-${playerId}-${voteIndex}`} className={`p-4 rounded-xl border-2 ${
                      isEliminated 
                        ? 'bg-red-500/20 border-red-500/50' 
                        : 'bg-gray-700/50 border-gray-600/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-600 text-white">
                            {voteIndex + 1}
                          </div>
                          {player.avatar && player.avatar.startsWith('data:') ? (
                            <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className={`w-10 h-10 ${player.avatar || 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <span className={`font-bold text-white ${isEliminated ? 'line-through' : ''}`}>{player.username}</span>
                           {isEliminated && (
                            <span className="text-xs bg-red-500/30 text-red-300 px-2 py-1 rounded-full">
                              Eliminated
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{count}</div>
                          <div className="text-xs text-gray-400">vote{count > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {isHost ? (
          <div className="space-y-4">
            {isRandomizeMode ? (
              <>
                {/* Show continue button only if game can continue and host hasn't exceeded limit */}
                {players.filter(p => {
                  const isActivePlayer = !eliminatedPlayers.includes(p.id) && !p.isEliminated;
                  const isHostSpectator = gameState.selectedPackType === 'custom' && p.role === 'spectator' && p.isHost;
                  const isPlayerSpectator = p.role === 'spectator' && !p.isHost;
                  
                  // Count active players and host spectators (who can continue the game)
                  // Don't count player spectators (eliminated players)
                  return isActivePlayer || isHostSpectator;
                }).length > 2 && 
                 (gameState.continueCount || 0) < 3 && (
                  <button
                    onClick={onContinueRandomize}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-transform"
                  >
{t.continueGame}
                  </button>
                )}
                <button
                  onClick={onFinishRandomize}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-transform"
                >
                  {t.finishGame}
                </button>
              </>
            ) : gameState.isTieVote ? (
              <button
                onClick={onStartTieBreaker}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-transform"
              >
                {t.startTieBreaker}
              </button>
            ) : (
              <button
                onClick={onFinishGame} // Changed from onContinueGame
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-transform"
              >
                {t.revealWinners} 
              </button>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-300 p-4 bg-white/5 rounded-2xl">
            {isRandomizeMode ? t.waitingForHostToDecide : t.waitingForHost}
          </div>
        )}
      </div>
    </div>
  );
}
