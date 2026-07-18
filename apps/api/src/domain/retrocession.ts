export type PercentageRetrocession = {
  eligibleAmountInCents: number;
  rate: number;
};

export function calculatePercentageRetrocession(input: PercentageRetrocession): number {
  if (!Number.isSafeInteger(input.eligibleAmountInCents) || input.eligibleAmountInCents < 0) {
    throw new RangeError('Le montant doit être un entier positif exprimé en centimes');
  }

  if (!Number.isFinite(input.rate) || input.rate < 0 || input.rate > 100) {
    throw new RangeError('Le taux doit être compris entre 0 et 100');
  }

  return Math.round((input.eligibleAmountInCents * input.rate) / 100);
}
