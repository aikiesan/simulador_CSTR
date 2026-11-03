// Fig 1: a farm CSTR on dairy manure, cut open: concrete tank, double-membrane gas roof, mixer, heating, feed and gas line.
// Its geometry is recorded for the audit (farm.R); farm.live is the page code that moves it.
import { k, G, A, TB, SH, L, DEG } from "./kit.mjs";
import { partsFor } from "./parts.mjs";
import { wrapItems } from "./topics.mjs";
import * as M from "./model.mjs";

// ── World: 1 unit = 10 cm ───────────────────────────────────────────────────
const WIDTH = 720;
const HEIGHT = 450;
const AZIMUTH = 35;
const ELEVATION = 30;

const RI = M.PLANT.radius * 10;           // 60, inside of the wall
const RO = RI + 5;                        // concrete 30 cm + insulation and cladding
const INSUL = [RI + 3, RI + 4.6];
const Z0 = 3;                             // floor slab top
const WALL_TOP = Z0 + M.PLANT.wall * 10;  // 55
const LEVEL = Z0 + M.PLANT.level * 10;    // 49
const RAIL = [RI + 0.6, RI + 3.4, WALL_TOP, WALL_TOP + 2.5];
const RIM_Z = RAIL[3];
const OUTER = SH.capAt(RI + 1.5, RIM_Z, M.PLANT.roofRise * 10 - 2); // apex 81.5
const MAST_TOP = 66;
const INNER_A = RI + 0.5;
const INNER_MIN = MAST_TOP + 1 - RIM_Z;   // rests on the mast hat when empty
const INNER_MAX = OUTER.h - 3;

// The cut faces the viewer: a 110° wedge centred on the camera azimuth.
const CUT = [AZIMUTH - 55, AZIMUTH + 55].map((d) => d * DEG);
const KEPT = [CUT[1], CUT[0] + 2 * Math.PI];
const NEAR_L = [CUT[1], (AZIMUTH + 90) * DEG];
const FAR = [(AZIMUTH + 90) * DEG, (AZIMUTH + 270) * DEG];
const NEAR_R = [(AZIMUTH + 270) * DEG, CUT[0] + 2 * Math.PI];
// The roof is cut wider than the tank, so the gas membrane shows from the front: only its back 160° stays.
const ROOF = [(AZIMUTH + 100) * DEG, (AZIMUTH + 260) * DEG];

const PLATE = { x: -96, y: -126, w: 210, d: 226, r: 10 };
const PLATE_H = 10;
const FOOT_H = 5;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, OUTER.zr + OUTER.h + 2]],
  WIDTH, HEIGHT, { pad: 28, azimuth: AZIMUTH, elevation: ELEVATION },
);
const R = A.recorder(P);
const { V, at, S, Ln, D, put, ringBox, obox, box, cyl, turned, flange, pipe } = partsFor(P, R);
const polar = (r, t, z) => [r * Math.cos(t), r * Math.sin(t), z];
const arc = (r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const t = a0 + ((a1 - a0) * i) / n; return [r * Math.cos(t), r * Math.sin(t)]; });
const arcRing = (r0, r1, a0, a1, n) => [...arc(r1, a0, a1, n), ...arc(r0, a1, a0, n)];
const stepsFor = (a0, a1) => Math.max(4, Math.round(((a1 - a0) / DEG) / 4));
const facing = (t) => Math.cos(t) * V[0] + Math.sin(t) * V[1];
// A polygon on the vertical cut plane at angle t, from (r, z) pairs.
const onCut = (t, rz) => k.pathOf(rz.map(([r, z]) => at(polar(r, t, z))), true);

// ── Bench ───────────────────────────────────────────────────────────────────
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
    out.push(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6.2, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "lo", inner: Ln(k.sideSeam(PLATE, -4, P, 8), { tone: "faint" }) }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(PLATE, 10);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Ruler along the front-left edge: 1 m per major tick.
  const strip = { x: PLATE.x + 40, y: PLATE.y + PLATE.d - 15, w: 100, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 2, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  return out.join("");
}

// ── Tank ────────────────────────────────────────────────────────────────────
function slab() {
  return S(k.cylinder(0, 0, RO + 3, 0, Z0, P, 96, 0.8), { tone: "lo", inner: Ln(k.sideArc(0, 0, RO + 3, 1.2, P, 64), { tone: "faint" }) });
}

// A stretch of wall. Its visible outer face gets cladding ribs (fading toward the turn) and two sheet seams.
function wall([a0, a1], { outer = false, ends = [] } = {}) {
  const ring = arcRing(RI, RO, a0, a1, stepsFor(a0, a1));
  let inner = "";
  if (outer) {
    const seams = [Z0 + 18, Z0 + 36].map((z) => k.onTop(arc(RO, a0, a1, stepsFor(a0, a1) * 2).filter((_, i, all) => facing(a0 + ((a1 - a0) * i) / (all.length - 1)) > 0), z, P)).join("");
    const ribs = [];
    for (let t = a0 + 1.5 * DEG; t < a1 - 0.5 * DEG; t += 3 * DEG) {
      const f = facing(t);
      if (f <= 0.02) continue;
      ribs.push({ d: k.segment(polar(RO, t, Z0), polar(RO, t, WALL_TOP), P), alpha: G.fadeOf(f, [0.02, 0.45]) * 0.9 });
    }
    inner = k.fadedSvg(ribs, { tone: "faint" }) + Ln(seams, { tone: "faint" });
  }
  let faces = "";
  for (const t of ends) {
    faces += `<path class="cstr-insul" d="${onCut(t, [[INSUL[0], Z0], [INSUL[1], Z0], [INSUL[1], WALL_TOP], [INSUL[0], WALL_TOP]])}"/>`;
    faces += Ln(k.segment(polar(INSUL[0], t, Z0), polar(INSUL[0], t, WALL_TOP), P) + k.segment(polar(INSUL[1], t, Z0), polar(INSUL[1], t, WALL_TOP), P), { tone: "lo" });
  }
  return S(k.extrude(ring, Z0, WALL_TOP - Z0, P, { convex: false }), { tone: "mid", inner }) + faces;
}

function rail([a0, a1]) {
  const ring = arcRing(RAIL[0], RAIL[1], a0, a1, stepsFor(a0, a1));
  const bolts = [];
  for (let t = a0 + 3 * DEG; t < a1 - 1 * DEG; t += 6 * DEG) bolts.push(at(polar((RAIL[0] + RAIL[1]) / 2 + 0.6, t, RAIL[3])));
  return S(k.extrude(ring, RAIL[2], RAIL[3] - RAIL[2], P, { convex: false }), { tone: "mid" }) + D(bolts, { size: 0.4, tone: "lo" });
}

// Slurry: the kept pie, its two section faces carrying the layers, the heating loops in section and the bubbles.
const HEAT_Z = [Z0 + 9, Z0 + 17, Z0 + 25, Z0 + 33];
const HEAT_R = RI - 3.2;
function slurry() {
  const ring = [[0, 0], ...arc(RI - 0.05, KEPT[0], KEPT[1], 64)];
  const out = [S(k.extrude(ring, Z0, LEVEL - Z0, P, { convex: false }), { tone: "lo", crease: "lo", className: "cstr-slurry" })];
  for (const t of CUT) {
    out.push(`<path data-part="sediment" class="cstr-sediment" d="${onCut(t, [[0.3, Z0], [RI - 0.1, Z0], [RI - 0.1, Z0 + 6], [0.3, Z0 + 6]])}"/>`);
    out.push(`<path data-part="scum" class="cstr-scum" d="${onCut(t, [[0.3, LEVEL - 4], [RI - 0.1, LEVEL - 4], [RI - 0.1, LEVEL], [0.3, LEVEL]])}"/>`);
    // Heating loops on the inside of the wall, cut: a stainless pipe on a bracket.
    out.push('<g data-topic="heat">');
    for (const z of HEAT_Z) {
      const circle = Array.from({ length: 16 }, (_, i) => [HEAT_R + 1.3 * Math.cos((i / 16) * 2 * Math.PI), z + 1.3 * Math.sin((i / 16) * 2 * Math.PI)]);
      out.push(`<path data-part="heat" class="cstr-heat" d="${onCut(t, circle)}"/>`);
      out.push(Ln(onCut(t, circle), { tone: "mid" }));
      out.push(Ln(k.segment(polar(HEAT_R + 1.3, t, z), polar(RI, t, z), P), { tone: "lo" }));
    }
    out.push("</g>");
  }
  // The circulation the mixer drives, on the surface: arcs that run toward lower angles while it turns.
  const swirl = [18, 33, 48].map((r) => k.onTop(arc(r, KEPT[1] - 0.06, KEPT[0] + 0.06, 72), LEVEL + 0.05, P)).join("");
  out.push(`<g data-part="swirl">${Ln(swirl, { tone: "lo", flow: true, free: true })}</g>`);
  out.push(`<g data-part="bubbles"></g>`);
  return out.join("");
}

// Central support mast with a hat, and the belts that carry the gas membrane when it is empty.
function mast() {
  const out = [];
  out.push(S(k.cylinder(0, 0, 3.4, Z0, 2, P, 28), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 1.6, Z0 + 2, MAST_TOP - 1.4 - Z0 - 2, P, 20), { tone: "mid", crease: "none", inner: Ln(k.sideArc(0, 0, 1.6, LEVEL, P, 12), { tone: "faint" }) }));
  out.push(S(k.cylinder(0, 0, 4.2, MAST_TOP - 1.4, 1.4, P, 32, 0.4), { tone: "mid" }));
  const belts = [];
  const ends = [];
  for (let t = ROOF[0] + 8 * DEG; t < ROOF[1] - 4 * DEG; t += 24 * DEG) {
    const a = polar(4, t, MAST_TOP), b = polar(RAIL[0] + 0.4, t, RIM_Z);
    belts.push(k.segment(a, b, P));
    ends.push(at(a), at(b));
  }
  out.push(Ln(belts.join(""), { tone: "lo" }), D(ends, { size: 0.45, tone: "lo" }));
  return out.join("");
}

// ── Mixer: a submersible propeller mixer on a guide mast, hung from a bracket on the wall ────────────────
const MIX_T = AZIMUTH * DEG + 45 * DEG;     // 80°, close to the left cut face
const MAST_XY = [48 * Math.cos(MIX_T), 48 * Math.sin(MIX_T)];
const MIX_DIR = G.unit3([Math.sin(MIX_T), -Math.cos(MIX_T), 0]); // pushes the slurry round, toward lower angles
const RADIAL = G.unit3([Math.cos(MIX_T), Math.sin(MIX_T), 0]);
const MIX_Z = Z0 + 17;
const MOTOR_O = G.add3([MAST_XY[0], MAST_XY[1], MIX_Z], G.mul3(RADIAL, -3.6));
const MOTOR = G.frameAlong(MOTOR_O, MIX_DIR);
const HUB_S = 20.5;
const BLADE_R = 8.2;
const MIX_TOP = WALL_TOP - 1;
const WALL_ANCHOR = polar(RI, MIX_T + 16 * DEG, MIX_TOP - 1);

function mixer() {
  const out = [];
  // Guide mast: a square tube from a floor shoe to the bracket.
  out.push(S(k.slabOf({ x: MAST_XY[0] - 2.4, y: MAST_XY[1] - 2.4, w: 4.8, d: 4.8, r: 0.6 }, Z0, 1.4, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: MAST_XY[0] - 1.2, y: MAST_XY[1] - 1.2, w: 2.4, d: 2.4, r: 0.3 }, Z0 + 1.4, MIX_TOP - Z0 - 1.4, P, 2), { tone: "mid", crease: "none" }));
  // Bracket arm from the mast top back to the wall.
  const a = [MAST_XY[0], MAST_XY[1]], b = [WALL_ANCHOR[0], WALL_ANCHOR[1]];
  const along = G.unit3([b[0] - a[0], b[1] - a[1], 0]);
  const side = [-along[1] * 1.3, along[0] * 1.3];
  const arm = [[a[0] + side[0], a[1] + side[1]], [b[0] + side[0], b[1] + side[1]], [b[0] - side[0], b[1] - side[1]], [a[0] - side[0], a[1] - side[1]]];
  out.push(S(k.extrude(arm, MIX_TOP, 2, P), { tone: "mid" }));
  out.push(D([at([a[0], a[1], MIX_TOP + 2])], { size: 0.5 }));
  // Carriage on the mast, the motor can and its nose.
  out.push(S(k.slabOf({ x: MAST_XY[0] - 2.2, y: MAST_XY[1] - 2.2, w: 4.4, d: 4.4, r: 0.6 }, MIX_Z - 4.5, 9, P, 2, 0.3), { tone: "mid" }));
  const can = [[-1, 0], [-1, 3.4], [0, 4.1], [13, 4.1], [15, 3.7, 1], [17, 3.0, 1], [18.6, 2.0, 1], [19.6, 0.9, 1], [20, 0]];
  out.push(S(G.lathe(can, MOTOR, P, { steps: 40 }), { tone: "hi", inner: Ln(G.arcOf(MOTOR, 3, 4.1, P) + G.arcOf(MOTOR, 11, 4.1, P), { tone: "faint" }) }));
  out.push(k.fadedSvg(G.ribsOf(MOTOR, 4, 10, 4.1, 18, P, { fade: [0.04, 0.42], seams: true }), { tone: "faint" }));
  out.push(S(G.disc(HUB_S - 1.4, HUB_S + 1.2, 1.5, MOTOR, P), { tone: "mid" }));
  out.push(`<g data-part="prop"></g>`);
  // The flow it drives: two arcs of slurry leaving the propeller.
  return out.join("");
}

// ── Membranes ───────────────────────────────────────────────────────────────
const AXIS_DEPTH = G.dot3([0, 0, RIM_Z], V);
const outerShell = SH.shellSvg(OUTER, ROOF[0], ROOF[1], P, { nTheta: 40, nRing: 8, under: "cstr-under" });

const dir2 = (t) => [Math.cos(t), Math.sin(t)];
// Feed: a round pre-pit with a top-entry agitator, an eccentric screw pump on a skid, and the inlet line to the tank.
const PIT = [-62, 88], PIT_R = 14, PIT_H = 16;
const IN_T = 112 * DEG, IN_Z = 24;
const INLET = polar(RO, IN_T, IN_Z);
const FOOT = polar(RO + 6.5, IN_T, 0);   // the riser stands radially outside the nozzle; the pump aims at it
const FEED_U = (() => { const d = [FOOT[0] - PIT[0], FOOT[1] - PIT[1]]; const n = Math.hypot(...d); return [d[0] / n, d[1] / n]; })();
const FEED_V = [-FEED_U[1], FEED_U[0]];
const along = (s, side = 0) => [PIT[0] + FEED_U[0] * s + FEED_V[0] * side, PIT[1] + FEED_U[1] * s + FEED_V[1] * side];
function feed() {
  cyl("feed.pit", PIT[0], PIT[1], PIT_R, 0, PIT_H, { tone: "mid", bevel: 0.6 }, {
    steps: 64,
    extra: Ln(k.sideArc(PIT[0], PIT[1], PIT_R, 6, P, 40), { tone: "faint" })
      + S(k.cylinder(PIT[0], PIT[1], PIT_R - 1.4, PIT_H, 0.01, P, 64), { tone: "lo", crease: "none", flat: true, className: "cstr-slurry" })
      + Ln(k.ring(PIT[0], PIT[1], PIT_R - 1.4, PIT_H, P, 64), { tone: "lo" }),
  });
  box("feed.bridge", { x: PIT[0] - PIT_R - 0.6, y: PIT[1] - 2, w: 2 * PIT_R + 1.2, d: 4, r: 0.5 }, PIT_H, 1.6, { bevel: 0.3 });
  cyl("feed.agitator", PIT[0], PIT[1], 2.6, PIT_H + 1.6, 5, { tone: "hi" }, { steps: 24, extra: Ln(k.knurl(PIT[0], PIT[1], 2.6, PIT_H + 2.4, PIT_H + 5.8, 16, P), { tone: "faint" }) });
  cyl("feed.agitator-cap", PIT[0], PIT[1], 1.6, PIT_H + 6.6, 1.2, { tone: "mid" }, { steps: 20 });
  // Pump: skid, motor, gearbox, suction housing, stator, discharge, all on the line from the pit to the inlet.
  const SK = PIT_R + 11;
  const skidC = along(SK);
  obox("feed.skid", skidC, FEED_U, 22, 8, 0, 2, { tone: "lo" }, { extra: D(ringBox(skidC, FEED_U, 19, 5).map(([x, y]) => at([x, y, 2])), { size: 0.4 }) });
  const PZ = 6.2;
  const PF = G.frameAlong([skidC[0], skidC[1], PZ], [FEED_U[0], FEED_U[1], 0]);
  turned("feed.motor", PF, [[-10, 0], [-10, 2.6], [-9.4, 3.2], [-5, 3.2], [-5, 0]], { tone: "hi" }, { extra: k.fadedSvg(G.ribsOf(PF, -9.2, -5.6, 3.2, 16, P, { fade: [0.04, 0.42], seams: true }), { tone: "faint" }) });
  obox("feed.motor-foot", along(SK - 7.5), FEED_U, 4, 4.4, 2, PZ - 3.2 - 2, { tone: "lo", bevel: 0.2 });
  obox("feed.gearbox", along(SK - 3.4), FEED_U, 3.2, 6, 2, 7.6, { tone: "mid" });
  obox("feed.housing", along(SK + 0.2), FEED_U, 4, 6.4, 2, 7.6, { tone: "mid" });
  turned("feed.stator", PF, [[2.2, 0], [2.2, 2.4], [8.4, 2.4], [8.4, 0]], { tone: "hi", inner: Ln(G.arcOf(PF, 4.4, 2.4, P) + G.arcOf(PF, 6.4, 2.4, P), { tone: "faint" }) });
  turned("feed.discharge", PF, [[8.4, 0], [8.4, 2.9], [10, 2.9], [10, 0]], { tone: "mid" });
  obox("feed.stand", along(SK + 9.2), FEED_U, 1.6, 4, 2, PZ - 2.9 - 2, { tone: "mid" });
  // Suction: low out of the pit wall, across the ground, into the side of the suction housing.
  const out = (() => { const d = [0.55 * FEED_U[0] + 0.83 * FEED_V[0], 0.55 * FEED_U[1] + 0.83 * FEED_V[1]]; const n = Math.hypot(...d); return [d[0] / n, d[1] / n]; })();
  const SZ = 5.8;
  pipe("feed.suction", [[PIT[0] + out[0] * PIT_R, PIT[1] + out[1] * PIT_R, SZ], [PIT[0] + out[0] * (PIT_R + 6), PIT[1] + out[1] * (PIT_R + 6), SZ], [...along(SK + 0.2, 9.5), SZ], [...along(SK + 0.2, 3.2), SZ]], 1.3, { flangeR: [1.3, 1.6], bend: 3.4 });
  // Discharge: on along the axis, up beside the wall, through a gate valve into the tank below the slurry line.
  const d0 = G.pointOf(PF, 10, 0, 0);
  const foot = [FOOT[0], FOOT[1], PZ];
  pipe("feed.inlet", [d0, foot, [foot[0], foot[1], IN_Z], INLET], 1.5, { valve: 0.55, side: [Math.cos(IN_T), Math.sin(IN_T), 0], bend: 2.6 });
}

// Ladder up the wall to the rail, fixed to the wall by three brackets.
const LAD_T = 95.5 * DEG;
function ladder() {
  const rad = dir2(LAD_T);
  const rungs = [];
  const sides = [-2.4, 2.4].map((off) => [rad[0] * 69.6 - rad[1] * off, rad[1] * 69.6 + rad[0] * off]);
  for (const [i, c] of sides.entries()) obox(`ladder.rail${i}`, c, rad, 1.4, 0.7, 0, RAIL[3] + 9, { tone: "mid", bevel: 0.2 });
  for (let z = 4; z < RAIL[3] + 8; z += 3.2) rungs.push(k.segment([sides[0][0], sides[0][1], z], [sides[1][0], sides[1][1], z], P));
  const rungShapes = [];
  for (let z = 4; z < RAIL[3] + 8; z += 3.2) rungShapes.push(A.tube([[sides[0][0], sides[0][1], z], [sides[1][0], sides[1][1], z]], 0.35));
  put("ladder.rungs", [rad[0] * 69.6, rad[1] * 69.6, 30], Ln(rungs.join(""), { tone: "mid" }), rungShapes, { bias: 0.05 });
  for (const z of [14, 34, RAIL[2] - 2]) obox("ladder.bracket", [rad[0] * (RO + 2.1), rad[1] * (RO + 2.1)], rad, 4.2, 5.6, z, 1.2, { tone: "lo", bevel: 0.2 });
}

// Gas: offtake under the rail, a drop to the condensate trap, the line to the CHP; a hydraulic seal on the rail.
const GAS_T = -42 * DEG;
const CHP = { x: 2, y: -116, w: 54, d: 24, r: 0.8 };
const CHP_Z = 2, CHP_H = 24;
const TRAP = polar(RO + 8.5, GAS_T, 0);
function gas() {
  const trap = { x: TRAP[0] - 3.6, y: TRAP[1] - 3.6, w: 7.2, d: 7.2, r: 0.8 };
  box("gas.trap", trap, 0, 9, { tone: "mid" }, { extra: Ln(k.sideSeam(trap, 3, P, 3), { tone: "faint" }) });
  box("gas.trap-lid", k.insetPlan(trap, -0.4), 9, 1, { tone: "mid", bevel: 0.3 }, { extra: D(k.corners(trap, 1.2).map(([x, y]) => at([x, y, 10])), { size: 0.38 }) });
  const out = polar(RO, GAS_T, WALL_TOP - 3);
  pipe("gas.offtake", [out, polar(RO + 8.5, GAS_T, WALL_TOP - 3), [TRAP[0], TRAP[1], 10]], 1.6);
  const inlet = [CHP.x + 46, CHP.y + CHP.d, CHP_Z + 5];
  pipe("gas.line", [[TRAP[0], TRAP[1] - 3.6, 5], [TRAP[0], TRAP[1] - 14, 5], [inlet[0], TRAP[1] - 22, 5], [inlet[0], inlet[1] + 8, 5], [inlet[0], inlet[1], 5]], 1.4, { valve: 0.82, side: [1, 0, 0] });
  // Over/underpressure safety: a water-sealed pot standing on the rail, with its vent hood.
  const seal = polar((RAIL[0] + RAIL[1]) / 2, -50 * DEG, 0);
  cyl("gas.seal", seal[0], seal[1], 1.3, RAIL[3], 7, { tone: "hi" }, { steps: 20, extra: Ln(k.sideArc(seal[0], seal[1], 1.3, RAIL[3] + 3, P, 12), { tone: "faint" }) });
  cyl("gas.seal-hood", seal[0], seal[1], 1.9, RAIL[3] + 7, 1.2, { tone: "mid" }, { steps: 20 });
}

// CHP container: engine room with doors and louvres, dry cooler and exhaust silencer on the roof, a stack.
function chp() {
  box("chp.plinth", { x: CHP.x - 2, y: CHP.y - 2, w: CHP.w + 4, d: CHP.d + 4, r: 0.6 }, 0, CHP_Z, { tone: "lo" });
  const yF = CHP.y + CHP.d, xF = CHP.x + CHP.w;
  const ribs = [];
  for (let x = CHP.x + 3; x < CHP.x + CHP.w - 2; x += 2.6) ribs.push(k.segment([x, yF, CHP_Z], [x, yF, CHP_Z + CHP_H], P));
  const slot = (x0, x1, z) => k.pathOf([[x0, yF + 0.01, z], [x1, yF + 0.01, z], [x1, yF + 0.01, z + 1], [x0, yF + 0.01, z + 1]].map(at), true);
  let louvres = "";
  for (let z = CHP_Z + 13; z < CHP_Z + 21; z += 2) louvres += slot(CHP.x + 6, CHP.x + 18, z);
  const door = (y0, y1) => k.pathOf([[xF + 0.01, y0, CHP_Z + 1], [xF + 0.01, y1, CHP_Z + 1], [xF + 0.01, y1, CHP_Z + 20], [xF + 0.01, y0, CHP_Z + 20]].map(at), true);
  const lamp = at([xF, CHP.y + 12, CHP_Z + 21.6]);
  box("chp.container", CHP, CHP_Z, CHP_H, { tone: "mid", bevel: 0.8 }, {
    extra: Ln(ribs.join(""), { tone: "faint" }) + `<path class="cstr-louvre" d="${louvres}"/>` + Ln(louvres, { tone: "lo" })
      + Ln(door(CHP.y + 2, CHP.y + 11) + door(CHP.y + 13, CHP.y + 22), { tone: "lo" })
      + D([at([xF, CHP.y + 9.6, CHP_Z + 10]), at([xF, CHP.y + 14.4, CHP_Z + 10])], { size: 0.5, tone: "hi" })
      + `<circle data-part="chp-lamp" class="cstr-lamp" cx="${lamp[0].toFixed(1)}" cy="${lamp[1].toFixed(1)}" r="1.2"/>`,
    steps: 2,
  });
  // Dry cooler: a frame box with two fans on top.
  const cooler = { x: CHP.x + 4, y: CHP.y + 4, w: 22, d: 14, r: 0.6 };
  const top = CHP_Z + CHP_H + 6;
  FANS.push(...[cooler.x + 6, cooler.x + 16].map((x) => [x, cooler.y + 7, top]));
  box("chp.cooler", cooler, CHP_Z + CHP_H, 6, { tone: "mid", bevel: 0.4 }, {
    extra: [cooler.x + 6, cooler.x + 16].map((x) => Ln(k.ring(x, cooler.y + 7, 4.4, top, P, 32) + k.ring(x, cooler.y + 7, 1.2, top, P, 12), { tone: "lo" })).join("")
      + `<g data-part="fans"></g>`,
  });
  // Exhaust: a vertical silencer on the roof, the stack on top of it, a rain cap.
  const stackX = CHP.x + 44, stackY = CHP.y + 12, roof = CHP_Z + CHP_H;
  const SF = G.frameOf([stackX, stackY, roof], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  turned("chp.silencer-base", SF, [[0, 0], [0, 4.2], [0.8, 4.2], [0.8, 0]], { tone: "mid" });
  turned("chp.silencer", SF, [[0.8, 0], [0.8, 3.4], [13, 3.4], [15, 1.5], [24, 1.5], [24, 0]], { tone: "hi", inner: Ln(G.arcOf(SF, 4.5, 3.4, P) + G.arcOf(SF, 9.5, 3.4, P), { tone: "faint" }) });
  STACK.push(stackX, stackY, roof + 25.6);
  cyl("chp.cap", stackX, stackY, 2.4, roof + 24, 0.8, { tone: "mid" }, { steps: 20 });
}
const FANS = [];
const STACK = [];

// Heating: flow and return from the CHP's heat exchanger to the loops inside the wall.
function heating() {
  [[-53, 16, CHP.x + 20], [-49.5, 22, CHP.x + 25]].forEach(([deg, z, x], index) => {
    const t = deg * DEG;
    const wallAt = polar(RO, t, z);
    const low = CHP_Z + 4 + index * 4;
    const out = polar(RO + 7 + index * 3, t, low);
    const across = [Math.sin(AZIMUTH * DEG), -Math.cos(AZIMUTH * DEG)];
    const pre = [out[0] + across[0] * 9, out[1] + across[1] * 9, low];
    pipe(`heat.${index ? "return" : "flow"}`, [[x, CHP.y + CHP.d, low], [x, CHP.y + CHP.d + 6 + index * 3, low], pre, [out[0], out[1], low], [out[0], out[1], z], wallAt], 1.1, { bend: 3.2 });
  });
}

// Digestate: overflow box on the wall at the slurry line, a drop, and the pipe to a covered digestate pit.
const OUT_T = -28 * DEG;
function digestate() {
  const rad = dir2(OUT_T);
  obox("digestate.overflow", [rad[0] * (RO + 3.2), rad[1] * (RO + 3.2)], rad, 6.4, 7, LEVEL - 12, 13, { tone: "mid" });
  const pit = [rad[0] * 100, rad[1] * 100];
  obox("digestate.pit", pit, rad, 16, 20, 0, 7, { tone: "lo", bevel: 0.6 }, { extra: Ln(ringBox(pit, rad, 13, 17).map((p, i, all) => k.segment([...p, 7], [...all[(i + 1) % 4], 7], P)).join(""), { tone: "faint" }) });
  pipe("digestate.drop", [polar(RO + 3.2, OUT_T, LEVEL - 12), polar(RO + 3.2, OUT_T, 4.2), polar(100 - 8, OUT_T, 4.2)], 1.8, { flangeR: 1.4 });
}

// Flare: the safety outlet when the gas holder is full. A base, a stack, the burner and its windshield.
const FLARE = [94, -90];
const FLARE_TOP = 52;
function flare() {
  const base = { x: FLARE[0] - 3.4, y: FLARE[1] - 3.4, w: 6.8, d: 6.8, r: 0.6 };
  box("flare.base", base, 0, 8, { tone: "mid" }, { extra: D(k.corners(base, 1.1).map(([x, y]) => at([x, y, 8])), { size: 0.38 }) });
  cyl("flare.stack", FLARE[0], FLARE[1], 1.5, 8, FLARE_TOP - 6 - 8, { tone: "hi" }, { steps: 20, extra: Ln(k.sideArc(FLARE[0], FLARE[1], 1.5, 20, P, 12) + k.sideArc(FLARE[0], FLARE[1], 1.5, 34, P, 12), { tone: "faint" }) });
  cyl("flare.burner", FLARE[0], FLARE[1], 2.4, FLARE_TOP - 6, 2, { tone: "mid" }, { steps: 24 });
  cyl("flare.shield", FLARE[0], FLARE[1], 3.2, FLARE_TOP - 4, 4, { tone: "mid", bevel: 0.3 }, { steps: 32, extra: Ln(k.ring(FLARE[0], FLARE[1], 2.6, FLARE_TOP, P, 32), { tone: "lo" }) });
  const from = [TRAP[0] + 3.6, TRAP[1], 5];
  pipe("gas.flare", [from, [FLARE[0] - 26, TRAP[1], 5], [FLARE[0] - 26, FLARE[1], 5], [FLARE[0] - 3.4, FLARE[1], 5]], 1.2, { valve: 0.3, side: [0, 0, 1] });
}

// ── Assembly ────────────────────────────────────────────────────────────────
put("stand.plate", [0, 0, -PLATE_H / 2], bench(), [A.slab(PLATE, -PLATE_H, PLATE_H, {}, 8)], { key: -1e6 });
const tankSvg = [
  slab(),
  wall(FAR), rail(FAR),
  `<g data-topic="slurry">${slurry()}</g>`,
  `<g data-topic="roof">${mast()}</g>`,
  `<g data-topic="mixer">${mixer()}</g>`,
  `<g data-topic="roof"><g class="cstr-outer">${outerShell.far}${Ln(outerShell.edges, { tone: "mid" })}</g>`,
  `<g data-part="inner" class="cstr-inner"></g>`,
  `<g class="cstr-outer-cut">${Ln(outerShell.cuts, { tone: "hi" })}</g></g>`,
  wall(NEAR_L, { outer: true, ends: [CUT[1]] }), rail(NEAR_L),
  wall(NEAR_R, { outer: true, ends: [CUT[0] + 2 * Math.PI] }), rail(NEAR_R),
].join("");
const DOME_F = G.frameOf([0, 0, RIM_Z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const domeProfile = Array.from({ length: 9 }, (_, i) => { const s = (OUTER.h * i) / 8; return [s, i === 8 ? 0 : Math.sqrt(OUTER.rs ** 2 - (RIM_Z + s - OUTER.zc) ** 2)]; });
put("tank", [0, 0, 30], tankSvg, [A.cylinder(0, 0, RO + 3, 0, Z0), A.cylinder(0, 0, RO, Z0, RAIL[3] - Z0), A.solid(DOME_F, [[0, 0], ...domeProfile])]);
feed();
ladder();
gas();
chp();
heating();
digestate();
flare();
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
// Exhaust and flame float above everything they rise from.
const body = [...wrapItems("farm", R.items), `<g data-topic="chp"><g data-part="exhaust"></g></g>`, `<g data-topic="flare"><g data-part="flame"></g></g>`];
export const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: [
  "A farm biogas digester of the continuously stirred tank type, cut open. A round concrete tank, insulated and clad, holds 520 cubic metres of dairy-manure slurry under a double-membrane gas roof whose inner membrane rises and falls with the stored gas. A propeller mixer on a guide mast stirs the slurry; heating loops on the inside of the wall keep it warm; bubbles rise through the cut faces. A screw pump feeds it from a pit; an overflow sends digestate to a pit; the gas goes through a condensate trap to an engine container, with a flare for surplus gas.",
  "Um biodigestor de mistura completa (CSTR) cortado ao meio. Um tanque redondo de concreto, isolado e revestido, guarda 520 metros cúbicos de chorume de gado leiteiro sob uma cobertura de dupla membrana, cuja membrana interna sobe e desce com o gás armazenado. Um agitador de hélice numa haste-guia mistura o chorume; serpentinas de aquecimento na face interna da parede mantêm a temperatura; bolhas sobem pelas faces do corte. Uma bomba helicoidal o alimenta a partir de um poço; um extravasor leva o digestato a uma caixa; o gás passa por um purgador de condensado até o contêiner do motor, com um flare para o excedente.",
][L], body });
export { R, P };
export const text = {
  title: ["Farm scale · 520 m³", "Escala real · 520 m³"][L],
  keys: [
    [{ mark: "dashed", label: "Dashes: what is flowing right now" }, { mark: "raised", label: "Grey dome: the gas membrane, as full as the store" }],
    [{ mark: "dashed", label: "Tracejado: o que está escoando agora" }, { mark: "raised", label: "Cúpula cinza: a membrana de gás, tão cheia quanto o estoque" }],
  ][L],
  caption: [
    "A 520 m³ CSTR on dairy manure, sized from CP2b's dairy parameters (BMP 200 Nm³ CH₄/t VS, VS 78 % of TS). A pump feeds the tank eight times a day and the overflow lets the same volume out; the mixer runs 15 minutes an hour, and with it off scum and sediment build up on the cut faces; the heating loops hold the set point; the 50 kW engine starts at 70 % gas and stops at 30 %, and the flare burns what the store cannot hold.",
    "Um CSTR de 520 m³ com esterco de gado leiteiro, dimensionado com os parâmetros de leite do CP2b (BMP 200 Nm³ CH₄/t SV, SV 78 % do ST). Uma bomba alimenta o tanque oito vezes por dia e o extravasor deixa sair o mesmo volume; o agitador roda 15 minutos por hora, e desligado deixa formar crosta e sedimento nas faces do corte; as serpentinas seguram a temperatura; o motor de 50 kW liga com 70 % de gás e desliga com 30 %, e o flare queima o que o gasômetro não guarda.",
  ][L],
};
export const data = {
  P, CUT, KEPT, ROOF, RI, Z0, LEVEL, RIM_Z, INNER_A, INNER_MIN, INNER_MAX, HEAT_R,
  hub: G.add3(MOTOR.o, G.mul3(MOTOR.a, HUB_S + 0.4)), u: MOTOR.u, v: MOTOR.v, BLADE_R,
  fans: FANS, stack: STACK, flare: [...FLARE, FLARE_TOP],
  text: { chpOn: L ? "motor ligado" : "engine on", chpOff: L ? "motor parado" : "engine off", flaring: L ? "flare aceso" : "flaring", gas: L ? "gás " : "gas " },
};

// The page code for this figure: farmLive(C, root, clock) returns { update(plant), tick(dt, dtH, wall, calm) }.
export const live = String.raw`
function farmLive(C, root, clock) {
  const P = C.P;
  const svg = root.querySelector("svg");
  const readout = root.querySelector("[data-readout]");
  const q = (s) => svg.querySelector(s);
  const qa = (s) => [...svg.querySelectorAll(s)];
  const parts = {
    inner: q('[data-part="inner"]'), prop: q('[data-part="prop"]'), bubbles: q('[data-part="bubbles"]'), swirl: q('[data-part="swirl"]'),
    scum: qa('[data-part="scum"]'), sediment: qa('[data-part="sediment"]'), heat: qa('[data-part="heat"]'),
    fans: q('[data-part="fans"]'), exhaust: q('[data-part="exhaust"]'), flame: q('[data-part="flame"]'), lamp: q('[data-part="chp-lamp"]'),
  };
  const flows = {};
  qa("[data-flow-of]").forEach((el) => (flows[el.dataset.flowOf] ??= []).push(el));
  const setFlow = (names, on) => names.forEach((n) => (flows[n] || []).forEach((el) => el.classList.toggle("on", on)));
  const capVol = (h) => (Math.PI * h * (3 * C.INNER_A ** 2 + h * h)) / 6;
  const VMIN = capVol(C.INNER_MIN), VMAX = capVol(C.INNER_MAX);
  const hOf = (f) => { const want = VMIN + f * (VMAX - VMIN); let lo = C.INNER_MIN, hi = C.INNER_MAX; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (capVol(m) < want) lo = m; else hi = m; } return (lo + hi) / 2; };
  const STORE_M3 = (VMAX - VMIN) / 1000;
  const PUMP_M3H = 10;   // feed pump rate
  const PULSES = 8;      // feeds a day
  const sim = { fill: 0.45, chp: false, flaring: 0, temp: DESIGN.temperature, heater: false, mixing: false, feeding: false, strat: 0.4, prop: 0, fan: 0, extra: 0 };
  let plant = { ...DESIGN }, steadyNow = steady(plant), warmNow = steadyNow, gasRate = steadyNow.biogas / 24;
  const CHP_BIOGAS = 50 / (ENERGY.kwhPerM3 * ENERGY.electrical) / FEED.ch4InBiogas; // m3 biogas / h at 50 kWe
  const bubbles = Array.from({ length: 70 }, (_, i) => ({ face: i % 2, r: 3 + Math.random() * (C.RI - 6), z: C.Z0 + Math.random() * (C.LEVEL - C.Z0), s: 0.5 + Math.random() * 0.7, live: Math.random() < 0.5 }));
  const puffs = Array.from({ length: 10 }, (_, i) => ({ z: (i / 10) * 18, x: 0 }));
  const polar3 = (r, t, z) => [r * Math.cos(t), r * Math.sin(t), z];
  function drawMembrane(f) {
    const cap = capAt(C.INNER_A, C.RIM_Z, hOf(f));
    const s = shellSvg(cap, C.ROOF[0], C.ROOF[1], P, { nTheta: 32, nRing: 7, under: "cstr-gas-under" });
    parts.inner.innerHTML = s.far + '<path class="iso-line" data-tone="mid" d="' + s.edges + '"/><path class="iso-line cstr-cut" data-tone="hi" d="' + s.cuts + '"/>';
  }
  function drawProp(angle) {
    let d = "";
    for (let b = 0; b < 3; b++) {
      const a0 = angle + (b * 2 * Math.PI) / 3;
      const pts = [[1.2, -0.9], [C.BLADE_R * 0.55, -1.9], [C.BLADE_R, -0.6], [C.BLADE_R * 0.92, 0.9], [1.2, 0.9]].map(([rr, w]) => {
        const c = Math.cos(a0), s = Math.sin(a0);
        const x = rr * c - w * s, y = rr * s + w * c;
        return iso([C.hub[0] + C.u[0] * x + C.v[0] * y, C.hub[1] + C.u[1] * x + C.v[1] * y, C.hub[2] + C.u[2] * x + C.v[2] * y], P);
      });
      d += pathOf(pts, true);
    }
    parts.prop.innerHTML = '<path class="iso-fill" d="' + d + '"/><path class="iso-shade" data-shade="2" d="' + d + '"/><path class="iso-line" data-tone="hi" d="' + d + '"/>';
  }
  function drawBubbles(dtH) {
    const rate = clamp((gasRate * 24 * FEED.ch4InBiogas) / 250, 0, 2.5);
    let html = "";
    for (const b of bubbles) {
      if (b.live) {
        b.z += dtH * 30 * b.s * (sim.mixing ? 1.3 : 1);
        if (b.z > C.LEVEL - 0.6) { b.live = Math.random() < rate * 0.6; b.z = C.Z0 + 1 + Math.random() * 6; b.r = 3 + Math.random() * (C.RI - 6); }
      } else if (Math.random() < rate * dtH * 2) b.live = true;
      if (!b.live) continue;
      const p = iso(polar3(b.r, C.CUT[b.face], b.z), P);
      html += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (0.55 + 0.35 * b.s).toFixed(2) + '"/>';
    }
    parts.bubbles.innerHTML = html;
  }
  function drawFans() {
    let d = "";
    for (const [x, y, z] of C.fans) for (let b = 0; b < 4; b++) {
      const a = sim.fan + (b * Math.PI) / 2;
      d += lineOnTop([x + 1.2 * Math.cos(a), y + 1.2 * Math.sin(a)], [x + 4 * Math.cos(a + 0.35), y + 4 * Math.sin(a + 0.35)], z, P);
    }
    parts.fans.innerHTML = '<path class="iso-line" data-tone="mid" d="' + d + '"/>';
  }
  function drawExhaust(dtH) {
    let html = "";
    for (const p of puffs) {
      p.z += dtH * 40;
      if (p.z > 18) p.z -= 18;
      const a = iso([C.stack[0] + p.z * 0.25, C.stack[1], C.stack[2] + p.z], P);
      const alpha = sim.chp ? (1 - p.z / 18) * 0.55 : 0;
      if (alpha > 0.02) html += '<circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="' + (0.8 + p.z * 0.09).toFixed(2) + '" fill-opacity="' + alpha.toFixed(2) + '"/>';
    }
    parts.exhaust.innerHTML = html;
  }
  function drawFlame(t) {
    const f = sim.flaring;
    if (f < 0.02) { parts.flame.innerHTML = ""; return; }
    const [x, y, z] = C.flare;
    const h = (7 + 2 * Math.sin(t * 9) + Math.sin(t * 23)) * f;
    const pts = [[-2.2, 0], [-1.4, h * 0.5], [-0.3, h], [0.6, h * 0.62], [1.6, h * 0.35], [2.2, 0]].map(([dx, dz]) => iso([x + dx * 0.574, y - dx * 0.819, z + dz], P));
    parts.flame.innerHTML = '<path class="cstr-flame" d="' + pathOf(pts, true) + '" fill-opacity="' + (0.35 + 0.6 * f).toFixed(2) + '"/>';
  }
  function tick(dt, dtH, wall, calm) {
    // The process answers a change over hours, not at once (a real one takes weeks). It follows the slurry's own
    // temperature, not the set point: the kinetics are read at the temperature the tank has reached.
    warmNow = steady({ ...plant, temperature: sim.temp }, VOLUME);
    gasRate += (warmNow.biogas / 24 - gasRate) * (1 - Math.exp(-dtH / 6));
    // Feeding: eight pulses a day at the pump rate; the overflow lets the same volume out. "Feed now" adds one pulse.
    const pulse = steadyNow.q / PULSES / PUMP_M3H;
    sim.feeding = clock.hour % (24 / PULSES) < pulse || sim.extra > 0;
    if (sim.extra > 0) sim.extra -= dtH;
    sim.mixing = clock.mixerMode === "on" || (clock.mixerMode === "auto" && clock.hour % 1 < 0.25);
    sim.strat = clamp(sim.strat + dtH * (sim.mixing ? -1.6 : 0.12), 0, 1);
    // Gas: in from the slurry; the engine burns 50 kWe worth between 70 % and 30 % full; the flare takes what would overfill.
    if (sim.fill > 0.7) sim.chp = true;
    if (sim.fill < 0.3) sim.chp = false;
    const net = gasRate - (sim.chp ? CHP_BIOGAS : 0);
    const next = sim.fill + (net * dtH) / STORE_M3;
    const burning = next > 0.985 && net > 0;
    sim.fill = clamp(burning ? 0.985 : next, 0, 1);
    sim.flaring += ((burning ? 1 : 0) - sim.flaring) * (1 - Math.exp(-dt / 0.6));
    // Heating: loops on below the set point, off above it; 520 m3 of slurry loses heat slowly to a 22 C day.
    const set = plant.temperature;
    if (sim.temp < set - 0.3) sim.heater = true;
    if (sim.temp > set + 0.3 || clock.heaterFail) sim.heater = false;
    sim.temp += dtH * ((sim.heater ? 0.9 + 0.03 * Math.max(0, set - 37) : 0) - 0.03 * (sim.temp - 22));
    if (!calm) { sim.prop += sim.mixing ? dt * 2 * Math.PI * 2.2 : 0; sim.fan += sim.chp ? dt * 2 * Math.PI * 1.4 : 0; }
    drawMembrane(sim.fill);
    drawProp(sim.prop);
    drawBubbles(dtH);
    drawFans();
    drawExhaust(dtH);
    drawFlame(wall);
    parts.scum.forEach((el) => (el.style.opacity = (0.15 + 0.85 * sim.strat).toFixed(3)));
    parts.sediment.forEach((el) => (el.style.opacity = (0.15 + 0.85 * sim.strat).toFixed(3)));
    parts.heat.forEach((el) => el.classList.toggle("on", sim.heater));
    parts.swirl.classList.toggle("on", sim.mixing);
    parts.lamp.classList.toggle("on", sim.chp);
    setFlow(["feed.suction", "feed.inlet", "digestate.drop"], sim.feeding);
    setFlow(["gas.offtake", "gas.line"], sim.chp);
    setFlow(["gas.flare"], sim.flaring > 0.5);
    setFlow(["heat.flow", "heat.return"], sim.heater);
    const text = clockText(clock.hour) + " · " + sim.temp.toFixed(1) + " °C · " + C.text.gas + Math.round(sim.fill * 100) + " % · " + (sim.flaring > 0.5 ? C.text.flaring : sim.chp ? C.text.chpOn : C.text.chpOff);
    if (readout.textContent !== text) readout.textContent = text;
  }
  drawMembrane(sim.fill);
  drawProp(0);
  drawFans();
  // What each part is doing now, for its card: [label, value] rows.
  const F = U.facts, n1 = (v) => fmt(v, 1), n0 = (v) => fmt(v, 0);
  const onOff = (on) => (on ? F.on : F.off);
  function facts(topic) {
    const gasH = gasRate, store = sim.fill * STORE_M3;
    switch (topic) {
      case "tank": return [[F.volume, n0(VOLUME) + " m³"], [F.hrt, n0(plant.hrt) + " d"], [F.temp, n1(sim.temp) + " °C"], [F.surface, fmt(surfacePerVolume(PLANT.radius, PLANT.level), 2) + " m²/m³"]];
      case "slurry": return [[F.temp, n1(sim.temp) + " °C"], [F.olr, fmt(steadyNow.olr, 2) + " kg VS/m³·d"], [F.share, n0(warmNow.share * 100) + " %"], [F.layers, n0(sim.strat * 100) + " %"]];
      case "mixer": return [[F.state, onOff(sim.mixing)], [F.mode, U[clock.mixerMode]], [F.layers, n0(sim.strat * 100) + " %"]];
      case "heat": return [[F.state, clock.heaterFail ? F.failed : onOff(sim.heater)], [F.temp, n1(sim.temp) + " °C"], [F.set, n0(plant.temperature) + " °C"]];
      case "roof": return [[F.stored, n0(store) + " m³ · " + n0(sim.fill * 100) + " %"], [F.biogasIn, n1(gasH) + " m³/h"], [F.biogasOut, n1(sim.chp ? CHP_BIOGAS : 0) + " m³/h"]];
      case "feed": return [[F.state, sim.feeding ? F.pumping : F.waiting], [F.perDay, n1(steadyNow.q) + " m³/d"], [F.pulse, n0((steadyNow.q / PULSES / PUMP_M3H) * 60) + " min · " + PULSES + "×/d"]];
      case "gas": return [[F.biogasIn, n1(gasH) + " m³/h"], [F.methane, n0(FEED.ch4InBiogas * 100) + " %"], [F.toEngine, n1(sim.chp ? CHP_BIOGAS : 0) + " m³/h"]];
      case "chp": return [[F.state, onOff(sim.chp)], [F.power, sim.chp ? "50 kW" : "0 kW"], [F.uses, n1(CHP_BIOGAS) + " m³/h"], [F.stored, n0(sim.fill * 100) + " %"]];
      case "flare": return [[F.state, sim.flaring > 0.5 ? F.burning : F.off], [F.stored, n0(sim.fill * 100) + " %"]];
      case "digestate": return [[F.state, sim.feeding ? F.flowing : F.waiting], [F.perDay, n1(steadyNow.q) + " m³/d"]];
    }
    return [];
  }
  return {
    sim,
    facts,
    // Biogas per m3 of reactor per day and temperature: the two numbers both scales share.
    now() { return { temp: sim.temp, gas: (gasRate * 24) / VOLUME }; },
    update(next) { plant = next; steadyNow = steady(plant, VOLUME); },
    feedNow() { sim.extra = steadyNow.q / PULSES / PUMP_M3H; },
    tick,
  };
}
`;
