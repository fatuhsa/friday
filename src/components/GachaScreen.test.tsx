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

  const x1Btn = () => screen.getByRole('button', { name: /Pull x1 (?!0)/ });
  const x10Btn = () => screen.getByRole('button', { name: /Pull x10/ });

  it('renders correctly', () => {
    render(<GachaScreen gems={2000} onDeductGems={vi.fn()} onAddGems={vi.fn()} onCharactersPulled={vi.fn()} />);
    expect(x1Btn()).toBeInTheDocument();
    expect(x10Btn()).toBeInTheDocument();
  });

  it('toggles drop rates', () => {
    render(<GachaScreen gems={2000} onDeductGems={vi.fn()} onAddGems={vi.fn()} onCharactersPulled={vi.fn()} />);
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

    render(<GachaScreen gems={2000} onDeductGems={onDeductGems} onAddGems={vi.fn()} onCharactersPulled={onCharactersPulled} />);

    fireEvent.click(x1Btn());

    expect(onDeductGems).toHaveBeenCalledWith(160);
    await waitFor(() => expect(gachaLogic.rollRarity).toHaveBeenCalledWith(1));
    await waitFor(() => expect(gachaLogic.fetchCharacters).toHaveBeenCalledWith(['SSR']), { timeout: 3000 });
    await waitFor(() => expect(onCharactersPulled).toHaveBeenCalledWith(mockChars), { timeout: 3000 });
  });

  it('disables buttons when not enough gems', () => {
    render(<GachaScreen gems={100} onDeductGems={vi.fn()} onAddGems={vi.fn()} onCharactersPulled={vi.fn()} />);
    expect(x1Btn()).toBeDisabled();
    expect(x10Btn()).toBeDisabled();
  });
});