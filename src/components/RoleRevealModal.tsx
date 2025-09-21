import React, { useEffect } from 'react';
import { X, Crown, Shield, Zap } from 'lucide-react';
import { Language, Player } from '../types';

interface RoleRevealModalProps {
  playerRole: 'innocent' | 'impostor' | 'jester';
  playerName: string;
  language: Language;
  onClose: () => void;
  isOpen: boolean;
  players?: Player[];
  playerAnswers?: Record<string, string>;
  currentQuestion?: string;
  currentWord?: string;
  gameMode?: 'questions' | 'words';
}

export default function RoleRevealModal({
  playerRole,
  playerName,
  language,
  onClose,
  isOpen,
  players = [],
  playerAnswers = {},
  currentQuestion = '',
  currentWord = '',
  gameMode = 'questions'
}: RoleRevealModalProps) {
  // Suppress unused variable warnings for props that might be used in future features
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = { players, playerAnswers, currentQuestion, currentWord, gameMode };
  const [isVisible, setIsVisible] = React.useState(false);

  // Handle escape key press and animation state
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Trigger fade-in animation after a brief delay
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if modal is not open
  if (!isOpen) return null;

  const texts = {
    en: {
      roleReveal: 'Your Role',
      innocent: 'You are Innocent',
      impostor: 'You are the Impostor!',
      jester: 'You are the Jester',
      innocentDescription: 'You have the same word as other innocent players. Help find the impostors!',
      impostorDescription: 'You don\'t know the word! Pretend you do and blend in with the innocents.',
      jesterDescription: 'Try to get voted out to win the game!',
      ok: 'OK',
      roleHint: 'Remember your role and play strategically!'
    },
    ru: {
      roleReveal: 'Ваша роль',
      innocent: 'Вы невиновны',
      impostor: 'Вы самозванец!',
      jester: 'Вы шут',
      innocentDescription: 'У вас то же слово, что и у других честных игроков. Помогите найти самозванцев!',
      impostorDescription: 'Вы не знаете слово! Притворяйтесь, что знаете, и смешайтесь с честными.',
      jesterDescription: 'Постарайтесь, чтобы вас исключили, чтобы выиграть игру!',
      ok: 'ОК',
      roleHint: 'Помните свою роль и играйте стратегически!'
    },
    ka: {
      roleReveal: 'თქვენი როლი',
      innocent: 'თქვენ ხართ უდანაშაულო',
      impostor: 'თქვენ ხართ თაღლითი!',
      jester: 'თქვენ ხართ ჯუკი',
      innocentDescription: 'თქვენ გაქვთ იგივე სიტყვა, რაც სხვა უდანაშაულო მოთამაშეებს. დაეხმარეთ თაღლითების პოვნაში!',
      impostorDescription: 'თქვენ არ იცით სიტყვა! ფარალეთ, რომ იცით, და შერეულდით უდანაშაულოებთან.',
      jesterDescription: 'შეეცადეთ, რომ გაგირიყოთ, რომ მოიგოთ თამაში!',
      ok: 'კარგი',
      roleHint: 'დაიმახსოვრეთ თქვენი როლი და თამაშობდეთ სტრატეგიულად!'
    }
  };

  const t = texts[language];

  const getRoleConfig = () => {
    switch (playerRole) {
      case 'innocent':
        return {
          title: t.innocent,
          description: t.innocentDescription,
          icon: Shield,
          gradient: 'from-green-500 to-emerald-500',
          bgGradient: 'from-green-50 to-emerald-50',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
      case 'impostor':
        return {
          title: t.impostor,
          description: t.impostorDescription,
          icon: Crown,
          gradient: 'from-red-500 to-rose-500',
          bgGradient: 'from-red-50 to-rose-50',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200'
        };
      case 'jester':
        return {
          title: t.jester,
          description: t.jesterDescription,
          icon: Zap,
          gradient: 'from-purple-500 to-violet-500',
          bgGradient: 'from-purple-50 to-violet-50',
          iconColor: 'text-purple-600',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          title: '',
          description: '',
          icon: Shield,
          gradient: 'from-gray-500 to-slate-500',
          bgGradient: 'from-gray-50 to-slate-50',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        };
    }
  };

  const roleConfig = getRoleConfig();
  const IconComponent = roleConfig.icon;

  return (
    <>
      {/* Simple backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${
            isVisible 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
          aria-describedby="role-modal-description"
        >
          {/* Modal Header */}
          <div className={`bg-gradient-to-r ${roleConfig.gradient} p-6 rounded-t-2xl transform transition-all duration-500 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 id="role-modal-title" className="text-white text-xl font-bold">
                    {t.roleReveal}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {playerName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className={`bg-gradient-to-br ${roleConfig.bgGradient} p-6 transform transition-all duration-500 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <div className="text-center space-y-4">
              {/* Role Title */}
              <h3 className={`text-2xl font-bold ${roleConfig.iconColor} transform transition-all duration-500 delay-300 ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                {roleConfig.title}
              </h3>

              {/* Role Description */}
              <p id="role-modal-description" className={`text-gray-700 text-sm leading-relaxed transform transition-all duration-500 delay-400 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                {roleConfig.description}
              </p>

              {/* Hint */}
              <div className={`p-3 bg-white/60 rounded-lg border ${roleConfig.borderColor} transform transition-all duration-500 delay-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                <p className="text-xs text-gray-600 italic">
                  {t.roleHint}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className={`p-6 bg-white rounded-b-2xl transform transition-all duration-500 delay-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <button
              onClick={onClose}
              className={`w-full bg-gradient-to-r ${roleConfig.gradient} text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current ${
                isVisible ? 'scale-100' : 'scale-95'
              }`}
              autoFocus
            >
              {t.ok}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
