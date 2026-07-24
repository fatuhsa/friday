import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import type { Character } from './types';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('calculates gems correctly when recycling SSR (+100), SR (+50), and R (+15) characters', () => {
    const initialCollection: Character[] = [
      { id: 101, name: 'SSR Waifu', imageUrl: 'ssr.png', rarity: 'SSR' },
      { id: 102, name: 'SR Waifu', imageUrl: 'sr.png', rarity: 'SR' },
      { id: 103, name: 'R Waifu', imageUrl: 'r.png', rarity: 'R' },
    ];
    localStorage.setItem('gems', '2000');
    localStorage.setItem('collection', JSON.stringify(initialCollection));

    render(<App />);

    expect(screen.getByText('2000')).toBeInTheDocument();

    // Recycle SSR character (+100 gems)
    const recycleButtons = screen.getAllByRole('button', { name: /Recycle/i });
    fireEvent.click(recycleButtons[0]);

    expect(screen.getByText('2100')).toBeInTheDocument();
    expect(screen.queryByText('SSR Waifu')).not.toBeInTheDocument();

    // Recycle SR character (+50 gems)
    const remainingButtons1 = screen.getAllByRole('button', { name: /Recycle/i });
    fireEvent.click(remainingButtons1[0]);

    expect(screen.getByText('2150')).toBeInTheDocument();
    expect(screen.queryByText('SR Waifu')).not.toBeInTheDocument();

    // Recycle R character (+15 gems)
    const remainingButtons2 = screen.getAllByRole('button', { name: /Recycle/i });
    fireEvent.click(remainingButtons2[0]);

    expect(screen.getByText('2165')).toBeInTheDocument();
    expect(screen.queryByText('R Waifu')).not.toBeInTheDocument();
    expect(screen.getByText(/No Waifus yet/i)).toBeInTheDocument();
  });

  it('handles claiming star repo reward correctly (+500 gems)', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<App />);

    expect(screen.getByText('2000')).toBeInTheDocument();
    const starBtn = screen.getByRole('button', { name: /Star Repo/i });
    expect(starBtn).toBeInTheDocument();

    fireEvent.click(starBtn);

    expect(openSpy).toHaveBeenCalledWith('https://github.com', '_blank');
    expect(screen.getByText('2500')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Star Repo/i })).not.toBeInTheDocument();

    openSpy.mockRestore();
  });
});
