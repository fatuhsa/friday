import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GachaScreen } from './GachaScreen';
import * as gachaLogic from '../utils/gachaLogic';

vi.mock('../utils/gachaLogic', () => ({
  rollRarity: vi.fn(),
  fetchCharacters: vi.fn(),
}));

describe('GachaScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders correctly', () => {
    render(<GachaScreen gems={2000} onDeductGems={vi.fn()} onCharactersPulled={vi.fn()} />);
    expect(screen.getByText('Pull x1 (160 💎)')).toBeInTheDocument();
    expect(screen.getByText('Pull x10 (1600 💎)')).toBeInTheDocument();
  });

  it('toggles drop rates', () => {
    render(<GachaScreen gems={2000} onDeductGems={vi.fn()} onCharactersPulled={vi.fn()} />);
    expect(screen.queryByTestId('drop-rates')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('View Drop Rates'));
    expect(screen.getByTestId('drop-rates')).toBeInTheDocument();
  });

  it('handles successful pull', async () => {
    const onDeductGems = vi.fn().mockReturnValue(true);
    const onCharactersPulled = vi.fn();
    const mockChars = [{ id: 1, name: 'Waifu', rarity: 'SSR', image: 'url' }];
    
    vi.mocked(gachaLogic.rollRarity).mockReturnValue(['SSR']);
    vi.mocked(gachaLogic.fetchCharacters).mockResolvedValue(mockChars as any);

    render(<GachaScreen gems={2000} onDeductGems={onDeductGems} onCharactersPulled={onCharactersPulled} />);
    
    fireEvent.click(screen.getByText('Pull x1 (160 💎)'));
    
    expect(onDeductGems).toHaveBeenCalledWith(160);
    expect(gachaLogic.rollRarity).toHaveBeenCalledWith(1);
    expect(gachaLogic.fetchCharacters).toHaveBeenCalledWith(['SSR']);
    
    await waitFor(() => {
      expect(onCharactersPulled).toHaveBeenCalledWith(mockChars);
    });
  });

  it('disables buttons when not enough gems', () => {
    render(<GachaScreen gems={100} onDeductGems={vi.fn()} onCharactersPulled={vi.fn()} />);
    expect(screen.getByText('Pull x1 (160 💎)')).toBeDisabled();
    expect(screen.getByText('Pull x10 (1600 💎)')).toBeDisabled();
  });
});
