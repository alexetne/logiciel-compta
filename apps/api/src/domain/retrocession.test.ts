import { describe, expect, it } from 'vitest';

import { calculatePercentageRetrocession } from './retrocession.js';

describe('calculatePercentageRetrocession', () => {
  it('calcule une rétrocession en centimes', () => {
    expect(calculatePercentageRetrocession({ eligibleAmountInCents: 800_000, rate: 20 })).toBe(160_000);
  });

  it('arrondit au centime le plus proche', () => {
    expect(calculatePercentageRetrocession({ eligibleAmountInCents: 999, rate: 12.5 })).toBe(125);
  });

  it('refuse un taux invalide', () => {
    expect(() => calculatePercentageRetrocession({ eligibleAmountInCents: 100, rate: 101 })).toThrow(RangeError);
  });
});
