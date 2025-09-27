import { useState, useEffect } from 'react';
import { MessageCircle, Clock, User, Crown, Eye, EyeOff, Users, Play, ArrowRight, Mic, Volume2 } from 'lucide-react';
import { GameState, Language } from '../types';
import { getNextPlayer, advanceTurn } from '../utils/gameLogic';

interface DiscussionScreenProps {
  gameState: GameState;
  currentUsername: string;
  onProceedToVoting: () => void;
  onUpdateGameState: (updatedGameState: GameState) => void;
  language: Language;
}

export default function DiscussionScreen({
  gameState,
  currentUsername,
  onProceedToVoting,
  onUpdateGameState,
  language
}: DiscussionScreenProps) {
  const { players, gameMode, playerAnswers, currentQuestion, playerRoles, startingPlayer, turnOrder, currentTurnPlayer } = gameState;
  const currentPlayer = players.find(p => p.username === currentUsername);
  const isHost = currentPlayer?.isHost || false;


  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes discussion time
  const [showAnswers, setShowAnswers] = useState(true); // Always show answers in discussion

  const texts = {
    en: {
      discussionTime: 'Discussion Time',
      proceedToVoting: 'Start Voting',
      waitingForHost: 'Waiting for host to start voting...',
      playerAnswers: 'Player Answers',
      noAnswer: 'No answer provided',
      discussionPhase: 'Discuss the answers and find the impostors!',
      playerWords: 'Player Words',
      wordsPhase: 'Discuss who might be the impostor!',
      innocentQuestion: 'Innocent Question',
      showAnswers: 'Show All Answers',
      hideAnswers: 'Hide All Answers',
      playerRole: 'Role',
      innocent: 'Innocent',
      impostor: 'Impostor',
      jester: 'Jester',
      // Turn-based discussion texts
      youAreStarting: 'You are starting the discussion!',
      playerIsStarting: 'is starting the discussion!',
      currentSpeaker: 'Current Speaker',
      nextPlayer: 'Next Player',
      turnOrder: 'Turn Order',
      yourTurn: 'Your Turn',
      waitingForTurn: 'Waiting for your turn...',
      discussionStarted: 'Discussion has started!',
      sayWordOutLoud: 'Say your word out loud!',
      listenToPlayer: 'Listen to what the player says',
      nextTurn: 'Next Turn',
      passTurn: 'Pass Turn',
      hostVotingInfo: 'As the host, you can start voting at any time during the discussion'
    },
    ru: {
      discussionTime: 'Время обсуждения',
      proceedToVoting: 'Начать голосование',
      waitingForHost: 'Ждем хоста для начала голосования...',
      playerAnswers: 'Ответы игроков',
      noAnswer: 'Ответ не предоставлен',
      discussionPhase: 'Обсудите ответы и найдите самозванцев!',
      playerWords: 'Слова игроков',
      wordsPhase: 'Обсудите, кто может быть самозванцем!',
      innocentQuestion: 'Вопрос для честных',
      showAnswers: 'Показать все ответы',
      hideAnswers: 'Скрыть все ответы',
      playerRole: 'Роль',
      innocent: 'Честный',
      impostor: 'Самозванец',
      jester: 'Шут',
      // Turn-based discussion texts
      youAreStarting: 'Вы начинаете обсуждение!',
      playerIsStarting: 'начинает обсуждение!',
      currentSpeaker: 'Текущий докладчик',
      nextPlayer: 'Следующий игрок',
      turnOrder: 'Порядок ходов',
      yourTurn: 'Ваш ход',
      waitingForTurn: 'Ждем вашего хода...',
      discussionStarted: 'Обсуждение началось!',
      sayWordOutLoud: 'Скажите свое слово вслух!',
      listenToPlayer: 'Слушайте, что говорит игрок',
      nextTurn: 'Следующий ход',
      passTurn: 'Передать ход',
      hostVotingInfo: 'Как хост, вы можете начать голосование в любое время во время обсуждения'
    },
    ka: {
      discussionTime: 'განხილვის დრო',
      proceedToVoting: 'ხმის მიცემის დაწყება',
      waitingForHost: 'ველოდებით მასპინძელს ხმის მიცემის დასაწყებად...',
      playerAnswers: 'მოთამაშეების პასუხები',
      noAnswer: 'პასუხი არ არის მოწოდებული',
      discussionPhase: 'განიხილეთ პასუხები და იპოვეთ თაღლითები!',
      playerWords: 'მოთამაშეების სიტყვები',
      wordsPhase: 'განიხილეთ ვინ შეიძლება იყოს თაღლითი!',
      innocentQuestion: 'უდანაშაულო კითხვა',
      showAnswers: 'ყველა პასუხის ჩვენება',
      hideAnswers: 'ყველა პასუხის დამალვა',
      playerRole: 'როლი',
      innocent: 'უდანაშაულო',
      impostor: 'თაღლითი',
      jester: 'ჯუკი',
      // Turn-based discussion texts
      youAreStarting: 'თქვენ იწყებთ განხილვას!',
      playerIsStarting: 'იწყებს განხილვას!',
      currentSpeaker: 'მიმდინარე მოლაპარაკე',
      nextPlayer: 'შემდეგი მოთამაშე',
      turnOrder: 'მოძრაობის რიგი',
      yourTurn: 'თქვენი მოძრაობა',
      waitingForTurn: 'ველოდებით თქვენს მოძრაობას...',
      discussionStarted: 'განხილვა დაიწყო!',
      sayWordOutLoud: 'თქვით თქვენი სიტყვა ხმამაღლა!',
      listenToPlayer: 'მოუსმინეთ რას ამბობს მოთამაშე',
      nextTurn: 'შემდეგი მოძრაობა',
      passTurn: 'მოძრაობის გადაცემა',
      hostVotingInfo: 'მასპინძლად, შეგიძლიათ ხმის მიცემა დაიწყოთ ნებისმიერ დროს განხილვის დროს'
    }
  };

  const t = texts[language];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerRole = (playerId: string) => {
    return playerRoles[playerId] || 'innocent';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'innocent': return 'from-green-500 to-emerald-500';
      case 'impostor': return 'from-red-500 to-rose-500';
      case 'jester': return 'from-purple-500 to-violet-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'innocent': return t.innocent;
      case 'impostor': return t.impostor;
      case 'jester': return t.jester;
      default: return '';
    }
  };

  // Turn-based discussion helper functions
  const isCurrentPlayerStarting = () => {
    return startingPlayer && currentPlayer && startingPlayer.id === currentPlayer.id;
  };

  const getNextPlayerInTurn = () => {
    if (!currentTurnPlayer || !turnOrder.length) return null;
    return getNextPlayer(currentTurnPlayer, turnOrder);
  };

  const isCurrentPlayerTurn = () => {
    return currentTurnPlayer && currentPlayer && currentTurnPlayer.id === currentPlayer.id;
  };

  // Handle turn advancement
  const handleNextTurn = () => {
    const updatedGameState = advanceTurn(gameState);
    onUpdateGameState(updatedGameState);
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#101721' }}>
      {/* Updated DiscussionScreen with consistent styling */}
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
              <span className="text-2xl">💬</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Discussion
            </span>
          </h1>
          <p className="text-lg mb-6" style={{ color: '#D1D5DB' }}>
            {gameMode === 'questions' ? t.discussionPhase : t.wordsPhase}
          </p>
          
          {startingPlayer && gameMode === 'words' && (
            <div className="backdrop-blur-sm rounded-2xl p-4 mb-6 border shadow-2xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              {isCurrentPlayerStarting() ? (
                <p className="text-orange-300 font-semibold flex items-center justify-center space-x-3 text-lg">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <span>{t.youAreStarting}</span>
                </p>
              ) : (
                <p className="text-orange-300 font-semibold text-lg">
                  <span className="font-bold text-orange-200">{startingPlayer.username}</span> {t.playerIsStarting}
                </p>
              )}
            </div>
          )}
          
          {/* Timer */}
          <div className="backdrop-blur-sm rounded-2xl p-4 border shadow-2xl inline-block" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <div className="flex items-center justify-center space-x-3">
              <div className={`p-3 rounded-full ${timeLeft < 60 ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                <Clock className={`w-6 h-6 ${timeLeft < 60 ? 'text-red-400' : 'text-blue-400'}`} />
              </div>
              <span className={`font-mono text-2xl font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Innocent Question Display (for Questions Game) */}
        {gameMode === 'questions' && (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                <span className="text-2xl">❓</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">
                {gameMode === 'words' ? 'Your Word' : t.innocentQuestion}
              </h3>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-lg">
                <p className="text-lg font-medium text-white leading-relaxed break-words hyphens-auto">
                  {gameMode === 'words' ? gameState.currentWord : currentQuestion}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Starting Player Display (for Word Game) */}
        {gameMode === 'words' && (() => {
          // Randomly select a starting player from non-eliminated players
          const activePlayers = players.filter(p => !p.isEliminated);
          const randomStartingPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];

          return (
            <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-6 text-white">
                  Starting Player:
                </h3>
                
                {/* Player Card - Vertical Layout */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl mb-6 w-56 mx-auto">
                  <div className="flex flex-col items-center text-center">
                    {randomStartingPlayer?.avatar ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center mb-3">
                        <img
                          src={randomStartingPlayer.avatar}
                          alt={`${randomStartingPlayer.username}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-3">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <span className="font-bold text-white text-xl">{randomStartingPlayer?.username}</span>
                  </div>
                </div>
                
                <p className="text-green-200/80 text-lg font-medium">
                  Start And Go Around In A Circle
                </p>
              </div>
            </div>
          );
        })()}

        {/* Player Answers/Words */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {gameMode === 'questions' ? t.playerAnswers : t.playerWords}
              </h3>
            </div>
            {gameMode === 'questions' && (
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center space-x-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 border border-white/20 backdrop-blur-sm"
              >
                {showAnswers ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
                <span className="font-semibold text-white">
                  {showAnswers ? t.hideAnswers : t.showAnswers}
                </span>
              </button>
            )}
          </div>
          
          {(gameMode === 'questions' ? showAnswers : true) && (
            <div className={`grid gap-6 ${gameMode === 'words' ? 'grid-cols-2' : 'grid-cols-1 max-h-96 overflow-y-auto pr-2'}`}>
              {players.map((player) => {
                const playerRole = getPlayerRole(player.id);
                const isCurrentPlayer = player.username === currentUsername;
                const isCurrentTurn = gameMode === 'words' && isCurrentPlayerTurn() && currentPlayer && player.id === currentPlayer.id;
                
                return (
                  <div
                    key={player.id}
                    className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 shadow-lg ${
                      isCurrentPlayer 
                        ? 'bg-gray-800/50 border-blue-400/50 shadow-blue-500/20' 
                        : isCurrentTurn
                        ? 'bg-gray-800/50 border-orange-400/50 shadow-orange-500/20 animate-pulse'
                        : 'bg-gray-800/50 border-gray-700/50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      {player.avatar && player.avatar.startsWith('data:') ? (
                        <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg mb-3 ${isCurrentTurn ? 'animate-bounce' : ''}`}>
                          <img 
                            src={player.avatar} 
                            alt={`${player.username}'s avatar`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : player.avatar ? (
                        <div className={`w-16 h-16 ${player.avatar} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg mb-3 ${isCurrentTurn ? 'animate-bounce' : ''}`}>
                          <User className="w-8 h-8 text-white" />
                        </div>
                      ) : (
                        <div className={`w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg mb-3 ${isCurrentTurn ? 'animate-bounce' : ''}`}>
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                      
                      {/* Player Name and Host Crown */}
                      <div className="flex items-center space-x-2 mb-3">
                        <p className="font-bold text-white text-lg">
                          {player.username}
                          {isCurrentPlayer && ' (You)'}
                        </p>
                        {player.isHost && (
                          <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      
                      <div className="w-full">
                        <div>
                          {gameMode === 'questions' ? (
                            playerAnswers[player.id] ? (
                              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl">
                                <p className="text-white leading-relaxed">{playerAnswers[player.id]}</p>
                              </div>
                            ) : (
                              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
                                <p className="text-gray-400 italic text-center">{t.noAnswer}</p>
                              </div>
                            )
                          ) : (
                            // For Word Game, only show instruction when it's current player's turn
                            isCurrentTurn ? (
                              <div className="bg-white/5 backdrop-blur-sm border border-white/20 p-4 rounded-xl">
                                <div className="flex items-center justify-center space-x-2">
                                  <Mic className="w-5 h-5" />
                                  <span>{t.sayWordOutLoud}</span>
                                </div>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Host Controls - Show for both questions and words game mode */}
        <div className="space-y-6">
          {isHost ? (
            <div className="space-y-6">
            
            {/* Start Voting Button */}
            <button
              onClick={onProceedToVoting}
              className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1"
              style={{ 
                backgroundColor: '#EF4444',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(239, 68, 68, 0.8)'
              }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <span className="font-semibold text-lg text-white">{t.proceedToVoting}</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="backdrop-blur-sm rounded-2xl p-6 text-center border shadow-2xl" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', borderColor: 'rgba(107, 114, 128, 0.3)' }}>
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Clock className="w-6 h-6 text-gray-400" />
              <p className="text-lg font-semibold text-gray-300">Waiting for Host</p>
            </div>
            <p className="text-gray-400">{t.waitingForHost}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}