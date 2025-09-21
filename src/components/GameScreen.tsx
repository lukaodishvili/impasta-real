import React, { useState, useEffect } from 'react';
import { Clock, Send, Eye, EyeOff } from 'lucide-react';
import { GameState, Language } from '../types';
import { getQuestionForRole, getWordForRole } from '../utils/gameLogic';

interface GameScreenProps {
  gameState: GameState;
  currentUsername: string;
  onSubmitAnswer: (answer: string) => void;
  onProceedToDiscussion: () => void;
  language: Language;
}

export default function GameScreen({
  gameState,
  currentUsername,
  onSubmitAnswer,
  onProceedToDiscussion,
  language
}: GameScreenProps) {
  const { gameMode, currentQuestion, currentImpostorQuestion, currentWord, players, playerRoles } = gameState;
  const currentPlayer = players.find(p => p.username === currentUsername);
  const playerRole = playerRoles[currentPlayer?.id || ''] || 'innocent';
  
  // Get role-specific content
  const roleQuestion = getQuestionForRole(playerRole, gameMode, currentQuestion, currentImpostorQuestion);
  const roleWord = getWordForRole(playerRole, currentWord);

  const [answer, setAnswer] = useState('');
  const [showRole, setShowRole] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [submitted, setSubmitted] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const texts = {
    en: {
      yourRole: 'Your Role',
      innocent: 'Innocent Player',
      impostor: 'You are the Impasta!',
      jester: 'Jester',
      yourQuestion: 'Your Question',
      yourWord: 'Your Word',
      noWord: 'You don\'t get a word - blend in!',
      answerPlaceholder: 'Type your answer...',
      submit: 'Submit Answer',
      submitted: 'Answer Submitted!',
      timeRemaining: 'Time Remaining',
      backToLobby: 'Back to Lobby',
      roleDescription: {
        innocent: 'Answer honestly and find the impostors',
        impostor: 'Blend in without getting caught',
        jester: 'Try to get voted out to win'
      },
      continue: 'Continue',
      roleRevealed: 'Role Revealed!',
      roundDisplay: 'Round',
      randomizeMode: 'Randomize Mode',
      roleModalDescription: {
        innocent: 'You are innocent! Answer the question honestly and help find the impostors.',
        impostor: 'You are the impostor! Answer the question as if you were innocent to blend in.',
        jester: 'You are the jester! Try to get voted out to win the game.'
      },
      understand: 'I Understand',
      roleModalHint: 'Remember your role and strategy for the discussion phase!'
    },
    ru: {
      yourRole: 'Ваша роль',
      innocent: 'Честный игрок',
      impostor: 'Вы самозванец!',
      jester: 'Шут',
      yourQuestion: 'Ваш вопрос',
      yourWord: 'Ваше слово',
      noWord: 'У вас нет слова - притворяйтесь!',
      answerPlaceholder: 'Введите ваш ответ...',
      submit: 'Отправить ответ',
      submitted: 'Ответ отправлен!',
      timeRemaining: 'Осталось времени',
      backToLobby: 'В лобби',
      roleDescription: {
        innocent: 'Отвечайте честно и найдите самозванцев',
        impostor: 'Притворяйтесь, чтобы вас не поймали',
        jester: 'Постарайтесь, чтобы вас исключили'
      },
      continue: 'Продолжить',
      roleRevealed: 'Роль раскрыта!',
      roundDisplay: 'Раунд',
      randomizeMode: 'Режим рандомизации',
      roleModalDescription: {
        innocent: 'Вы невиновны! Отвечайте на вопрос честно и помогите найти самозванцев.',
        impostor: 'Вы самозванец! Отвечайте на вопрос так, как будто вы невиновны, чтобы скрыться.',
        jester: 'Вы шут! Постарайтесь, чтобы вас исключили, чтобы выиграть игру.'
      },
      understand: 'Я понимаю',
      roleModalHint: 'Помните свою роль и стратегию для фазы обсуждения!'
    },
    ka: {
      yourRole: 'თქვენი როლი',
      innocent: 'პატიოსანი მოთამაშე',
      impostor: 'თქვენ ხართ თაღლითი!',
      jester: 'ჯოკერი',
      yourQuestion: 'თქვენი კითხვა',
      yourWord: 'თქვენი სიტყვა',
      noWord: 'თქვენ არ გაქვთ სიტყვა - შერეულდით!',
      answerPlaceholder: 'ჩაწერეთ თქვენი პასუხი...',
      submit: 'პასუხის გაგზავნა',
      submitted: 'პასუხი გაგზავნილია!',
      timeRemaining: 'დარჩენილი დრო',
      backToLobby: 'ლობიში დაბრუნება',
      roleDescription: {
        innocent: 'უპასუხეთ პატიოსნად და იპოვეთ თაღლითები',
        impostor: 'შერეულდით, რომ არ დაგიჭირონ',
        jester: 'ცადეთ გამოირიცხოთ გასაიმარჯვებლად'
      },
      continue: 'გაგრძელება',
      roleRevealed: 'როლი გამოვლინდა!',
      roundDisplay: 'რაუნდი',
      randomizeMode: 'რანდომიზაციის რეჟიმი',
      roleModalDescription: {
        innocent: 'თქვენ უდანაშაულო ხართ! უპასუხეთ კითხვას პატიოსნად და დაეხმარეთ თაღლითების პოვნაში.',
        impostor: 'თქვენ თაღლითი ხართ! უპასუხეთ კითხვას ისე, თითქოს უდანაშაულო ხართ, რომ დამალულ იყოთ.',
        jester: 'თქვენ ჯუკი ხართ! შეეცადეთ, რომ გაგირიყოთ, რომ მოიგოთ თამაში.'
      },
      understand: 'მესმის',
      roleModalHint: 'დაიმახსოვრეთ თქვენი როლი და სტრატეგია განხილვის ეტაპისთვის!'
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

  const handleSubmit = () => {
    const trimmedAnswer = answer.trim();
    
    // Validate answer is not empty and has meaningful content
    if (trimmedAnswer && trimmedAnswer.length >= 2) {
      onSubmitAnswer(trimmedAnswer);
      setSubmitted(true);
      // Show role revelation modal after submission
      setShowRoleModal(true);
    }
  };

  // Check if answer is valid for submission
  const isAnswerValid = () => {
    const trimmedAnswer = answer.trim();
    return trimmedAnswer && trimmedAnswer.length >= 2;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Timer */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">{t.timeRemaining}</span>
            <span className={`font-mono text-lg font-bold ${timeLeft < 30 ? 'text-red-500' : 'text-gray-800'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Round Display - Only show in Randomize mode */}
        {gameState.isRandomizeMode && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-4 shadow-lg mb-6">
            <div className="text-center">
              <div className="text-sm opacity-90 mb-1">{t.roundDisplay || 'Round'}</div>
              <div className="text-2xl font-bold">{gameState.currentRound}</div>
              <div className="text-xs opacity-75 mt-1">{t.randomizeMode || 'Randomize Mode'}</div>
            </div>
          </div>
        )}

        {/* Role Card - Hidden by default, only show when button is pressed */}
        {(gameMode === 'words' || submitted) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
            <div className="text-center">
              <button
                onClick={() => setShowRole(!showRole)}
                className="flex items-center justify-center space-x-2 mx-auto mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                {showRole ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                <span className="font-medium">{showRole ? 'Hide Role' : 'Show Role'}</span>
              </button>
              
              {showRole && (
                <div className={`bg-gradient-to-r ${getRoleColor()} text-white p-4 rounded-xl mb-4`}>
                  <h3 className="text-xl font-bold mb-2">{getRoleText()}</h3>
                  <p className="text-sm opacity-90">{t.roleDescription[playerRole]}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          {gameMode === 'questions' ? (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">{t.yourQuestion}</h3>
              {roleQuestion ? (
                <div className={`border p-4 rounded-xl mb-6 ${
                  playerRole === 'impostor' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <p className="text-center font-medium text-gray-800">{roleQuestion}</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <p className="text-center text-gray-500">Loading question...</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">{t.yourWord}</h3>
              {roleWord ? (
                <div className={`border p-4 rounded-xl mb-6 ${
                  playerRole === 'impostor' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-center font-bold text-2xl ${
                    playerRole === 'impostor' 
                      ? 'text-red-600' 
                      : 'text-blue-600'
                  }`}>
                    {roleWord}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <p className="text-center text-gray-500">Loading word...</p>
                </div>
              )}
            </div>
          )}

          {/* Answer Input - Only for Questions Game */}
          {gameMode === 'questions' && (
            <div className="space-y-4">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t.answerPlaceholder}
                disabled={submitted}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                maxLength={50}
              />
              
              {/* Answer validation feedback */}
              {answer.trim() && answer.trim().length < 2 && (
                <p className="text-sm text-red-500 mt-1">
                  Answer must be at least 2 characters long
                </p>
              )}
              
              {/* Character count */}
              <p className="text-xs text-gray-500 text-right mt-1">
                {answer.length}/200 characters
              </p>
              
              <button
                onClick={handleSubmit}
                disabled={!isAnswerValid() || submitted}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span className="font-medium">
                  {submitted ? t.submitted : t.submit}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Continue Button - For Words Game or after submitting answer */}
        {(gameMode === 'words' || submitted) && (
          <button
            onClick={onProceedToDiscussion}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-102 transition-all duration-300 font-semibold text-lg"
          >
            {t.continue}
          </button>
        )}
      </div>

      {/* Role Revelation Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform scale-100 transition-all duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.roleRevealed}</h2>
              
              <div className={`bg-gradient-to-r ${getRoleColor()} text-white p-6 rounded-xl mb-6`}>
                <h3 className="text-xl font-bold mb-2">{getRoleText()}</h3>
                <p className="text-sm opacity-90">{t.roleModalDescription[playerRole]}</p>
              </div>
              
              <p className="text-gray-600 text-sm mb-6">{t.roleModalHint}</p>
              
              <button
                onClick={() => setShowRoleModal(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-102 transition-all duration-300 font-semibold"
              >
                {t.understand}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}