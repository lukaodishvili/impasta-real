import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState } from '../types';
import { generateBotVotes } from '../utils/botUtils';
import { User, Vote, Clock, MessageCircle, Play } from 'lucide-react';

interface VotingScreenProps {
  gameState: GameState;
  currentUsername: string;
  onVote: (votes: string[]) => void;
  onBotVote: (botId: string, votes: string[]) => void;
  onStartVoting?: () => void;
}

export default function VotingScreen({
  gameState,
  currentUsername,
  onVote, 
  onBotVote,
  onStartVoting
}: VotingScreenProps) {
  const [selectedVotes, setSelectedVotes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discussionTimeLeft, setDiscussionTimeLeft] = useState(60);
  const [votingStarted, setVotingStarted] = useState(false);

  // Memoize current player to prevent unnecessary recalculations
  const currentPlayer = useMemo(() => 
    gameState.players.find(p => p.username === currentUsername), 
    [gameState.players, currentUsername]
  );
  
  const currentPlayerId = currentPlayer?.id;

  // Memoize host status
  const isHost = useMemo(() => {
    const hostPlayer = gameState.players.find(p => p.isHost);
    return hostPlayer?.username === currentUsername;
  }, [gameState.players, currentUsername]);

  // Memoize eligible players to prevent recalculation on every render
  const eligiblePlayers = useMemo(() => {
    if (gameState.isTieVote && gameState.tiedPlayers) {
      // In tie-breaker, only vote for tied players (exclude yourself and spectators for custom packs)
      return gameState.players.filter(p => 
        gameState.tiedPlayers!.includes(p.id) && 
        !gameState.eliminatedPlayers.includes(p.id) &&
        p.id !== currentPlayerId &&
        (gameState.selectedPackType !== 'custom' || p.role !== 'spectator')
      );
    } else {
      // In normal voting, can vote for anyone including yourself (exclude spectators for custom packs)
      return gameState.players.filter(p => 
        !gameState.eliminatedPlayers.includes(p.id) &&
        (gameState.selectedPackType !== 'custom' || p.role !== 'spectator')
      );
    }
  }, [gameState.players, gameState.isTieVote, gameState.tiedPlayers, gameState.eliminatedPlayers, currentPlayerId, gameState.selectedPackType]);

  const votesNeeded = gameState.isTieVote ? (gameState.impostorCount - gameState.eliminatedPlayers.length) : gameState.impostorCount;

  // Memoize main content
  const mainContent = useMemo(() => {
    if (gameState.gameMode === 'questions') {
      return gameState.currentQuestion || 'No question available';
    } else {
      return `Word: ${gameState.currentWord || 'No word available'}`;
    }
  }, [gameState.gameMode, gameState.currentQuestion, gameState.currentWord]);

  // Reset state when switching between normal and tie-breaker voting
  useEffect(() => {
    setSelectedVotes([]);
    setSubmitted(false);
    setError(null);
    
    // For tie-breaker, start voting immediately
    if (gameState.isTieVote) {
      setVotingStarted(true);
      setDiscussionTimeLeft(0);
    } else {
      // For normal voting, start immediately if game phase is 'voting'
      if (gameState.phase === 'voting') {
        setVotingStarted(true);
        setDiscussionTimeLeft(0);
      } else {
        setVotingStarted(false);
        setDiscussionTimeLeft(60);
      }
    }
  }, [gameState.isTieVote, gameState.phase]);

  // Stable timer callback to prevent recreation
  const handleStartVoting = useCallback(() => {
    setVotingStarted(true);
    onStartVoting?.();
  }, [onStartVoting]);

  // Discussion timer - single effect with proper cleanup
  useEffect(() => {
    if (votingStarted || discussionTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setDiscussionTimeLeft(prev => {
        if (prev <= 1) {
          handleStartVoting();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [votingStarted, handleStartVoting]);

  // Bot voting - only when voting starts, with proper dependencies
  useEffect(() => {
    if (!votingStarted) return;

    const players = gameState.players;
    // Only vote for bots that haven't voted yet
    const bots = players.filter(player => 
      (player.isBot || player.username.startsWith('Bot_')) && 
      !gameState.votes[player.id]
    );
    
    if (bots.length === 0) return;

    console.log('VotingScreen - Bot voting for:', bots.map(b => b.username));

    // Generate all bot votes immediately - no delays
    bots.forEach((bot) => {
      const botVotes = generateBotVotes(
        bot.id,
        players,
        votesNeeded,
        bot.personality || 'random',
        gameState.isTieVote ? gameState.tiedPlayers : undefined
      );
      
      // Vote immediately with no delay
      onBotVote(bot.id, botVotes);
    });
  }, [votingStarted, votesNeeded, onBotVote, gameState.isTieVote, gameState.tiedPlayers, gameState.players.length, gameState.votes]);

  // Additional immediate bot voting for tie-breaker scenarios
  useEffect(() => {
    if (!votingStarted || !gameState.isTieVote) return;

    const players = gameState.players;
    const bots = players.filter(player => 
      (player.isBot || player.username.startsWith('Bot_')) && 
      !gameState.votes[player.id]
    );
    
    if (bots.length === 0) return;

    console.log('VotingScreen - Immediate tie-breaker bot voting for:', bots.map(b => b.username));

    // Vote immediately for tie-breaker
    bots.forEach((bot) => {
      const botVotes = generateBotVotes(
        bot.id,
        players,
        votesNeeded, // Tie-breaker needs (N-M) votes
        bot.personality || 'random',
        gameState.tiedPlayers
      );
      
      onBotVote(bot.id, botVotes);
    });
  }, [gameState.isTieVote, votingStarted, onBotVote, gameState.tiedPlayers, gameState.players.length, gameState.votes]);

  // Stable vote toggle handler
  const handleVoteToggle = useCallback((playerId: string) => {
    if (submitted || !votingStarted) return;
    
    // Prevent spectators from voting in custom packs
    const currentPlayer = gameState.players.find(p => p.username === currentUsername);
    if (gameState.selectedPackType === 'custom' && currentPlayer?.role === 'spectator') return;

    setError(null);
    setSelectedVotes(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        // Allow multiple selections up to votesNeeded in both normal and tie-breaker modes
        return prev.length < votesNeeded ? [...prev, playerId] : prev;
      }
    });
  }, [submitted, votingStarted, votesNeeded, gameState.players, currentUsername, gameState.selectedPackType]);

  // Stable submit handler
  const handleSubmit = useCallback(() => {
    if (submitted || !votingStarted || selectedVotes.length !== votesNeeded) {
      if (selectedVotes.length !== votesNeeded) {
        setError(`Please select exactly ${votesNeeded} player${votesNeeded > 1 ? 's' : ''} to vote for.`);
      }
      return;
    }

    // Prevent spectators from submitting votes in custom packs
    const currentPlayer = gameState.players.find(p => p.username === currentUsername);
    if (gameState.selectedPackType === 'custom' && currentPlayer?.role === 'spectator') return;

      setSubmitted(true);
    setError(null);
    onVote(selectedVotes);
  }, [submitted, votingStarted, selectedVotes.length, votesNeeded, selectedVotes, onVote]);

  // Memoize filtered players for rendering - exclude spectators for custom packs
  const playersToShow = useMemo(() => 
    gameState.players
      .filter(p => !gameState.eliminatedPlayers.includes(p.id) && 
                  (gameState.selectedPackType !== 'custom' || p.role !== 'spectator')),
    [gameState.players, gameState.eliminatedPlayers, gameState.selectedPackType]
  );

  // Check if current user is spectator
  const isSpectator = currentPlayer?.role === 'spectator';

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
        {/* Header Section */}
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <span className="text-2xl">{votingStarted ? '🗳️' : '💬'}</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              {gameState.isTieVote 
                ? 'Amazing Tie-Breaker'
                : (votingStarted ? 'Amazing Vote' : 'Amazing Discussion')
              }
            </span>
          </h1>
          
          <p className="text-lg mb-6" style={{ color: '#D1D5DB' }}>
            {gameState.isTieVote 
              ? `Vote for ${gameState.impostorCount - gameState.eliminatedPlayers.length} player${gameState.impostorCount - gameState.eliminatedPlayers.length > 1 ? 's' : ''} to eliminate from the tied players`
              : (votingStarted ? 'Vote for the impostors' : 'Discuss and find the impostors')
            }
          </p>
          
          {/* Tie-Breaker Indicator */}
          {gameState.isTieVote && (
            <div className="backdrop-blur-sm rounded-2xl p-4 mb-6 border shadow-2xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div className="flex items-center justify-center text-white">
                <span className="text-lg font-semibold">
                  🎯 TIE-BREAKER ROUND
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Question/Word */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">❓</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {gameState.gameMode === 'questions' ? 'Question:' : 'Word:'}
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {mainContent}
            </p>
          </div>
            </div>

        {/* Discussion Timer or Voting Progress */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-gray-600/50 mb-6">
          <div className="text-center">
            {!votingStarted && !gameState.isTieVote ? (
              <div className="flex items-center justify-center space-x-3">
                <Clock className="w-6 h-6 text-blue-400" />
                <p className="text-white text-lg font-semibold">
                  Discussion Time: {discussionTimeLeft}s
                </p>
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
            ) : (() => {
              if (gameState.selectedPackType === 'custom' && isSpectator) {
                return (
                  <div className="flex items-center justify-center space-x-3">
                    <User className="w-6 h-6 text-gray-400" />
                    <p className="text-gray-300 text-lg font-semibold">
                      You are spectating - Watch the voting unfold!
                    </p>
                    <User className="w-6 h-6 text-gray-400" />
            </div>
                );
              }
              return (
                <p className="text-white text-lg font-semibold">
                  {gameState.isTieVote 
                    ? `Select ${votesNeeded} player${votesNeeded > 1 ? 's' : ''} to eliminate (${selectedVotes.length}/${votesNeeded})`
                    : `Select ${votesNeeded} impostor${votesNeeded > 1 ? 's' : ''} (${selectedVotes.length}/${votesNeeded})`
                  }
                </p>
              );
            })()}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-200 text-center font-medium">{error}</p>
          </div>
        )}

        {/* Answers Display / Voting Section */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-gray-600/50 mb-6">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            {votingStarted ? 'Tap Answer Cards to Vote' : 'Review All Answers'}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {playersToShow.map((player) => {
              const isSelected = selectedVotes.includes(player.id);
              const isEligible = eligiblePlayers.some(p => p.id === player.id);
              
            return (
            <div
              key={player.id}
                  className={`relative p-4 rounded-xl border-2 transition-all transform duration-300 min-h-[200px] flex flex-col ${
                    votingStarted 
                      ? (isSelected
                        ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20'
                        : isEligible
                        ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-600/50 hover:scale-105 cursor-pointer'
                        : 'bg-gray-800/30 border-gray-700/50 opacity-50')
                      : 'bg-gray-700/50 border-gray-600/50'
                  } ${votingStarted && submitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={votingStarted && isEligible && !submitted && !isSpectator ? () => handleVoteToggle(player.id) : undefined}
                >
                  {/* Avatar */}
                  <div className="relative mx-auto mb-3">
                {player.avatar && player.avatar.startsWith('data:') ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                  <img
                    src={player.avatar}
                          alt={`${player.username}'s avatar`}
                    className="w-full h-full object-cover"
                  />
                      </div>
                ) : player.avatar ? (
                      <div className={`w-12 h-12 ${player.avatar} rounded-full flex items-center justify-center`}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {player.isHost && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-xs">👑</span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
              </div>

                  {/* Name */}
                  <div className="text-center mb-2">
                    <h3 className="text-sm font-bold text-white truncate">
                {player.username}
              </h3>
                  </div>
                  
                  {/* Answer Display */}
                  <div className="flex-grow flex flex-col justify-center">
                    <div className="text-xs text-gray-200 bg-black/20 rounded-2xl p-1.5 break-words leading-tight flex-grow flex items-center justify-center text-center overflow-hidden">
                      <span className="block max-w-full">
                        {gameState.playerAnswers[player.id] || 'No answer'}
                      </span>
                </div>
                  </div>
                  
                  {votingStarted && !isEligible && (
                    <div className="mt-2 text-center">
                      <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                        Not available
                      </span>
                </div>
              )}
            </div>
            );
          })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {!votingStarted && !gameState.isTieVote ? (
            // Discussion Phase (only for normal voting)
            <div className="space-y-4">
              {isHost ? (
              <button
                  onClick={handleStartVoting}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 font-semibold text-lg"
                >
                  <Play className="w-6 h-6" />
                <span>Start Voting</span>
              </button>
            ) : (
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                  <div className="flex items-center justify-center text-blue-200">
                    <MessageCircle className="w-6 h-6 mr-3" />
                    <span className="font-semibold">Waiting for host to start voting...</span>
                  </div>
                  <p className="text-blue-200 text-sm mt-2 text-center">
                    Discuss the answers above and decide who to vote for!
                  </p>
                </div>
              )}

              {/* Discussion Instructions */}
              <div className="bg-gray-700/50 border border-gray-600/50 rounded-xl p-4">
                <div className="flex items-center justify-center text-gray-300">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Discussion Phase</span>
                </div>
                <p className="text-gray-400 text-sm mt-2 text-center">
                  Review all answers and discuss who you think are the impostors. 
                  {isHost ? ' Click "Start Voting" when ready.' : ' The host will start voting when ready.'}
                </p>
              </div>
          </div>
          ) : (
            <>
              {!isSpectator && (
                // Voting Phase (normal voting or tie-breaker) - only for non-spectators
                <div className="space-y-4">
          <button
            onClick={handleSubmit}
                    disabled={submitted || selectedVotes.length !== votesNeeded}
                    className={`w-full py-4 rounded-xl shadow-lg transform transition-all duration-300 flex items-center justify-center space-x-3 font-semibold text-lg ${
                      submitted || selectedVotes.length !== votesNeeded
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    <Vote className="w-6 h-6" />
                    <span>
                      {submitted ? 'Votes Submitted!' : `Submit Vote${votesNeeded > 1 ? 's' : ''}`}
                    </span>
                  </button>
                  
                  {submitted && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                      <div className="flex items-center justify-center text-green-200">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <span className="font-semibold">Votes Submitted!</span>
                      </div>
                      <p className="text-green-200 text-sm mt-2 text-center">Waiting for other players...</p>
                    </div>
                  )}
                </div>
              )}
              
              {isSpectator && (
                // Spectator waiting message
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-6">
                  <div className="flex items-center justify-center text-blue-200">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-white" />
            </div>
                    <span className="font-semibold text-lg">Waiting for players to finish voting...</span>
              </div>
                  <p className="text-blue-200 text-sm mt-2 text-center">You are spectating the voting process</p>
            </div>
              )}
            </>
          )}
          </div>
      </div>
    </div>
  );
}