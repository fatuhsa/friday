import { useState, useEffect } from 'react';
import { Coins } from '@phosphor-icons/react';
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
      setMessage('Correct!');
      setTimeout(() => { onCorrect(question.id); }, 1000);
    } else {
      setMessage('Wrong answer! Try again later.');
      setTimeout(() => { onClose(); }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-surface border-2 border-accent/30 rounded-lg p-6 w-full max-w-sm flex flex-col">
        <h2 className="font-heading text-lg text-accent mb-4 text-center">Anime Trivia</h2>

        {allDone ? (
          <p className="text-gray-400 mb-6 text-center">All questions answered! Come back later.</p>
        ) : !question ? (
          <p className="text-gray-400 mb-6 text-center">Loading question...</p>
        ) : (
          <div className="flex-1">
            <p className="text-gray-300 mb-6 text-center">{question.text}</p>

            {message ? (
              <p className="font-bold text-accent inline-flex items-center gap-1.5 justify-center w-full">{message} <Coins weight="fill" className="w-4 h-4" /> 500</p>
            ) : (
              <div className="flex flex-col gap-2">
                {question.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className="bg-card border border-border hover:border-accent/50 text-gray-100 py-3 rounded cursor-pointer transition-all min-h-[44px]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} className="mt-4 w-full bg-card border border-border hover:border-accent/30 text-gray-300 py-3 rounded cursor-pointer transition-colors min-h-[44px] text-sm">
          Close
        </button>
      </div>
    </div>
  );
}