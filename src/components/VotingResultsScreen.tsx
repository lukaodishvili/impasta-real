import React from 'react';
import { GameState } from '../types';
import { CheckCircle, Users, AlertTriangle } from 'lucide-react';

interface VotingResultsScreenProps {
  gameState: GameState;
  currentUsername: string;
  language: 'en' | 'ru' | 'ka';
  onStartTieBreaker: () => void;
  onContinueGame: () => void;
}

export default function VotingResultsScreen({
  gameState,
  currentUsername,
  language,
  onStartTieBreaker,
  onContinueGame
}: VotingResultsScreenProps) {
  const players = gameState?.players || [];
  const currentPlayer = players.find(p => p.username === currentUsername);
  
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center text-white">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-2xl font-bold mb-4">Player Not Found</h2>
          <p className="text-lg opacity-80">Unable to find current player: {currentUsername}</p>
        </div>
      </div>
    );
  }

  const getTexts = () => ({
    en: {
      votingResults: 'Voting Results',
      voteBreakdown: 'Vote Breakdown',
      tiedPlayers: 'Tied Players',
      startTieBreaker: 'Start Tie-Breaker Voting',
      continueGame: 'Continue Game',
      noTie: 'No tie detected - proceeding with elimination',
      tieDetected: 'Tie detected! Players need to vote again for tied players only'
    },
    ru: {
      votingResults: 'Результаты голосования',
      voteBreakdown: 'Разбивка голосов',
      tiedPlayers: 'Игроки с равными голосами',
      startTieBreaker: 'Начать голосование при ничьей',
      continueGame: 'Продолжить игру',
      noTie: 'Ничьей не обнаружено - переходим к исключению',
      tieDetected: 'Обнаружена ничья! Игроки должны проголосовать снова только за игроков с равными голосами'
    },
    ka: {
      votingResults: 'ხმის მიცემის შედეგები',
      voteBreakdown: 'ხმების დაყოფა',
      tiedPlayers: 'ტოლი ქულების მქონე მოთამაშეები',
      startTieBreaker: 'ტოლი ქულების ხმის მიცემის დაწყება',
      continueGame: 'თამაშის გაგრძელება',
      noTie: 'ტოლი ქულები არ არის - გადავდივართ გამოყვანაზე',
      tieDetected: 'ტოლი ქულები! მოთამაშეებმა უნდა ხმა მისცენ მხოლოდ ტოლი ქულების მქონე მოთამაშეებისთვის'
    }
  });

  const t = getTexts()[language];

  // Calculate vote counts
  const voteCounts: { [key: string]: number } = {};
  const voteBreakdown: { [key: string]: string[] } = {};
  
  Object.entries(gameState.votes || {}).forEach(([voterId, votes]) => {
    const voter = players.find(p => p.id === voterId);
    if (voter) {
      votes.forEach(votedPlayerId => {
        voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
        if (!voteBreakdown[votedPlayerId]) {
          voteBreakdown[votedPlayerId] = [];
        }
        voteBreakdown[votedPlayerId].push(voter.username);
      });
    }
  });

  // Find tied players
  const maxVotes = Math.max(...Object.values(voteCounts));
  const tiedPlayerIds = Object.keys(voteCounts).filter(playerId => voteCounts[playerId] === maxVotes);
  const isTie = tiedPlayerIds.length > 1;

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
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <span className="text-2xl">🗳️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Results
            </span>
          </h1>
          <p className="text-lg" style={{ color: '#D1D5DB' }}>{t.votingResults}</p>
        </div>

        {/* Vote Breakdown */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
          <h2 className="text-xl font-bold text-white mb-4 text-center">{t.voteBreakdown}</h2>
          <div className="space-y-3">
            {Object.entries(voteCounts).map(([playerId, count]) => {
              const player = players.find(p => p.id === playerId);
              const isTied = tiedPlayerIds.includes(playerId);
              return (
                <div key={playerId} className={`p-3 rounded-lg border-2 ${
                  isTied 
                    ? 'border-yellow-500 bg-yellow-500/20' 
                    : 'border-gray-600 bg-gray-800/50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {player?.username?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-bold">{player?.username || 'Unknown'}</div>
                        <div className="text-gray-300 text-sm">
                          Voted by: {voteBreakdown[playerId]?.join(', ') || 'No votes'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isTied ? 'text-yellow-400' : 'text-white'}`}>
                        {count}
                      </div>
                      <div className="text-sm text-gray-400">votes</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tie Information */}
        {isTie && (
          <div className="backdrop-blur-sm rounded-2xl p-4 mb-6 border shadow-2xl text-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <h3 className="text-lg font-bold text-yellow-200 mb-2">{t.tieDetected}</h3>
            <div className="text-yellow-200">
              <strong>{t.tiedPlayers}:</strong> {tiedPlayerIds.map(id => {
                const player = players.find(p => p.id === id);
                return player?.username || 'Unknown';
              }).join(', ')}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          {isTie ? (
            <button
              onClick={onStartTieBreaker}
              className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1"
              style={{ 
                backgroundColor: '#F59E0B',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(245, 158, 11, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(245, 158, 11, 0.8)'
              }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <span className="font-semibold text-lg text-white">{t.startTieBreaker}</span>
              </div>
            </button>
          ) : (
            <button
              onClick={onContinueGame}
              className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1"
              style={{ 
                backgroundColor: '#10B981',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(16, 185, 129, 0.8)'
              }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <span className="font-semibold text-lg text-white">{t.continueGame}</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
