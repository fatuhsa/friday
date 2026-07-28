import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TriviaModal } from './TriviaModal';
import { getRandomTrivia } from '../db/characterDB';
import type { TriviaQuestion } from '../db/characterDB';

vi.mock('../db/characterDB', () => ({
  getRandomTrivia: vi.fn(),
}));

const Q_LUFFY: TriviaQuestion = { id: 1, text: 'Siapa karakter utama One Piece?', options: ['Zoro', 'Luffy', 'Sanji'], answer: 'Luffy' };

describe('TriviaModal', () => {
  beforeEach(() => {
    vi.mocked(getRandomTrivia).mockResolvedValue(Q_LUFFY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders trivia modal and allows closing', async () => {
    const onClose = vi.fn();
    render(<TriviaModal answeredIds={[]} onCorrect={vi.fn()} onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Anime Trivia')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Close')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('handles correct answer', async () => {
    const onCorrect = vi.fn();
    render(<TriviaModal answeredIds={[]} onCorrect={onCorrect} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Luffy')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Luffy'));
    expect(screen.getByText('Correct! +100 Gems')).toBeInTheDocument();
    await waitFor(() => expect(onCorrect).toHaveBeenCalledWith(1), { timeout: 2000 });
  });

  it('handles wrong answer', async () => {
    const onClose = vi.fn();
    render(<TriviaModal answeredIds={[]} onCorrect={vi.fn()} onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Zoro')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Zoro'));
    expect(screen.getByText('Wrong answer! Try again later.')).toBeInTheDocument();
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2500 });
  });
});
