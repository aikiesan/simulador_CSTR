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

// Steady state of a CSTR of any working volume (m3). The kinetics know no size: at one HRT, temperature and feed,
// a 5 L bench reactor and the 520 m3 tank reach the same share of B0 and make the same methane per m3 of reactor.
export function steady({ temperature, hrt, ts }, volume = VOLUME) {
  const s0 = ts * FEED.vsOfTs * 1000;                 // kg VS / m3
  const q = volume / hrt;                             // m3 / d
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
    olr: vsLoad / volume,                             // kg VS / m3 / d
    vsLoad, ch4, biogas,
    ch4PerM3: ch4 / volume,                           // Nm3 CH4 / m3 reactor / d: the same at every scale
    kwe: (ch4 * ENERGY.kwhPerM3 * ENERGY.electrical) / 24,
    cows: (q * 1000 * ts) / (FEED.manurePerCow * FEED.manureTs), // feed TS mass / TS per cow
  };
}

// The bench reactor: a 5 L jacketed glass CSTR (inner diameter 180 mm, liquid 196.5 mm deep), fed by a peristaltic
// pump on a timer, heated by water from a circulator through the jacket, its gas counted by a drum gas meter into a bag.
export const LAB = {
  radius: 0.09,       // m, inside of the glass
  level: 0.1965,      // m, liquid depth held by the overflow side arm
  pumpMlMin: 2,       // peristaltic feed pump, mL/min
  pulses: 4,          // feeds a day on the timer
  meterMl: 100,       // mL of gas per turn of the meter's needle
  bagL: 10,           // L, gas sampling bag
  tempTau: 1.2,       // h, how fast the jacket brings 5 L to the set point
};
export const LAB_VOLUME = Math.PI * LAB.radius ** 2 * LAB.level; // m3 of liquid, 5.0 L

// Wall and floor wetted by the liquid, per m3 of liquid (m2/m3): 2/r for the wall, 1/h for the floor. Heat is lost
// through it, so a vessel with more of it per volume warms and cools faster.
export const surfacePerVolume = (radius, level) => 2 / radius + 1 / level;

// Gas storage between the slurry and the inner membrane at full stroke: the freeboard cylinder plus the dome cap.
export const STORE = (() => {
  const a = PLANT.radius, h = PLANT.roofRise;
  const cap = (Math.PI * h * (3 * a * a + h * h)) / 6;
  return Math.PI * a * a * PLANT.freeboard + cap;      // m3
})();

// ── The same model in time ───────────────────────────────────────────────────
// Chen & Hashimoto's equation is the steady state of a CSTR whose microbes grow by Contois kinetics,
// mu = mu_m S / (K' X + S). Counting the biomass as the substrate it grew from (b = X / Y, kg VS / m3), K' X = K b and
// the yield drops out, so the dynamic form needs no number the steady model does not already have:
//   db/dt = mu b - D b        dS/dt = D (S0 - S) - mu b        mu = mu_m S / (K b + S)
// S is the degradable VS left in the liquid, b the active biomass, D the dilution rate (feed per volume, 1/d), and
// methane = B0 * mu b. At constant D = 1/HRT its steady state is steady() above, exactly: S / S0 = K / (HRT mu_m - 1 + K).
export const B_FLOOR = 1e-4;   // kg VS / m3: a trace of biomass is always left on the walls, so a washed-out reactor can regrow

// The reactor's contents at the steady state of a plant: what a running digester (or its inoculum) holds.
export function contentsAt(plant) {
  const s = steady(plant);
  const S = s.share > 0 ? s.s0 * (1 - s.share) : s.s0;
  return { S, b: Math.max(B_FLOOR, s.s0 - S) };
}

// One step of dtH hours at a temperature, with fed m3 of feed per m3 of reactor arriving during the step.
// Returns the kg VS per m3 of reactor degraded in the step (methane = B0 times that) and mutates c = { S, b }.
export function advance(c, { ts }, temperature, dtH, fed) {
  const s0 = ts * FEED.vsOfTs * 1000;
  const mu = Math.max(0, muMax(temperature)) * c.S / (kOf(s0) * c.b + c.S || 1);
  const dt = dtH / 24;
  const used = Math.min(c.S, mu * c.b * dt);
  // The feed replaces its own volume of mixed liquid: substrate in, a share of everything out.
  c.S += fed * (s0 - c.S) - used;
  c.b += used - fed * c.b;
  c.S = Math.max(0, c.S);
  c.b = Math.max(B_FLOOR, c.b);
  return used;
}
