import { useState, useEffect, useCallback } from 'react';
import { Clock, Send, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { GameState, Language } from '../types';

interface QuestionScreenProps {
  gameState: GameState;
  currentUsername: string;
  onSubmitAnswer: (answer: string) => void;
  language: Language;
}

export default function QuestionScreen({
  gameState,
  currentUsername,
  onSubmitAnswer,
  language
}: QuestionScreenProps) {
  const { players, playerRoles, jesterCluePlayers } = gameState;
  const currentPlayer = players.find(p => p.username === currentUsername);
  
  // Check if current player is a spectator - they shouldn't see this screen
  if (currentPlayer?.role === 'spectator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-8 text-center border border-gray-600/50 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">🎮 Spectating</h2>
          <p className="text-gray-300 text-lg">You are spectating the game. Return to the lobby to watch the game unfold.</p>
        </div>
      </div>
    );
  }
  
  const playerRole = playerRoles[currentPlayer?.id || ''] || 'innocent';

  // Get role-specific question/word
  const question = playerRole === 'impostor' ? gameState.currentImpostorQuestion : gameState.currentQuestion;
  // For word game mode, all players see their own word
  const word = gameState.gameMode === 'words' ? gameState.currentWord : (playerRole === 'impostor' ? gameState.currentImpostorWord : gameState.currentWord);

  
  // Check if current player should see jester clue
  const shouldShowJesterClue = jesterCluePlayers?.includes(currentPlayer?.id || '') || false;

  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [submitted, setSubmitted] = useState(false); // Start with false, will be set to true for word mode after word is shown
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Word game timer (1 minute)
  const [wordGameTimeLeft, setWordGameTimeLeft] = useState(60);
  const [wordGameTimerRunning, setWordGameTimerRunning] = useState(false);

  // Auto-set submitted and start timer for word game mode
  useEffect(() => {
    if (gameState.gameMode === 'words' && !submitted) {
      setSubmitted(true);
      // Start the timer automatically
      setWordGameTimerRunning(true);
    }
  }, [gameState.gameMode, submitted]);

  // Handle proceed to discussion for word game
  const handleProceedToDiscussion = useCallback(() => {
    setWordGameTimerRunning(false);
    const event = new CustomEvent('navigateToDiscussion');
    window.dispatchEvent(event);
  }, []);


  const handleSubmit = useCallback(async () => {
    // Word game mode - mark as submitted (no actual submission needed)
    if (gameState.gameMode === 'words') {
      setSubmitted(true);
      return;
    }

    if (answer.trim() && !submitted && !isSubmitting) {
      try {
        setIsSubmitting(true);
        setError(null);

        // Simulate potential network delay or error
        await new Promise(resolve => setTimeout(resolve, 500));

        onSubmitAnswer(answer.trim());
        setSubmitted(true);
      } catch (err) {
        setError('Failed to submit answer. Please try again.');
        console.error('Submission error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [gameState.gameMode, answer, submitted, isSubmitting, onSubmitAnswer]);

  // Timer countdown - Only for questions mode
  useEffect(() => {
    if (gameState.gameMode === 'questions' && timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState.gameMode === 'questions' && timeLeft === 0 && !submitted) {
      // Auto-submit when timer runs out (only for questions mode)
      handleSubmit();
    }
  }, [gameState.gameMode, timeLeft, submitted, handleSubmit]);

  // Word game timer and auto-navigation
  useEffect(() => {
    if (gameState.gameMode === 'words' && wordGameTimerRunning && wordGameTimeLeft > 0) {
      const timer = setTimeout(() => {
        setWordGameTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-navigate to discussion screen
            setWordGameTimerRunning(false);
            // Navigate to discussion screen
            const event = new CustomEvent('navigateToDiscussion');
            window.dispatchEvent(event);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.gameMode, wordGameTimerRunning, wordGameTimeLeft]);

  // Auto-submit all remaining answers when timer runs out (including bots) - Only for questions mode
  useEffect(() => {
    if (gameState.gameMode === 'questions' && timeLeft === 0 && !submitted) {
      // This will trigger auto-submission of all remaining answers
      const event = new CustomEvent('forceSubmitAllAnswers');
      window.dispatchEvent(event);
    }
  }, [gameState.gameMode, timeLeft, submitted]);

  const texts = {
    en: {
      yourQuestion: 'Your Question',
      answerPlaceholder: 'Type your answer...',
      submit: 'Submit Answer',
      submitted: 'Answer Submitted!',
      timeRemaining: 'Time Remaining',
      jesterClue: 'You might be a jester... 🤡',
      jesterClueDescription: 'Act suspicious to get voted out!',
      waitingForOthers: 'Waiting for other players to submit...',
      proceedToRoleReveal: 'Proceed to Role Reveal',
      submitting: 'Submitting...',
      submissionError: 'Failed to submit answer. Please try again.',
      tryAgain: 'Try Again'
    },
    ru: {
      yourQuestion: 'Ваш вопрос',
      answerPlaceholder: 'Введите ваш ответ...',
      submit: 'Отправить ответ',
      submitted: 'Ответ отправлен!',
      timeRemaining: 'Осталось времени',
      jesterClue: 'Возможно, вы шут... 🤡',
      jesterClueDescription: 'Ведите себя подозрительно, чтобы вас проголосовали!',
      waitingForOthers: 'Ждем других игроков...',
      proceedToRoleReveal: 'Перейти к раскрытию ролей',
      submitting: 'Отправка...',
      submissionError: 'Не удалось отправить ответ. Попробуйте еще раз.',
      tryAgain: 'Попробовать снова'
    },
    ka: {
      yourQuestion: 'თქვენი კითხვა',
      answerPlaceholder: 'ჩაწერეთ თქვენი პასუხი...',
      submit: 'პასუხის გაგზავნა',
      submitted: 'პასუხი გაიგზავნა!',
      timeRemaining: 'დარჩენილი დრო',
      jesterClue: 'შესაძლოა ჯოკერი ხართ... 🤡',
      jesterClueDescription: 'იქცეოდით ეჭვიანად, რომ გამოგიყვანოთ!',
      waitingForOthers: 'ველოდებით სხვა მოთამაშეებს...',
      proceedToRoleReveal: 'როლების გამოვლენაზე გადასვლა',
      submitting: 'გაგზავნა...',
      submissionError: 'პასუხის გაგზავნა ვერ მოხერხდა. გთხოვთ, სცადეთ კვლავ.',
      tryAgain: 'კვლავ სცადეთ'
    }
  };

  const t = texts[language];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


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
              <span className="text-2xl">❓</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Answer
            </span>
          </h1>
          <p className="text-lg mb-6" style={{ color: '#D1D5DB' }}>Answer the question and find the impostors</p>
          
          {/* Timer - Show for both modes but positioned differently */}
          {gameState.gameMode === 'questions' && (
            <div className="backdrop-blur-sm rounded-2xl p-4 border shadow-2xl inline-block" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              <div className="flex items-center justify-center gap-3 text-white">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-medium">
                  {t.timeRemaining}: {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          )}

          {/* Word game timer - shown at top */}
          {gameState.gameMode === 'words' && wordGameTimerRunning && (
            <div className="backdrop-blur-sm rounded-2xl p-4 border shadow-2xl inline-block" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              <div className="flex items-center justify-center gap-3 text-white">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-medium">
                  Time Remaining: {Math.floor(wordGameTimeLeft / 60)}:{(wordGameTimeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Jester Clue Card */}
        {shouldShowJesterClue && (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-yellow-300 text-lg">{t.jesterClue}</p>
                <p className="text-yellow-200/80">{t.jesterClueDescription}</p>
              </div>
            </div>
          </div>
        )}

        {/* Question/Word Card */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {gameState.gameMode === 'words' ? 'Your Word' : t.yourQuestion}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-red-400 to-orange-400 rounded-full mx-auto"></div>
          </div>

          {gameState.gameMode === 'words' ? (
            // Word Game Mode - just display the word
            <div className="bg-gray-700/50 border border-gray-600/50 rounded-xl p-6">
              <p className="text-center text-2xl font-bold text-white leading-relaxed break-words hyphens-auto">
                "{word || 'Loading word...'}"
              </p>
            </div>
          ) : (
            // Questions Game Mode - display question
            <div className="bg-gray-700/50 border border-gray-600/50 rounded-xl p-6">
              <p className="text-center text-xl text-white leading-relaxed break-words hyphens-auto">
                "{question || 'Loading question...'}"
              </p>
            </div>
          )}
        </div>

        {/* Answer Input Card - Only show for Questions mode */}
        {gameState.gameMode === 'questions' && !submitted ? (
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="space-y-6">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t.answerPlaceholder}
                className="w-full h-24 px-4 py-3 bg-white/10 border border-white/20 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-300"
                maxLength={50}
              />
              
              {/* Character count and submit button */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {answer.length}/50 characters
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || timeLeft === 0 || isSubmitting}
                  className="group relative rounded-2xl px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:-translate-y-0"
                  style={{ 
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(16, 185, 129, 0.8)'
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3 text-white font-semibold">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t.submit}
                      </>
                    )}
                  </div>
                </button>
              </div>
              
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-red-300 text-sm">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-300 font-bold text-lg"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Word game mode - show button and timer
          gameState.gameMode === 'words' ? (
            <div className="backdrop-blur-sm rounded-3xl p-8 mb-8 border shadow-2xl text-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              {/* Proceed Button */}
              <button
                onClick={handleProceedToDiscussion}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 font-semibold text-lg"
              >
                <MessageCircle className="w-6 h-6" />
                <span>Proceed To Discussion</span>
              </button>
            </div>
          ) : (
            <div className="backdrop-blur-sm rounded-3xl p-8 mb-8 border shadow-2xl text-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-green-300 mb-3">{t.submitted}</h3>
              <p className="text-green-200/80 text-lg">{t.waitingForOthers}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
