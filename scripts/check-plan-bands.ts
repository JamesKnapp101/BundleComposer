// check-plan-bands.ts
import fs from "node:fs/promises";
const PRICE_BANDS = {
  Nickel: [3, 6],
  Copper: [4, 8],
  Bronze: [6, 12],
  Silver: [8, 15],
  Gold: [12, 25],
  Platinum: [25, 40],
  Palladium: [40, 60],
  Rhodium: [60, 90],
} as const;
(async () => {
  const file = process.argv[2];
  const arr = JSON.parse(await fs.readFile(file, "utf-8"));
  for (const p of arr) {
    const [lo, hi] = (PRICE_BANDS as any)[p.planTier] ?? [0, Infinity];
    if (p.basePrice < lo || p.basePrice > hi) {
      throw new Error(
        `${p.id} ${p.planTier} ${p.basePrice} outside [${lo},${hi}]`
      );
    }
  }
  console.log("Bands OK ✅");
})();
