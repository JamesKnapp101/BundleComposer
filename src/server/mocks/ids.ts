import crypto from 'crypto';

type RNG = () => number;

/** Deterministic RNG (0..1), stable for a given seed */
export function makeRng(seed: string): RNG {
  const buf = crypto.createHash('sha256').update(seed).digest();
  let i = 0;
  return () => buf[i++ % buf.length] / 255;
}

/** Random date between [start, end], inclusive (uses provided rng) */
function randomDate(rng: RNG, start: Date, end: Date) {
  const t0 = start.getTime();
  const t1 = end.getTime();
  const t = t0 + Math.floor(rng() * (t1 - t0 + 1));
  return new Date(t);
}

/** YYMMDD (e.g., 25 11 07 -> '251107') */
function yymmdd(d: Date) {
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/** 5-char uppercase alphanumeric, avoiding ambiguous chars (0,1,I,O) */
function randomAlphaNum5(rng: RNG) {
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(rng() * alphabet.length)];
  }
  return out;
}

export type PlanNameOptions = {
  /** If provided, used as the RNG source (takes precedence over seed) */
  rng?: RNG;
  /** Deterministic seed for RNG (ignored if rng is provided) */
  seed?: string;
  /** Fixed provider label (default: 'StreamMatrix') */
  provider?: string;
  /** If provided, use this service date instead of generating */
  serviceDate?: Date;
  /** Date range used when generating a random service date */
  dateRange?: { start: Date; end: Date };
  /** Choose date code format; default 'YYMMDD' */
  dateFormat?: 'YYMMDD';
};

/**
 * Generates a plan name prefix composed of:
 * - Provider name ('StreamMatrix' by default)
 * - A code based on the plan service date
 * - A 5-digit alphanumeric code
 *
 * Example output: "StreamMatrix-251107-T8K3Z"
 */
export function planNamePrefix(opts: PlanNameOptions = {}) {
  const { provider = 'StreamMatrix', dateFormat = 'YYMMDD' } = opts;

  const rng: RNG = opts.rng ?? (opts.seed ? makeRng(opts.seed) : Math.random);

  const serviceDate =
    opts.serviceDate ??
    randomDate(
      rng,
      opts.dateRange?.start ?? new Date(2023, 0, 1), // Jan 1, 2023
      opts.dateRange?.end ?? new Date(2027, 11, 31), // Dec 31, 2027
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
}

/** Convenience wrapper if you only need the string */
export function planNamePrefixString(opts?: PlanNameOptions) {
  return planNamePrefix(opts).name;
}
