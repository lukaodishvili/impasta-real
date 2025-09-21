import React, { useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Language } from '../types';

interface JoinRoomScreenProps {
  onJoinRoom: (code: string) => void;
  onBack: () => void;
  language: Language;
  error?: string;
}

export default function JoinRoomScreen({ onJoinRoom, onBack, language, error }: JoinRoomScreenProps) {
  const [roomCode, setRoomCode] = useState('');

  const texts = {
    en: {
      title: 'Join Room',
      codeLabel: 'Room Code',
      codePlaceholder: 'Enter 6-digit code...',
      join: 'Join Room',
      back: 'Back',
      roomNotFound: 'Room not found',
      invalidCode: 'Invalid room code'
    },
    ru: {
      title: 'Присоединиться к комнате',
      codeLabel: 'Код комнаты',
      codePlaceholder: 'Введите 6-значный код...',
      join: 'Присоединиться',
      back: 'Назад',
      roomNotFound: 'Комната не найдена',
      invalidCode: 'Неверный код комнаты'
    },
    ka: {
      title: 'ოთახში შესვლა',
      codeLabel: 'ოთახის კოდი',
      codePlaceholder: 'შეიყვანეთ 6-ნიშნა კოდი...',
      join: 'ოთახში შესვლა',
      back: 'უკან',
      roomNotFound: 'ოთახი ვერ მოიძებნა',
      invalidCode: 'არასწორი ოთახის კოდი'
    }
  };

  const t = texts[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length === 6) {
      onJoinRoom(roomCode);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setRoomCode(cleaned);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-500">
            {t.title}
          </h1>
        </div>

        {/* Join Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{t.codeLabel}</h2>
            </div>

            {/* Code Input */}
            <div className="space-y-4">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder={t.codePlaceholder}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                maxLength={6}
              />

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                  <p className="text-red-600 text-sm text-center font-medium">
                    {error === 'roomNotFound' && t.roomNotFound}
                    {error === 'invalidCode' && t.invalidCode}
                    {!['roomNotFound', 'invalidCode'].includes(error) && error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Join Button */}
          <button
            type="submit"
            disabled={roomCode.length !== 6}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-lg"
          >
            {t.join}
          </button>
        </form>
      </div>
    </div>
  );
}