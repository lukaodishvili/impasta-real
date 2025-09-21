import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, Crown, Eye, EyeOff } from 'lucide-react';
import { GameState, Language } from '../types';
import { getWordForRole } from '../utils/gameLogic';

interface RoleConfirmationScreenProps {
  gameState: GameState;
  currentUsername: string;
  onProceedToDiscussion: () => void;
  language: Language;
}

export default function RoleConfirmationScreen({
  gameState,
  currentUsername,
  onProceedToDiscussion,
  language
}: RoleConfirmationScreenProps) {
  const { players, currentWord, playerRoles } = gameState;
  const currentPlayer = players.find(p => p.username === currentUsername);
  const isHost = currentPlayer?.isHost || false;
  const playerRole = playerRoles[currentPlayer?.id || ''] || 'innocent';

  const [showRole, setShowRole] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute to understand role
  const [playerUnderstood, setPlayerUnderstood] = useState(false);

  const texts = {
    en: {
      understandYourRole: 'Understand Your Role',
      yourRole: 'Your Role',
      innocent: 'Innocent Player',
      impostor: 'You are the Impasta!',
      jester: 'Jester',
      yourWord: 'Your Word',
      noWord: 'You don\'t get a word - blend in!',
      roleDescription: {
        innocent: 'You have the same word as other innocent players. Help find the impostors!',
        impostor: 'You don\'t know the word! Pretend you do and blend in with the innocents.',
        jester: 'Try to get voted out to win the game!'
      },
      iUnderstand: 'I Understand',
      waitingForOthers: 'Waiting for others to understand their roles...',
      proceedToDiscussion: 'Start Discussion',
      timeRemaining: 'Time Remaining',
      playersReady: 'Players Ready',
      showRole: 'Show Role',
      hideRole: 'Hide Role',
      roleHint: 'Take your time to understand your role and strategy!'
    },
    ru: {
      understandYourRole: 'Понять свою роль',
      yourRole: 'Ваша роль',
      innocent: 'Честный игрок',
      impostor: 'Вы самозванец!',
      jester: 'Шут',
      yourWord: 'Ваше слово',
      noWord: 'У вас нет слова - притворяйтесь!',
      roleDescription: {
        innocent: 'У вас то же слово, что и у других честных игроков. Помогите найти самозванцев!',
        impostor: 'Вы не знаете слово! Притворяйтесь, что знаете, и смешайтесь с честными.',
        jester: 'Постарайтесь, чтобы вас исключили, чтобы выиграть игру!'
      },
      iUnderstand: 'Я понимаю',
      waitingForOthers: 'Ждем других, чтобы они поняли свои роли...',
      proceedToDiscussion: 'Начать обсуждение',
      timeRemaining: 'Осталось времени',
      playersReady: 'Игроки готовы',
      showRole: 'Показать роль',
      hideRole: 'Скрыть роль',
      roleHint: 'Потратьте время на понимание своей роли и стратегии!'
    },
    ka: {
      understandYourRole: 'როლის გაგება',
      yourRole: 'თქვენი როლი',
      innocent: 'პატიოსანი მოთამაშე',
      impostor: 'თქვენ ხართ თაღლითი!',
      jester: 'ჯუკი',
      yourWord: 'თქვენი სიტყვა',
      noWord: 'თქვენ არ გაქვთ სიტყვა - ფარალეთ!',
      roleDescription: {
        innocent: 'თქვენ გაქვთ იგივე სიტყვა, რაც სხვა უდანაშაულო მოთამაშეებს. დაეხმარეთ თაღლითების პოვნაში!',
        impostor: 'თქვენ არ იცით სიტყვა! ფარალეთ, რომ იცით, და შერეულდით უდანაშაულოებთან.',
        jester: 'შეეცადეთ, რომ გაგირიყოთ, რომ მოიგოთ თამაში!'
      },
      iUnderstand: 'მესმის',
      waitingForOthers: 'ველოდებით სხვებს, რომ გაიგონ თავიანთი როლები...',
      proceedToDiscussion: 'განხილვის დაწყება',
      timeRemaining: 'დარჩენილი დრო',
      playersReady: 'მოთამაშეები მზად არიან',
      showRole: 'როლის ჩვენება',
      hideRole: 'როლის დამალვა',
      roleHint: 'გამოიყენეთ დრო როლის და სტრატეგიის გასაგებად!'
    }
  };

  const t = texts[language];

  // Timer for role understanding
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
    return `${seconds}s`;
  };

  const getRoleColor = () => {
    switch (playerRole) {
      case 'innocent': return 'from-green-500 to-emerald-500';
      case 'impostor': return 'from-red-500 to-rose-500';
      case 'jester': return 'from-purple-500 to-violet-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getRoleText = () => {
    switch (playerRole) {
      case 'innocent': return t.innocent;
      case 'impostor': return t.impostor;
      case 'jester': return t.jester;
      default: return '';
    }
  };

  const getRoleWord = () => {
    return getWordForRole(playerRole, currentWord);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            {t.understandYourRole}
          </h1>
          <p className="text-gray-600">{t.roleHint}</p>
        </div>

        {/* Timer */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-600">{t.timeRemaining}</span>
            <span className={`font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-gray-800'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Role Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <div className="text-center">
            <button
              onClick={() => setShowRole(!showRole)}
              className="flex items-center justify-center space-x-2 mx-auto mb-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {showRole ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              <span className="font-medium">
                {showRole ? t.hideRole : t.showRole}
              </span>
            </button>
            
            {showRole && (
              <div className="space-y-6">
                {/* Role Display */}
                <div className={`bg-gradient-to-r ${getRoleColor()} text-white p-6 rounded-xl`}>
                  <h3 className="text-2xl font-bold mb-2">{getRoleText()}</h3>
                  <p className="text-sm opacity-90">{t.roleDescription[playerRole]}</p>
                </div>

                {/* Word Display */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                  <h4 className="text-lg font-semibold mb-3 text-gray-800">{t.yourWord}</h4>
                  {playerRole === 'impostor' ? (
                    <p className="text-lg font-medium text-gray-500 italic">{t.noWord}</p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-800">{getRoleWord()}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Players Status */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">{t.playersReady}</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {players.map((player) => {
              const isCurrentPlayer = player.username === currentUsername;
              const playerRole = playerRoles[player.id] || 'innocent';
              
              const getRoleColor = (role: string) => {
                switch (role) {
                  case 'innocent': return 'from-green-500 to-emerald-500';
                  case 'impostor': return 'from-red-500 to-rose-500';
                  case 'jester': return 'from-purple-500 to-violet-500';
                  default: return 'from-gray-500 to-slate-500';
                }
              };
              
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl border transition-all duration-300 ${
                    isCurrentPlayer 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {player.avatar && player.avatar.startsWith('data:') ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img 
                          src={player.avatar} 
                          alt={`${player.username}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : player.avatar ? (
                      <div className={`w-8 h-8 ${player.avatar} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-xs text-white font-bold">
                          {player.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-bold">
                          {player.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {player.username}
                          {isCurrentPlayer && ' (You)'}
                        </p>
                        {player.isHost && (
                          <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      {isCurrentPlayer && (
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getRoleColor(playerRole)}`}>
                          {playerRole === 'innocent' ? 'Innocent' : playerRole === 'impostor' ? 'Impostor' : 'Jester'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center">
          {isHost ? (
            <button
              onClick={onProceedToDiscussion}
              className="bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
            >
              {t.proceedToDiscussion}
            </button>
          ) : (
            <div className="space-y-4">
              {!playerUnderstood ? (
                <button
                  onClick={() => setPlayerUnderstood(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
                >
                  {t.iUnderstand}
                </button>
              ) : (
                <div className="bg-green-100 text-green-800 py-4 px-8 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">{t.waitingForOthers}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
