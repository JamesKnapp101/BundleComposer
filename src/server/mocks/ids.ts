import crypto from 'crypto';

type RNG = () => number;

/** Deterministic RNG (0..1), stable for a given seed */
export const makeRng = (seed: string): RNG => {
  const buf = crypto.createHash('sha256').update(seed).digest();
  let i = 0;
  return () => buf[i++ % buf.length] / 255;
};

/** Random date between [start, end], inclusive (uses provided rng) */
const randomDate = (rng: RNG, start: Date, end: Date) => {
  const t0 = start.getTime();
  const t1 = end.getTime();
  const t = t0 + Math.floor(rng() * (t1 - t0 + 1));
  return new Date(t);
};

/** YYMMDD (e.g., 25 11 07 -> '251107') */
const yymmdd = (d: Date) => {
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

/** 5-char uppercase alphanumeric, avoiding ambiguous chars (0,1,I,O) */
const randomAlphaNum5 = (rng: RNG) => {
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(rng() * alphabet.length)];
  }
  return out;
};

export type PlanNameOptions = {
  rng?: RNG;
  seed?: string;
  provider?: string;
  serviceDate?: Date;
  dateRange?: { start: Date; end: Date };
  dateFormat?: 'YYMMDD';
};

export const planNamePrefix = (opts: PlanNameOptions = {}) => {
  const { provider = 'StreamMatrix', dateFormat = 'YYMMDD' } = opts;
  const rng: RNG = opts.rng ?? (opts.seed ? makeRng(opts.seed) : Math.random);
  const serviceDate =
    opts.serviceDate ??
    randomDate(
      rng,
      opts.dateRange?.start ?? new Date(2023, 0, 1),
      opts.dateRange?.end ?? new Date(2027, 11, 31),
    );

  const dateCode = (() => {
    switch (dateFormat) {
      case 'YYMMDD':
      default:
        return yymmdd(serviceDate);
    }
  })();

  const randCode = randomAlphaNum5(rng);
  const name = `${provider}-${dateCode}-${randCode}`;
  return { name, serviceDate, dateCode, randCode };
};

export const planNamePrefixString = (opts?: PlanNameOptions) => {
  return planNamePrefix(opts).name;
};
