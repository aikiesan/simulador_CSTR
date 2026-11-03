// A teaching model of a farm CSTR on dairy manure: Chen & Hashimoto (1978) kinetics, Hashimoto (1982) K for
// dairy manure, B0 from the CP2b BMP. Pure functions: the build checks them and the page runs the same code.
//   mu_m(T) = 0.013 T - 0.129             max specific growth rate, 1/d (fitted 20-60 C; no mesophilic/thermophilic dip)
//   K(S0)   = 0.8 + 0.0016 exp(0.06 S0)   kinetic parameter, S0 in kg VS / m3 of feed
//   B/B0    = 1 - K / (HRT mu_m - 1 + K)  share of the ultimate yield reached; 0 at or below washout, HRT mu_m <= 1
// Energy uses the PILAR-2b calculator's conventions: LHV 35.8 MJ/m3 CH4 (9.94 kWh), 35 % electrical efficiency.

export const PLANT = {
  radius: 6.0,        // m, inside the wall
  level: 4.6,         // m, slurry depth held by the overflow
  wall: 5.2,          // m, wall height
  roofRise: 2.6,      // m, outer membrane above the wall top
  freeboard: 0.6,     // m, wall above the slurry
};
export const VOLUME = Math.PI * PLANT.radius ** 2 * PLANT.level; // m3 of slurry

export const FEED = {
  b0: 0.2,            // m3 CH4 / kg VS: CP2b BMP for BOV_LEITE, med (200 Nm3 CH4 / t SV)
  vsOfTs: 0.78,       // CP2b SV of BOV_LEITE, med
  manureTs: 0.25,     // CP2b ST of BOV_LEITE, med: scraped manure, diluted to the feed TS with wash water
  manurePerCow: 5.11 * 1000 / 365, // kg / cow / d: CP2b g of BOV_LEITE, med
  ch4InBiogas: 0.6,
};
export const ENERGY = { kwhPerM3: 35.8 / 3.6, electrical: 0.35 };
export const DESIGN = { temperature: 37, hrt: 25, ts: 0.08 };

export const muMax = (t) => 0.013 * t - 0.129;
export const kOf = (s0) => 0.8 + 0.0016 * Math.exp(0.06 * s0);

export function steady({ temperature, hrt, ts }) {
  const s0 = ts * FEED.vsOfTs * 1000;                 // kg VS / m3
  const q = VOLUME / hrt;                             // m3 / d
  const mu = muMax(temperature);
  const kk = kOf(s0);
  const grow = hrt * mu - 1;
  const share = mu > 0 && grow > 0 ? Math.max(0, 1 - kk / (grow + kk)) : 0;
  const vsLoad = q * s0;                              // kg VS / d
  const ch4 = vsLoad * FEED.b0 * share;               // Nm3 CH4 / d
  const biogas = ch4 / FEED.ch4InBiogas;
  return {
    s0, q, mu, k: kk, share,
    washoutHrt: mu > 0 ? 1 / mu : Infinity,
    olr: vsLoad / VOLUME,                             // kg VS / m3 / d
    vsLoad, ch4, biogas,
    kwe: (ch4 * ENERGY.kwhPerM3 * ENERGY.electrical) / 24,
    cows: (q * 1000 * ts) / (FEED.manurePerCow * FEED.manureTs), // feed TS mass / TS per cow
  };
}

// Gas storage between the slurry and the inner membrane at full stroke: the freeboard cylinder plus the dome cap.
export const STORE = (() => {
  const a = PLANT.radius, h = PLANT.roofRise;
  const cap = (Math.PI * h * (3 * a * a + h * h)) / 6;
  return Math.PI * a * a * PLANT.freeboard + cap;      // m3
})();
