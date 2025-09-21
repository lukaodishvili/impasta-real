import { useState, useEffect } from 'react';
import { GameState, Language } from '../types';
import { User, Vote, ArrowRight, Clock, Users, AlertTriangle, X, Skull, RefreshCw } from 'lucide-react';

interface VoteResultsScreenProps {
  gameState: GameState;
  currentUsername: string;
  onContinueGame: () => void;
  onFinishGame: () => void;
  onStartTieBreaker: () => void;
  language: Language;
}

export default function VoteResultsScreen({
  gameState,
  currentUsername,
  onContinueGame,
  onFinishGame,
  onStartTieBreaker,
  language
}: VoteResultsScreenProps) {
  const { players, votes, eliminatedPlayers } = gameState;
  const [liveVoteCounts, setLiveVoteCounts] = useState<Record<string, number>>({});
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  // Check if current player is host with error handling
  const isHost = players?.find(p => p.username === currentUsername)?.isHost || false;
  
  // Determine if we're in live mode (during voting phase)
  useEffect(() => {
    setIsLiveMode(gameState.phase === 'voting');
  }, [gameState.phase]);
  
  // Update live vote counts when votes change
  useEffect(() => {
    if (!votes || typeof votes !== 'object') return;
    
    const newVoteCounts: Record<string, number> = {};
    
    // Count votes for each player
    Object.values(votes).forEach((voteArray) => {
      if (Array.isArray(voteArray)) {
        voteArray.forEach((targetId) => {
          newVoteCounts[targetId] = (newVoteCounts[targetId] || 0) + 1;
        });
      }
    });
    
    setLiveVoteCounts(newVoteCounts);
  }, [votes]);
  
  // Error handling for missing data
  const hasValidGameState = gameState && players && Array.isArray(players) && players.length > 0;
  const hasValidVotes = votes && typeof votes === 'object';

  const texts = {
    en: {
      voteResults: 'Vote Results',
      whoVotedForWhom: 'Who voted for whom:',
      eliminated: 'Eliminated',
      noVotes: 'No votes were cast',
      continueGame: 'Continue Game',
      finishGame: 'Finish Game',
      waitingForHost: 'Waiting for host to decide...',
      reviewVotes: 'Review the votes before proceeding to results',
      tieBreaker: 'Tie-Breaker Round',
      tieBreakerDesc: 'Players are tied! Vote to break the tie.',
      tieBreakerResults: 'Tie-Breaker Results',
      tieBreakerResultsDesc: 'Tie has been broken! Here are the results.',
      errorLoading: 'Error loading vote results',
      noGameData: 'No game data available',
      invalidGameState: 'Invalid game state',
      tryAgain: 'Try Again'
    },
    ru: {
      voteResults: 'Результаты голосования',
      whoVotedForWhom: 'Кто за кого голосовал:',
      eliminated: 'Исключен',
      noVotes: 'Голосов не было',
      continueGame: 'Продолжить игру',
      finishGame: 'Завершить игру',
      waitingForHost: 'Ждем решения хоста...',
      reviewVotes: 'Просмотрите голоса перед переходом к результатам',
      tieBreaker: 'Раунд при ничьей',
      tieBreakerDesc: 'Игроки связаны! Голосуйте, чтобы разорвать ничью.',
      tieBreakerResults: 'Результаты при ничьей',
      tieBreakerResultsDesc: 'Ничья разорвана! Вот результаты.',
      errorLoading: 'Ошибка загрузки результатов голосования',
      noGameData: 'Данные игры недоступны',
      invalidGameState: 'Некорректное состояние игры',
      tryAgain: 'Попробовать снова'
    },
    ka: {
      voteResults: 'ხმის მიცემის შედეგები',
      whoVotedForWhom: 'ვინ ვისთვის ხმა მისცა:',
      eliminated: 'გამორიცხული',
      noVotes: 'ხმა არ მისცეს',
      continueGame: 'თამაშის გაგრძელება',
      finishGame: 'თამაშის დასრულება',
      waitingForHost: 'ველოდებით ჰოსტის გადაწყვეტილებას...',
      reviewVotes: 'შედეგებზე გადასვლამდე გადახედეთ ხმებს',
      tieBreaker: 'ტოლი ქულების რაუნდი',
      tieBreakerDesc: 'მოთამაშეები ტოლი ქულებით არიან! მისცით ხმა ტოლი ქულების გასაწყვეტად.',
      tieBreakerResults: 'ტოლი ქულების შედეგები',
      tieBreakerResultsDesc: 'ტოლი ქულები გაწყდა! აი შედეგები.',
      errorLoading: 'ხმის მიცემის შედეგების ჩატვირთვის შეცდომა',
      noGameData: 'თამაშის მონაცემები მიუწვდომელია',
      invalidGameState: 'არასწორი თამაშის მდგომარეობა',
      tryAgain: 'კვლავ სცადეთ'
    }
  };

  const t = texts[language];

  // Safe data processing with error handling
  const safeVotes = hasValidVotes ? votes : {};
  const safePlayers = hasValidGameState ? players : [];
  const safeEliminatedPlayers = eliminatedPlayers || [];

  // Group votes by target player with error handling
  const voteGroups: { [targetId: string]: string[] } = {};
  try {
    Object.entries(safeVotes).forEach(([voterId, targetIds]) => {
      if (Array.isArray(targetIds)) {
        targetIds.forEach(targetId => {
          if (targetId && typeof targetId === 'string') {
            if (!voteGroups[targetId]) {
              voteGroups[targetId] = [];
            }
            voteGroups[targetId].push(voterId);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error processing vote groups:', error);
  }

  // Calculate voting statistics with error handling
  let totalVotes = 0;
  let playersWhoVoted = 0;
  let playersWhoDidntVote: typeof safePlayers = [];
  
  try {
    totalVotes = Object.values(safeVotes).reduce((sum, voteArray) => {
      return sum + (Array.isArray(voteArray) ? voteArray.length : 0);
    }, 0);
    playersWhoVoted = Object.keys(safeVotes).length;
    playersWhoDidntVote = safePlayers.filter(p => !safeVotes[p.id] || !Array.isArray(safeVotes[p.id]) || safeVotes[p.id].length === 0);
  } catch (error) {
    console.error('Error calculating voting statistics:', error);
  }
  
  // Get player name by ID with error handling
  const getPlayerName = (playerId: string) => {
    if (!playerId || typeof playerId !== 'string') return 'Unknown Player';
    try {
      const player = safePlayers.find(p => p && p.id === playerId);
      return player && player.username ? player.username : 'Unknown Player';
    } catch (error) {
      console.error('Error getting player name:', error);
      return 'Unknown Player';
    }
  };

  // Get vote counts for each target (use live data if in live mode)
  const voteCounts = isLiveMode 
    ? Object.entries(liveVoteCounts).map(([targetId, count]) => ({
        targetId,
        targetName: getPlayerName(targetId),
        count,
        voters: [] // Don't show individual voters in live mode
      })).sort((a, b) => b.count - a.count)
    : Object.entries(voteGroups).map(([targetId, voterIds]) => ({
        targetId,
        targetName: getPlayerName(targetId),
        count: voterIds.length,
        voters: voterIds
      })).sort((a, b) => b.count - a.count);

  // Get player avatar by ID with error handling
  const getPlayerAvatar = (playerId: string) => {
    if (!playerId || typeof playerId !== 'string') return null;
    try {
      const player = safePlayers.find(p => p && p.id === playerId);
      return player?.avatar || null;
    } catch (error) {
      console.error('Error getting player avatar:', error);
      return null;
    }
  };

  // Error boundary: Show error state if game data is invalid
  if (!hasValidGameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-red-500/20 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-red-400/50 text-center">
            <div className="w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-200 mb-4">{t.errorLoading}</h2>
            <p className="text-red-300 mb-6">{t.noGameData}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500/30 hover:bg-red-500/40 text-red-200 px-6 py-3 rounded-xl transition-all duration-300"
            >
              {t.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#101721' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <span className="text-2xl">🗳️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Vote Results
            </span>
          </h1>
          <p className="text-lg" style={{ color: '#D1D5DB' }}>{t.reviewVotes}</p>
        </div>

        {/* Tie-Breaker Information */}
        {gameState.isTieVote && (
          <div className="backdrop-blur-sm rounded-2xl p-6 mb-8 border shadow-2xl text-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <RefreshCw className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold text-yellow-300">{t.tieBreaker}</h2>
            </div>
            <p className="text-yellow-200 text-lg">{t.tieBreakerDesc}</p>
          </div>
        )}

        {/* Host Controls or Waiting Message */}
        {isHost ? (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Host Controls</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {gameState.isTieVote ? (
                  <button
                    onClick={() => {
                      try {
                        onStartTieBreaker();
                      } catch (error) {
                        console.error('Error starting tie-breaker:', error);
                      }
                    }}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 font-semibold animate-slide-in-left"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>{t.tieBreaker}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      try {
                        onContinueGame();
                      } catch (error) {
                        console.error('Error continuing game:', error);
                      }
                    }}
                    className="bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 font-semibold animate-slide-in-left"
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span>{t.continueGame}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    try {
                      onFinishGame();
                    } catch (error) {
                      console.error('Error finishing game:', error);
                    }
                  }}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 font-semibold animate-slide-in-right"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>{t.finishGame}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl mb-8 border border-white/20 animate-slide-in-up-delay">
            <div className="flex items-center justify-center space-x-4 animate-pulse">
              <Clock className="w-6 h-6 text-yellow-400" />
              <span className="text-white text-lg font-semibold">
                {gameState.isTieVote ? t.tieBreaker : t.waitingForHost}
              </span>
            </div>
            <p className="text-white/80 text-center mt-3">
              {gameState.isTieVote ? t.tieBreakerDesc : t.reviewVotes}
            </p>
          </div>
        )}

        {/* Eliminated Players Section */}
        {safeEliminatedPlayers.length > 0 && (
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-md rounded-3xl p-6 shadow-2xl mb-6 border border-red-400/50 animate-slide-in-up-delay-2">
            <div className="flex items-center space-x-3 mb-4 animate-fade-in">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
                <Skull className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white animate-slide-in-right">Eliminated Players</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeEliminatedPlayers.map((playerId, index) => {
                const player = safePlayers.find(p => p && p.id === playerId);
                if (!player) return null;
                
                return (
                  <div 
                    key={playerId} 
                    className={`bg-red-500/30 rounded-xl p-4 border border-red-400/50 relative overflow-hidden animate-slide-in-up-stagger`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    {/* Cross-out effect */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <X className="w-16 h-16 text-red-600/50 rotate-12" />
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex items-center space-x-3">
                      {/* Player Avatar */}
                      {player.avatar && player.avatar.startsWith('data:') ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg opacity-75">
                          <img 
                            src={player.avatar} 
                            alt={`${player.username}'s avatar`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : player.avatar ? (
                        <div className={`w-12 h-12 ${player.avatar} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg opacity-75`}>
                          <User className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg opacity-75">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white line-through opacity-75">{player.username}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Skull className="w-4 h-4 text-red-300" />
                          <span className="text-red-200 text-sm font-medium">Eliminated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Voting Statistics Summary */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl mb-6 border border-white/20 animate-slide-in-up-delay-3">
          <div className="flex items-center space-x-3 mb-4 animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white animate-slide-in-right">Voting Summary</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Votes */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/20 animate-slide-in-up-stagger" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-blue-500/30 rounded-full flex items-center justify-center animate-bounce-in">
                  <span className="text-blue-300 text-sm font-bold">V</span>
                </div>
                <span className="text-white font-semibold">Total Votes</span>
              </div>
              <div className="text-2xl font-bold text-white animate-count-up">{totalVotes}</div>
            </div>
            
            {/* Players Who Voted */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/20 animate-slide-in-up-stagger" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center animate-bounce-in">
                  <span className="text-green-300 text-sm font-bold">✓</span>
                </div>
                <span className="text-white font-semibold">Voted</span>
              </div>
              <div className="text-2xl font-bold text-white animate-count-up">{playersWhoVoted}/{players.length}</div>
            </div>
            
            {/* Highest Vote Count */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/20 animate-slide-in-up-stagger" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-red-500/30 rounded-full flex items-center justify-center animate-bounce-in">
                  <span className="text-red-300 text-sm font-bold">↑</span>
                </div>
                <span className="text-white font-semibold">Most Votes</span>
              </div>
              <div className="text-2xl font-bold text-white animate-count-up">
                {voteCounts.length > 0 ? voteCounts[0].count : 0}
              </div>
            </div>
          </div>
          
          {/* Players who didn't vote */}
          {playersWhoDidntVote.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-400/30">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 font-medium">
                  Players who didn't vote: {playersWhoDidntVote.map(p => p.username).join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Vote Results */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl mb-8 border border-white/20 animate-slide-in-up-delay-4">
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white animate-slide-in-right">
                {isLiveMode ? 'Live Vote Results' : t.whoVotedForWhom}
              </h3>
            </div>
            {isLiveMode && (
              <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">LIVE</span>
                <RefreshCw className="w-4 h-4 text-green-300 animate-spin" />
              </div>
            )}
          </div>

          {!hasValidVotes || Object.keys(voteGroups).length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-xl">{t.noVotes}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {voteCounts.map((voteData, index) => {
                const { targetId, targetName, count, voters } = voteData;
                const targetAvatar = getPlayerAvatar(targetId);
                const isEliminated = safeEliminatedPlayers.includes(targetId);
                const isHighestVote = index === 0 && count > 0;
                const isLowestVote = index === voteCounts.length - 1 && count > 0 && voteCounts.length > 1;
                const isTied = voteCounts.filter(v => v.count === count).length > 1;
                const isTiedForHighest = isHighestVote && isTied;
                const isTiedForLowest = isLowestVote && isTied;
                
                return (
                  <div
                    key={targetId}
                    className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 animate-slide-in-up-stagger ${
                      isEliminated
                        ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/50 shadow-red-500/20'
                        : isTiedForHighest
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 shadow-yellow-500/20'
                        : isTiedForLowest
                        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/50 shadow-blue-500/20'
                        : isHighestVote
                        ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-400/50 shadow-orange-500/20'
                        : isLowestVote
                        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/50 shadow-blue-500/20'
                        : isTied
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 shadow-purple-500/20'
                        : 'bg-white/5 border-white/20'
                    }`}
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Target Player Avatar */}
                      <div className="relative">
                        {targetAvatar ? (
                          <div className={`w-16 h-16 ${targetAvatar} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${isEliminated ? 'opacity-75' : ''}`}>
                            <User className="w-8 h-8 text-white" />
                          </div>
                        ) : (
                          <div className={`w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${isEliminated ? 'opacity-75' : ''}`}>
                            <User className="w-8 h-8 text-white" />
                          </div>
                        )}
                        {/* Elimination overlay for main vote breakdown */}
                        {isEliminated && (
                          <div className="absolute inset-0 rounded-full flex items-center justify-center">
                            <div className="w-20 h-20 bg-red-600/30 rounded-full flex items-center justify-center">
                              <Skull className="w-8 h-8 text-red-300" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {/* Ranking Badge */}
                            {count > 0 && (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 
                                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900' 
                                  : index === 1 
                                  ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
                                  : index === 2
                                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100'
                                  : 'bg-gray-600 text-gray-200'
                              }`}>
                                {index + 1}
                              </div>
                            )}
                            <h4 className={`text-xl font-bold ${isEliminated ? 'text-white line-through opacity-75' : 'text-white'}`}>{targetName}</h4>
                            
                            {/* Special ranking badges */}
                            {isTiedForHighest && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/30 rounded-full border border-yellow-400/50">
                                <span className="text-yellow-200 text-xs font-bold">TIE</span>
                                <span className="text-yellow-200 text-xs">HIGHEST</span>
                              </div>
                            )}
                            {isTiedForLowest && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/30 rounded-full border border-blue-400/50">
                                <span className="text-blue-200 text-xs font-bold">TIE</span>
                                <span className="text-blue-200 text-xs">LOWEST</span>
                              </div>
                            )}
                            {isHighestVote && !isTied && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/30 rounded-full border border-orange-400/50">
                                <span className="text-orange-200 text-xs font-bold">MOST</span>
                                <span className="text-orange-200 text-xs">VOTES</span>
                              </div>
                            )}
                            {isLowestVote && !isTied && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-cyan-500/30 rounded-full border border-cyan-400/50">
                                <span className="text-cyan-200 text-xs font-bold">LEAST</span>
                                <span className="text-cyan-200 text-xs">VOTES</span>
                              </div>
                            )}
                            
                            {isEliminated && (
                              <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/30 rounded-full border border-red-400/50">
                                <Skull className="w-4 h-4 text-red-300" />
                                <span className="text-red-200 text-sm font-medium">{t.eliminated}</span>
                              </div>
                            )}
                            {isTied && !isEliminated && (
                              <div className="flex items-center space-x-2 px-3 py-1 bg-purple-500/30 rounded-full border border-purple-400/50">
                                <Users className="w-4 h-4 text-purple-300" />
                                <span className="text-purple-200 text-sm font-medium">Tied</span>
                              </div>
                            )}
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {count} {count === 1 ? 'vote' : 'votes'}
                          </div>
                        </div>
                        
                        {/* Voters List */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {voters.map(voterId => {
                            const voterName = getPlayerName(voterId);
                            const voterAvatar = getPlayerAvatar(voterId);
                            
                            return (
                              <div key={voterId} className="flex items-center space-x-2 p-3 bg-white/10 rounded-xl border border-white/20">
                                {voterAvatar ? (
                                  <div className={`w-8 h-8 ${voterAvatar} rounded-full flex items-center justify-center flex-shrink-0`}>
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <span className="text-white text-sm font-medium truncate">{voterName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Individual Voting Patterns */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl mb-8 border border-white/20 animate-slide-in-up-delay-5">
          <div className="flex items-center space-x-3 mb-6 animate-fade-in">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white animate-slide-in-right">Individual Voting Patterns</h3>
          </div>

          <div className="space-y-4">
            {safePlayers.map((player, index) => {
              if (!player) return null;
              const playerVotes = safeVotes[player.id] || [];
              const playerAvatar = player.avatar;
              const isEliminated = safeEliminatedPlayers.includes(player.id);
              
              return (
                <div 
                  key={player.id} 
                  className={`rounded-xl p-4 border transition-all duration-300 animate-slide-in-up-stagger ${
                    isEliminated
                      ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/50 shadow-red-500/20 opacity-75'
                      : 'bg-white/5 border-white/20'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-4">
                    {/* Player Avatar */}
                    {playerAvatar ? (
                      <div className={`w-12 h-12 ${playerAvatar} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-lg font-bold ${isEliminated ? 'text-white line-through opacity-75' : 'text-white'}`}>
                            {player.username}
                          </h4>
                          {isEliminated && (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/30 rounded-full border border-red-400/50">
                              <Skull className="w-3 h-3 text-red-300" />
                              <span className="text-red-200 text-xs font-medium">Eliminated</span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-300">
                          {playerVotes.length} {playerVotes.length === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                      
                      {playerVotes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {playerVotes.map(votedPlayerId => {
                            const votedPlayerName = getPlayerName(votedPlayerId);
                            return (
                              <div key={votedPlayerId} className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 rounded-lg border border-blue-400/30">
                                <Vote className="w-3 h-3 text-blue-300" />
                                <span className="text-blue-200 text-sm">{votedPlayerName}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm">Did not vote</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
