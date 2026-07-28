import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { Inventory } from './Inventory';
import { CharacterCard } from './CharacterCard';
import type { Character } from '../types';

describe('Dashboard Component', () => {
  it('renders gems count and star reward button when unclaimed', () => {
    const onClaim = vi.fn();
    render(<Dashboard gems={1234} hasClaimedStarReward={false} onClaimStarReward={onClaim} />);

    expect(screen.getByText('1,234')).toBeInTheDocument();
    const starBtn = screen.getByRole('button', { name: /Star \+500/i });
    expect(starBtn).toBeInTheDocument();

    fireEvent.click(starBtn);
    expect(onClaim).toHaveBeenCalledTimes(1);
  });

  it('hides star reward button when already claimed', () => {
    const onClaim = vi.fn();
    render(<Dashboard gems={1234} hasClaimedStarReward={true} onClaimStarReward={onClaim} />);

    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Star \+500/i })).not.toBeInTheDocument();
  });
});

describe('CharacterCard Component', () => {
  const sampleChar: Character = {
    id: 1,
    name: 'Asuka Lang',
    imageUrl: 'https://example.com/asuka.png',
    rarity: 'SSR',
  };

  it('renders character information and handles recycle click', () => {
    const onRecycle = vi.fn();
    render(<CharacterCard character={sampleChar} onRecycle={onRecycle} />);

    expect(screen.getByText('Asuka Lang')).toBeInTheDocument();
    expect(screen.getByText('SSR')).toBeInTheDocument();

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/asuka.png');
    expect(img).toHaveAttribute('alt', 'Asuka Lang');

    const recycleBtn = screen.getByRole('button', { name: /Recycle/i });
    fireEvent.click(recycleBtn);

    expect(onRecycle).toHaveBeenCalledWith(sampleChar);
  });
});

describe('Inventory Component', () => {
  it('renders empty message when collection is empty', () => {
    render(<Inventory collection={[]} onRecycle={vi.fn()} />);
    expect(screen.getByText(/No Waifus yet/i)).toBeInTheDocument();
  });

  it('renders character cards when collection has characters', () => {
    const collection: Character[] = [
      { id: 1, name: 'Char One', imageUrl: 'url1', rarity: 'SSR' },
      { id: 2, name: 'Char Two', imageUrl: 'url2', rarity: 'SR' },
    ];
    render(<Inventory collection={collection} onRecycle={vi.fn()} />);

    expect(screen.getByText('Char One')).toBeInTheDocument();
    expect(screen.getByText('Char Two')).toBeInTheDocument();
  });

  it('renders duplicate character cards without key conflicts', () => {
    const collection: Character[] = [
      { id: 1, name: 'Char One', imageUrl: 'url1', rarity: 'SSR' },
      { id: 1, name: 'Char One', imageUrl: 'url1', rarity: 'SSR' },
    ];
    render(<Inventory collection={collection} onRecycle={vi.fn()} />);

    expect(screen.getAllByText('Char One')).toHaveLength(2);
  });
});
