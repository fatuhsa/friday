import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { countPool, countTrivia } from './db/characterDB';
import type { Character } from './types';

vi.mock('./db/characterDB', () => ({
  countPool: vi.fn(),
  countTrivia: vi.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(countPool).mockResolvedValue(200);
    vi.mocked(countTrivia).mockResolvedValue(30);
  });

  it('renders the app with default gems and empty inventory', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/No Waifus yet/i)).toBeInTheDocument());
  });

  it('handles claiming star repo reward', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<App />);

    const starBtn = await screen.findByRole('button', { name: /Star \+500/i });
    expect(starBtn).toBeInTheDocument();

    fireEvent.click(starBtn);
    expect(openSpy).toHaveBeenCalledWith('https://github.com', '_blank', 'noopener,noreferrer');
    await waitFor(() => expect(screen.queryByRole('button', { name: /Star \+500/i })).not.toBeInTheDocument());

    openSpy.mockRestore();
  });

  it('recycles characters and removes them from inventory', async () => {
    const coll: Character[] = [
      { id: 1, name: 'Char A', imageUrl: 'a.png', rarity: 'SSR' },
      { id: 2, name: 'Char B', imageUrl: 'b.png', rarity: 'SR' },
    ];
    localStorage.setItem('collection', JSON.stringify(coll));

    render(<App />);
    await waitFor(() => expect(screen.getByText('Char A')).toBeInTheDocument());

    const recycleBtns = screen.getAllByRole('button', { name: /Recycle/i });
    fireEvent.click(recycleBtns[0]);
    await waitFor(() => expect(screen.getByText('Recycle Character?')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('confirm-recycle'));
    await waitFor(() => expect(screen.queryByText('Char A')).not.toBeInTheDocument());
    expect(screen.getByText('Char B')).toBeInTheDocument();
  });
});
