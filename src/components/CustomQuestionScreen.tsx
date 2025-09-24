import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Language } from '../types';

interface CustomQuestionScreenProps {
  gameMode: 'questions' | 'words';
  onSave: (data: { innocentQuestion?: string; impostorQuestion?: string; playerWord?: string }) => void;
  onBack: () => void;
  language: Language;
}

export default function CustomQuestionScreen({ gameMode, onSave, onBack, language }: CustomQuestionScreenProps) {
  console.log('CustomQuestionScreen rendered with:', { gameMode, language });
  
  const [innocentQuestion, setInnocentQuestion] = useState('');
  const [impostorQuestion, setImpostorQuestion] = useState('');
  const [playerWord, setPlayerWord] = useState('');

  const texts = {
    en: {
      customQuestions: 'Custom Questions',
      customWords: 'Custom Words',
      innocentLabel: 'Question for Innocent Players:',
      impostorLabel: 'Question for Impostors:',
      wordLabel: 'Word for Players:',
      innocentPlaceholder: 'Enter question for innocent players...',
      impostorPlaceholder: 'Enter question for impostors...',
      wordPlaceholder: 'Enter word for players...',
      note: 'Note: As host, you will participate in this game',
      impostorNote: 'Impostors will not receive a word',
      save: 'Save & Continue',
      back: 'Back'
    },
    ru: {
      customQuestions: 'Свои Вопросы',
      customWords: 'Свои Слова',
      innocentLabel: 'Вопрос для честных игроков:',
      impostorLabel: 'Вопрос для самозванцев:',
      wordLabel: 'Слово для игроков:',
      innocentPlaceholder: 'Введите вопрос для честных игроков...',
      impostorPlaceholder: 'Введите вопрос для самозванцев...',
      wordPlaceholder: 'Введите слово для игроков...',
      note: 'Примечание: Как хост, вы будете участвовать в игре',
      impostorNote: 'Самозванцы не получат слово',
      save: 'Сохранить и продолжить',
      back: 'Назад'
    },
    ka: {
      customQuestions: 'შექმენით საკუთარი კითხვები',
      customWords: 'შექმენით საკუთარი სიტყვები',
      innocentLabel: 'კითხვა უდანაშაულო მოთამაშეებისთვის:',
      impostorLabel: 'კითხვა იმპოსტორებისთვის:',
      wordLabel: 'სიტყვა მოთამაშეებისთვის:',
      innocentPlaceholder: 'შეიყვანეთ კითხვა უდანაშაულო მოთამაშეებისთვის...',
      impostorPlaceholder: 'შეიყვანეთ კითხვა იმპოსტორებისთვის...',
      wordPlaceholder: 'შეიყვანეთ სიტყვა მოთამაშეებისთვის...',
      note: 'შენიშვნა: როგორც ჰოსტი, თქვენ მონაწილეობთ თამაშში',
      impostorNote: 'იმპოსტორები არ მიიღებენ სიტყვას',
      save: 'შენახვა და გაგრძელება',
      back: 'უკან'
    }
  };

  const t = texts[language] || texts.en;

  const isValid = gameMode === 'questions' 
    ? innocentQuestion.trim() && impostorQuestion.trim()
    : playerWord.trim();

  const handleSave = () => {
    if (!isValid) return;
    
    if (gameMode === 'questions') {
      onSave({ innocentQuestion, impostorQuestion });
    } else {
      onSave({ playerWord });
    }
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
        {/* Header */}
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: '#3B82F6', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)' }}>
              <span className="text-2xl">✏️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#FFFFFF' }}>
            Find the World's most
            <span className="block" style={{ color: '#3B82F6' }}>
              Amazing Custom {gameMode === 'questions' ? 'Questions' : 'Words'}
            </span>
          </h1>
          <p className="text-lg mb-6" style={{ color: '#D1D5DB' }}>
            {gameMode === 'questions' ? t.customQuestions : t.customWords}
          </p>
        </div>

        {/* Form */}
        <div className="backdrop-blur-sm rounded-3xl p-6 mb-8 border shadow-2xl space-y-6" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
          {gameMode === 'questions' ? (
            <>
              {/* Innocent Question */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.innocentLabel}
                </label>
                <textarea
                  value={innocentQuestion}
                  onChange={(e) => setInnocentQuestion(e.target.value)}
                  placeholder={t.innocentPlaceholder}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-300"
                  maxLength={150}
                />
              </div>

              {/* Impostor Question */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.impostorLabel}
                </label>
                <textarea
                  value={impostorQuestion}
                  onChange={(e) => setImpostorQuestion(e.target.value)}
                  placeholder={t.impostorPlaceholder}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-300"
                  maxLength={150}
                />
              </div>
            </>
          ) : (
            <>
              {/* Player Word */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.wordLabel}
                </label>
                <input
                  type="text"
                  value={playerWord}
                  onChange={(e) => setPlayerWord(e.target.value)}
                  placeholder={t.wordPlaceholder}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-300"
                  maxLength={50}
                />
              </div>
              
              {/* Note for word game */}
              <div className="backdrop-blur-sm rounded-2xl p-4 border shadow-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                <p className="text-sm text-blue-200">{t.impostorNote}</p>
              </div>
            </>
          )}

          {/* Host Note */}
          <div className="backdrop-blur-sm rounded-2xl p-4 border shadow-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <p className="text-sm text-yellow-200">{t.note}</p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="group relative rounded-3xl p-6 transition-all duration-300 w-full shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:-translate-y-0"
          style={{ 
            backgroundColor: '#10B981',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(16, 185, 129, 0.8)'
          }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center space-x-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Check className="w-7 h-7 text-white" />
            </div>
            <span className="font-semibold text-lg text-white">{t.save}</span>
          </div>
        </button>
      </div>
    </div>
  );
}