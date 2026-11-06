import { summarizeRedemptions } from '@/services/plaa/hooks/useProfileData';
import type { BuybackPrice } from '@/services/plaa/hooks/useBuybackPrices';
import type { RedemptionHistoryEntry } from '@/services/plaa/hooks/useRedemptionHistory';

function redemption(overrides: Partial<RedemptionHistoryEntry> = {}): RedemptionHistoryEntry {
  return { auctionNumber: 7, roundNumber: 12, plaaRedeemed: 400, period: '2026-07-01', ...overrides };
}

const prices: BuybackPrice[] = [
  { roundNumber: 12, auctionNumber: 7, clearingPrice: 1.48 },
  { roundNumber: 10, auctionNumber: 5, clearingPrice: 1.42 },
];

describe('summarizeRedemptions', () => {
  it('prices a redemption at the auction that cleared it', () => {
    const result = summarizeRedemptions([redemption()], prices);

    expect(result['2026-07']).toEqual({ plaa: 400, usd: 592, price: 1.48, isAverage: false });
  });

  it('falls back to the round number when the auction number is missing on the redemption', () => {
    const result = summarizeRedemptions([redemption({ auctionNumber: null })], prices);

    expect(result['2026-07']?.usd).toBe(592);
  });

  it('falls back to the round number when the auction number is missing on the price', () => {
    const roundOnly: BuybackPrice[] = [{ roundNumber: 12, auctionNumber: null, clearingPrice: 2 }];
    const result = summarizeRedemptions([redemption()], roundOnly);

    expect(result['2026-07']?.usd).toBe(800);
  });

  it('blends two auctions in one month and marks the rate as an average', () => {
    const result = summarizeRedemptions(
      [
        redemption({ auctionNumber: 7, roundNumber: 12, plaaRedeemed: 400 }), // at 1.48 = 592
        redemption({ auctionNumber: 5, roundNumber: 10, plaaRedeemed: 100 }), // at 1.42 = 142
      ],
      prices,
    );

    expect(result['2026-07']).toEqual({ plaa: 500, usd: 734, price: 734 / 500, isAverage: true });
  });

  it('does not mark a single price as an average, even across several redemptions', () => {
    const result = summarizeRedemptions([redemption({ plaaRedeemed: 100 }), redemption({ plaaRedeemed: 300 })], prices);

    expect(result['2026-07']).toEqual({ plaa: 400, usd: 592, price: 1.48, isAverage: false });
  });

  it('withholds the dollar figure when any of the month\'s redemptions has no price, rather than understating it', () => {
    const result = summarizeRedemptions(
      [redemption({ plaaRedeemed: 400 }), redemption({ auctionNumber: 99, roundNumber: 99, plaaRedeemed: 100 })],
      prices,
    );

    // The PLAA is still counted in full: only the valuation is withheld.
    expect(result['2026-07']).toEqual({ plaa: 500, usd: null, price: null, isAverage: false });
  });

  it('keeps the PLAA figure when no prices have loaded at all', () => {
    expect(summarizeRedemptions([redemption()], null)).toEqual({
      '2026-07': { plaa: 400, usd: null, price: null, isAverage: false },
    });
  });

  it('keeps months apart, pricing each at its own auction', () => {
    const result = summarizeRedemptions(
      [
        redemption({ auctionNumber: 7, roundNumber: 12, plaaRedeemed: 400, period: '2026-07-01' }),
        redemption({ auctionNumber: 5, roundNumber: 10, plaaRedeemed: 200, period: '2026-05-01' }),
      ],
      prices,
    );

    expect(result['2026-07']?.price).toBe(1.48);
    expect(result['2026-05']?.price).toBe(1.42);
  });

  it('ignores rows with no period or no amount, which cannot be attributed to a month', () => {
    const result = summarizeRedemptions(
      [redemption({ period: null }), redemption({ plaaRedeemed: null }), redemption({ plaaRedeemed: 50 })],
      prices,
    );

    expect(result['2026-07']).toEqual({ plaa: 50, usd: 74, price: 1.48, isAverage: false });
  });

  it('returns nothing at all when there are no redemptions', () => {
    expect(summarizeRedemptions([], prices)).toEqual({});
    expect(summarizeRedemptions(null, prices)).toEqual({});
  });
});
