import { useState, useMemo } from 'react';

const QUESTIONS = [
  { id: 1, text: 'Siapa karakter utama One Piece?', options: ['Zoro', 'Luffy', 'Sanji'], answer: 'Luffy' },
  { id: 2, text: 'Di Attack on Titan, tembok pertama yang hancur adalah?', options: ['Rose', 'Maria', 'Sina'], answer: 'Maria' },
  { id: 3, text: 'Jurus khas Naruto?', options: ['Rasengan', 'Kamehameha', 'Getsuga Tensho'], answer: 'Rasengan' },
];

interface Props {
  answeredIds: number[];
  onCorrect: (id: number) => void;
  onClose: () => void;
}

export function TriviaModal({ answeredIds, onCorrect, onClose }: Props) {
  const unanswered = useMemo(() => QUESTIONS.filter(q => !answeredIds.includes(q.id)), [answeredIds]);
  const pool = unanswered.length > 0 ? unanswered : QUESTIONS;
  const question = useMemo(() => pool[Math.floor(Math.random() * pool.length)], [pool]);

  const [message, setMessage] = useState('');

  const handleAnswer = (option: string) => {
    if (option === question.answer) {
      setMessage('Correct! +100 Gems');
      setTimeout(() => { onCorrect(question.id); }, 1000);
    } else {
      setMessage('Wrong answer! Try again later.');
      setTimeout(() => { onClose(); }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#101516] border border-neon-mint rounded-xl p-6 w-full max-w-sm text-center">
        <h2 className="text-xl font-bold text-white mb-4">Anime Trivia</h2>
        <p className="text-gray-300 mb-6">{question.text}</p>
        
        {message ? (
          <p className="font-bold text-neon-mint">{message}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {question.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded cursor-pointer transition-colors">
                {opt}
              </button>
            ))}
          </div>
        )}
        
        <button onClick={onClose} className="mt-6 text-gray-500 underline text-sm cursor-pointer hover:text-white transition-colors">Close</button>
      </div>
    </div>
  );
}
