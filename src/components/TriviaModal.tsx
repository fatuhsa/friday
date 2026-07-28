import { useState, useEffect } from 'react';
import { getRandomTrivia } from '../db/characterDB';
import type { TriviaQuestion } from '../db/characterDB';

interface Props {
  answeredIds: number[];
  onCorrect: (id: number) => void;
  onClose: () => void;
}

export function TriviaModal({ answeredIds, onCorrect, onClose }: Props) {
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [message, setMessage] = useState('');
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    getRandomTrivia(answeredIds).then((q) => {
      if (!q) setAllDone(true);
      else setQuestion(q);
    });
  }, [answeredIds]);

  const handleAnswer = (option: string) => {
    if (!question) return;
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
      <div className="bg-surface border border-neon-mint rounded-xl p-6 w-full max-w-sm text-center">
        <h2 className="font-heading text-lg text-neon-mint mb-4">Anime Trivia</h2>

        {allDone ? (
          <p className="text-gray-400 mb-6">All questions answered! Come back later.</p>
        ) : !question ? (
          <p className="text-gray-400 mb-6">Loading question...</p>
        ) : (
          <>
            <p className="text-gray-300 mb-6">{question.text}</p>

            {message ? (
              <p className="font-bold text-neon-mint">{message}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {question.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className="bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg cursor-pointer transition-colors min-h-[44px]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <button onClick={onClose} className="mt-4 text-gray-500 underline text-sm cursor-pointer hover:text-white transition-colors min-h-[44px]">
          Close
        </button>
      </div>
    </div>
  );
}