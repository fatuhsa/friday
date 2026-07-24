import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TriviaModal } from './TriviaModal';

describe('TriviaModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0); // Pick 1st question (Luffy)
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders trivia modal and allows closing', () => {
    const onClose = vi.fn();
    render(<TriviaModal answeredIds={[]} onCorrect={vi.fn()} onClose={onClose} />);
    expect(screen.getByText('Anime Trivia')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('handles correct answer', () => {
    const onCorrect = vi.fn();
    render(<TriviaModal answeredIds={[]} onCorrect={onCorrect} onClose={vi.fn()} />);
    
    fireEvent.click(screen.getByText('Luffy'));
    expect(screen.getByText('Correct! +100 Gems')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(onCorrect).toHaveBeenCalledWith(1);
  });

  it('handles wrong answer', () => {
    const onClose = vi.fn();
    render(<TriviaModal answeredIds={[]} onCorrect={vi.fn()} onClose={onClose} />);
    
    fireEvent.click(screen.getByText('Zoro'));
    expect(screen.getByText('Wrong answer! Try again later.')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    
    expect(onClose).toHaveBeenCalled();
  });
});
