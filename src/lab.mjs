// Fig 2: the same process on a bench. A 5 L jacketed glass CSTR, cut open like the farm tank, stirred from above by an
// overhead stirrer on a lab stand, kept warm by water from a circulator through its jacket, fed by a peristaltic pump on a
// timer, with an overflow side arm to an effluent bottle and its gas counted by a drum gas meter into a sampling bag.
// World: 1 unit = 3 mm, so the 180 mm vessel is 60 units across. lab.R is recorded for the audit; lab.live moves it.
import { k, G, A, L, DEG } from "./kit.mjs";
import { partsFor } from "./parts.mjs";
import { wrapItems } from "./topics.mjs";
import * as M from "./model.mjs";

const WIDTH = 720;
const HEIGHT = 450;
const AZIMUTH = 35;
const ELEVATION = 30;
const MM = 1 / 3;                          // units per millimetre

// ── Vessel ──────────────────────────────────────────────────────────────────
const RI = M.LAB.radius * 1000 * MM;       // 30, inside of the glass
const GLASS = 1.4;                         // 4 mm borosilicate
const JACKET = [RI + GLASS, RI + 6];       // the water jacket, 31.4 to 36
const RO = JACKET[1] + GLASS;              // 37.4, outside of the jacket
const Z0 = 6;                              // vessel bottom, on its support ring
const ZF = 12;                             // inner floor
const LEVEL = ZF + M.LAB.level * 1000 * MM; // 77.5
const JTOP = 96;                           // the jacket closes here; the inner wall runs on to the flange
const FL = [103, 106];                     // glass flange
const FLANGE_R = 42;
const LID = [106, 109.5];
const CLAMP = [RI + 12, RI + 15, 103, 109.5];
const HUB_Z = 30;                          // impeller hub, about a third up the liquid
const BLADE_R = 13;

const CUT = [AZIMUTH - 55, AZIMUTH + 55].map((d) => d * DEG);
const KEPT = [CUT[1], CUT[0] + 2 * Math.PI];
const NEAR_L = [CUT[1], (AZIMUTH + 90) * DEG];
const FAR = [(AZIMUTH + 90) * DEG, (AZIMUTH + 270) * DEG];
const NEAR_R = [(AZIMUTH + 270) * DEG, CUT[0] + 2 * Math.PI];

// Placement on the bench by screen side and depth: s to the right, d toward the viewer.
const RIGHT = [Math.sin(AZIMUTH * DEG), -Math.cos(AZIMUTH * DEG)];
const FRONT = [Math.cos(AZIMUTH * DEG), Math.sin(AZIMUTH * DEG)];
const W = (s, d) => [RIGHT[0] * s + FRONT[0] * d, RIGHT[1] * s + FRONT[1] * d];

const PLATE = { x: -72, y: -122, w: 204, d: 236, r: 10 };
const PLATE_H = 8;
const FOOT_H = 4;
const MOTOR_TOP = 176;
const ROD_TOP = 200;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, ROD_TOP + 4], [-62, -34, ROD_TOP + 4]],
  WIDTH, HEIGHT, { pad: 22, azimuth: AZIMUTH, elevation: ELEVATION },
);
const R = A.recorder(P);
const { V, at, S, Ln, D, put, obox, box, cyl, turned, pipe } = partsFor(P, R);
const polar = (r, t, z) => [r * Math.cos(t), r * Math.sin(t), z];
const arc = (r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const t = a0 + ((a1 - a0) * i) / n; return [r * Math.cos(t), r * Math.sin(t)]; });
const arcRing = (r0, r1, a0, a1, n) => [...arc(r1, a0, a1, n), ...arc(r0, a1, a0, n)];
const stepsFor = (a0, a1) => Math.max(4, Math.round(((a1 - a0) / DEG) / 4));
const facing = (t) => Math.cos(t) * V[0] + Math.sin(t) * V[1];
const onCut = (t, rz) => k.pathOf(rz.map(([r, z]) => at(polar(r, t, z))), true);
const UP = [0, 0, 1];
const vert = (x, y, z) => G.frameOf([x, y, z], UP, [1, 0, 0], [0, 1, 0]);

// ── Bench ───────────────────────────────────────────────────────────────────
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.4, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "lo", inner: Ln(k.sideSeam(PLATE, -3.5, P, 8), { tone: "faint" }) }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(PLATE, 10);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Ruler along the front-left edge, in centimetres: a major tick every 5 cm (16.7 units).
  const strip = { x: PLATE.x + 30, y: PLATE.y + PLATE.d - 14, w: 110, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + 4 + 100, 10 / 3, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  return out.join("");
}

// ── The vessel: one item, painted in its own order, recorded as its true outer shape ─────────────────────
function wall([a0, a1], r0, r1, z0, z1, { outer = false, ends = [] } = {}) {
  const ring = arcRing(r0, r1, a0, a1, stepsFor(a0, a1));
  let inner = "";
  if (outer) {
    // Two etched graduation rings on the jacket and a fused seam where the jacket closes.
    inner = Ln([z0 + 24, z0 + 48].map((z) => k.onTop(arc(r1, a0, a1, stepsFor(a0, a1) * 2).filter((_, i, all) => facing(a0 + ((a1 - a0) * i) / (all.length - 1)) > 0), z, P)).join(""), { tone: "faint" });
  }
  let faces = "";
  for (const t of ends) {
    faces += '<g data-topic="jacket">';
    if (r1 > JACKET[1]) {
      faces += `<path data-part="jacket" class="cstr-heat" d="${onCut(t, [[JACKET[0], Math.max(z0, Z0 + GLASS)], [JACKET[1], Math.max(z0, Z0 + GLASS)], [JACKET[1], Math.min(z1, JTOP - GLASS)], [JACKET[0], Math.min(z1, JTOP - GLASS)]])}"/>`;
      faces += Ln(onCut(t, [[JACKET[0], Math.max(z0, Z0 + GLASS)], [JACKET[1], Math.max(z0, Z0 + GLASS)], [JACKET[1], Math.min(z1, JTOP - GLASS)], [JACKET[0], Math.min(z1, JTOP - GLASS)]]), { tone: "lo" });
    }
    faces += "</g>";
  }
  return S(k.extrude(ring, z0, z1 - z0, P, { convex: false }), { tone: "hi", crease: "faint", inner }) + faces;
}

const HEAT_FACE = [];
function liquid() {
  const ring = [[0, 0], ...arc(RI - 0.05, KEPT[0], KEPT[1], 64)];
  const out = [S(k.extrude(ring, ZF, LEVEL - ZF, P, { convex: false }), { tone: "lo", crease: "lo", className: "cstr-slurry" })];
  for (const t of CUT) {
    out.push(`<path data-part="sediment" class="cstr-sediment" d="${onCut(t, [[0.3, ZF], [RI - 0.1, ZF], [RI - 0.1, ZF + 4], [0.3, ZF + 4]])}"/>`);
    out.push(`<path data-part="scum" class="cstr-scum" d="${onCut(t, [[0.3, LEVEL - 3], [RI - 0.1, LEVEL - 3], [RI - 0.1, LEVEL], [0.3, LEVEL]])}"/>`);
  }
  // The flow the impeller drives, on the surface.
  const swirl = [10, 18, 25].map((r) => k.onTop(arc(r, KEPT[1] - 0.06, KEPT[0] + 0.06, 72), LEVEL + 0.05, P)).join("");
  out.push(`<g data-part="swirl">${Ln(swirl, { tone: "lo", flow: true, free: true })}</g>`);
  out.push(`<g data-part="bubbles"></g>`);
  return out.join("");
}

// Lid: a stainless plate cut like the vessel, a centre hub carrying the stirrer gland, and four ports.
const PORTS = {
  feed: { t: 128 * DEG, r: 24, h: 5.5, R: 3.2 },
  probe: { t: 182 * DEG, r: 25, h: 4.5, R: 2.6 },
  gas: { t: 232 * DEG, r: 25, h: 5.5, R: 3.2 },
  sample: { t: 292 * DEG, r: 26, h: 4, R: 2.4 },
};
const GLAND = [LID[1], LID[1] + 4.5, LID[1] + 10];   // hub top, bearing top
function lid() {
  const out = [];
  const ring = [[0, 0], ...arc(FLANGE_R, KEPT[0], KEPT[1], 72)];
  const bolts = [];
  for (let t = KEPT[0] + 6 * DEG; t < KEPT[1] - 4 * DEG; t += 15 * DEG) bolts.push(at(polar(FLANGE_R - 3, t, LID[1])));
  out.push(S(k.extrude(ring, LID[0], LID[1] - LID[0], P, { convex: false, bevel: 0.4 }), { tone: "mid" }) + D(bolts, { size: 0.4, tone: "lo" }));
  out.push(Ln(k.onTop(arc(FLANGE_R - 6, KEPT[0] + 0.03, KEPT[1] - 0.03, 64), LID[1], P), { tone: "faint", free: true }));
  return out.join("");
}

function vessel() {
  const out = [];
  // Bottom: the closed jacket under the inner floor, kept whole.
  out.push(S(k.cylinder(0, 0, RO, Z0, ZF - Z0, P, 96, 0.6), { tone: "hi" }));
  out.push(wall(FAR, RI, RO, ZF, JTOP));
  out.push(wall(FAR, RI, RI + GLASS, JTOP, FL[0]));
  out.push(`<g data-topic="slurry">${liquid()}</g>`);
  // The near walls, their cut faces showing the glass, the water in the jacket and the glass again.
  out.push(wall(NEAR_L, RI, RO, ZF, JTOP, { outer: true, ends: [CUT[1]] }), wall(NEAR_L, RI, RI + GLASS, JTOP, FL[0]));
  out.push(wall(NEAR_R, RI, RO, ZF, JTOP, { outer: true, ends: [CUT[0] + 2 * Math.PI] }), wall(NEAR_R, RI, RI + GLASS, JTOP, FL[0]));
  // Jacket shoulder, flange, lid and clamp.
  out.push(S(k.extrude(arcRing(RI + GLASS, RO, KEPT[0], KEPT[1], 72), JTOP, 0.01, P, { convex: false }), { tone: "hi", flat: true }));
  out.push(S(k.extrude(arcRing(RI, FLANGE_R, KEPT[0], KEPT[1], 72), FL[0], FL[1] - FL[0], P, { convex: false, bevel: 0.3 }), { tone: "hi" }));
  out.push('<g data-topic="lid">', lid());
  out.push(S(k.extrude(arcRing(CLAMP[0], CLAMP[1], KEPT[0] + 0.05, KEPT[1] - 0.05, 72), CLAMP[2], CLAMP[3] - CLAMP[2], P, { convex: false, bevel: 0.3 }), { tone: "mid" }));
  out.push("</g>");
  // Centre hub with the gland, the shaft down to the impeller hub, and the impeller's live slot.
  out.push('<g data-topic="stirrer">');
  out.push(S(k.cylinder(0, 0, 6, LID[0], LID[1] - LID[0], P, 40, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 4.6, GLAND[0], GLAND[1] - GLAND[0], P, 36, 0.3), { tone: "mid", inner: Ln(k.sideArc(0, 0, 4.6, GLAND[0] + 2.2, P, 24), { tone: "faint" }) }));
  out.push(S(k.cylinder(0, 0, 3.2, GLAND[1], GLAND[2] - GLAND[1], P, 32, 0.3), { tone: "hi" }));
  out.push(S(k.cylinder(0, 0, 1, HUB_Z + 3, LID[0] - HUB_Z - 3, P, 16), { tone: "hi", crease: "none", inner: Ln(k.sideArc(0, 0, 1, LEVEL, P, 10), { tone: "faint" }) }));
  out.push(S(k.cylinder(0, 0, 2.4, HUB_Z - 3, 6, P, 24, 0.3), { tone: "mid" }));
  out.push(`<g data-part="impeller"></g>`, "</g>");
  return out.join("");
}

// Support ring under the vessel: a stainless foot ring with a PTFE seat.
function support() {
  cyl("vessel.foot", 0, 0, RO + 3, 0, 2.2, { tone: "lo" }, { steps: 96, extra: D(Array.from({ length: 6 }, (_, i) => at(polar(RO + 1.5, KEPT[0] + 0.2 + i * 0.85, 2.2))), { size: 0.38, tone: "lo" }) });
  cyl("vessel.seat", 0, 0, RO - 3, 2.2, Z0 - 2.2, { tone: "mid" }, { steps: 96 });
}

// ── Lid ports ─────────────────────────────────────────────────────────────────
const portTop = (p) => [...polar(p.r, p.t, 0).slice(0, 2), LID[1] + p.h];
function ports() {
  for (const [name, p] of Object.entries(PORTS)) {
    const [x, y] = polar(p.r, p.t, 0);
    cyl(`lid.${name}`, x, y, p.R + 1, LID[1], 1.4, { tone: "mid" }, { steps: 24 });
    cyl(`lid.${name}-neck`, x, y, p.R, LID[1] + 1.4, p.h - 1.4, { tone: "hi" }, { steps: 24, extra: Ln(k.sideArc(x, y, p.R, LID[1] + p.h - 1.6, P, 16), { tone: "faint" }) });
  }
  // The temperature probe stands in its port: a sheath and a connector head.
  const [px, py] = polar(PORTS.probe.r, PORTS.probe.t, 0);
  const top = LID[1] + PORTS.probe.h;
  cyl("probe.sheath", px, py, 1, top, 9, { tone: "hi" }, { steps: 14 });
  cyl("probe.head", px, py, 2, top + 9, 6, { tone: "mid" }, { steps: 20, extra: Ln(k.knurl(px, py, 2, top + 10, top + 14, 10, P), { tone: "faint" }) });
  // The sampling port is closed with a septum cap.
  const [sx, sy] = polar(PORTS.sample.r, PORTS.sample.t, 0);
  cyl("lid.sample-cap", sx, sy, PORTS.sample.R + 0.6, LID[1] + PORTS.sample.h, 2, { tone: "mid" }, { steps: 20 });
}

// ── Overhead stirrer on a lab stand ──────────────────────────────────────────
const ROD = [-62, -34];
const CLAMP_Z = 166;
const MOTOR_Z = [138, MOTOR_TOP];
const MOTOR_R = 8.5;
function stirrer() {
  // Stand: a cast base with levelling feet, the rod, a boss head and the arm to the motor.
  const base = { x: ROD[0] - 22, y: ROD[1] - 12, w: 34, d: 24, r: 2 };
  box("stand.base", base, 0, 3.2, { tone: "lo", bevel: 0.6 }, { extra: Ln(k.planOutline(k.insetPlan(base, 2.5), 3.2, P), { tone: "faint" }) + D(k.corners(base, 3.2).map(([x, y]) => at([x, y, 3.2])), { size: 0.4 }) });
  cyl("stand.socket", ROD[0], ROD[1], 3.2, 3.2, 4, { tone: "mid" }, { steps: 24 });
  cyl("stand.rod", ROD[0], ROD[1], 1.8, 7.2, CLAMP_Z - 4 - 7.2, { tone: "hi" }, { steps: 20 });
  cyl("stand.rod-top", ROD[0], ROD[1], 1.8, CLAMP_Z + 4, ROD_TOP - CLAMP_Z - 4, { tone: "hi" }, { steps: 20 });
  cyl("stand.rod-cap", ROD[0], ROD[1], 2.1, ROD_TOP, 1, { tone: "mid" }, { steps: 20 });
  const dir = G.unit3([-ROD[0], -ROD[1], 0]);
  const side = [-dir[1], dir[0], 0];
  // Boss head: a block round the rod with a thumb screw on its side.
  cyl("stand.boss", ROD[0], ROD[1], 3.4, CLAMP_Z - 4, 8, { tone: "mid", bevel: 0.4 }, { steps: 28, extra: Ln(k.sideArc(ROD[0], ROD[1], 3.4, CLAMP_Z - 1.6, P, 20) + k.sideArc(ROD[0], ROD[1], 3.4, CLAMP_Z + 1.6, P, 20), { tone: "faint" }) });
  const screwF = G.frameAlong([ROD[0] + side[0] * Math.sqrt(3.4 ** 2 - 0.9 ** 2), ROD[1] + side[1] * Math.sqrt(3.4 ** 2 - 0.9 ** 2), CLAMP_Z], side);
  turned("stand.boss-screw", screwF, [[0, 0], [0, 0.9], [3, 0.9], [3, 2.2], [5.2, 2.2], [5.2, 0]], { tone: "mid" }, { extra: Ln(G.ribsOf(screwF, 3.2, 5, 2.2, 14, P, { least: 0.15 }), { tone: "faint" }) });
  // Arm: from the boss to the motor's clamp collar, rim on round at both ends.
  const a0 = Math.sqrt(3.4 ** 2 - 1.5 ** 2);
  const armF = G.frameAlong([ROD[0] + dir[0] * a0, ROD[1] + dir[1] * a0, CLAMP_Z], dir);
  const reach = Math.hypot(...ROD) - a0 - Math.sqrt((MOTOR_R + 1.6) ** 2 - 1.5 ** 2);
  turned("stand.arm", armF, [[0, 0], [0, 1.5], [reach, 1.5], [reach, 0]], { tone: "hi" });
  // Motor: chuck, clamp collar, finned body, end cap and a speed knob.
  const MF = vert(0, 0, 0);
  turned("stirrer.chuck", MF, [[GLAND[2] + 8, 0], [GLAND[2] + 8, 2.2], [GLAND[2] + 11, 2.8, 1], [MOTOR_Z[0] - 2, 3.4], [MOTOR_Z[0] - 2, 0]], { tone: "mid" }, { extra: Ln(k.knurl(0, 0, 3.1, GLAND[2] + 12, MOTOR_Z[0] - 3, 12, P), { tone: "faint" }) });
  turned("stirrer.nose", MF, [[MOTOR_Z[0] - 2, 0], [MOTOR_Z[0] - 2, 5.2], [MOTOR_Z[0], 6], [MOTOR_Z[0], 0]], { tone: "mid" });
  turned("stirrer.body", MF, [[MOTOR_Z[0], 0], [MOTOR_Z[0], MOTOR_R], [CLAMP_Z - 3, MOTOR_R], [CLAMP_Z - 3, MOTOR_R + 1.6], [CLAMP_Z + 3, MOTOR_R + 1.6], [CLAMP_Z + 3, MOTOR_R], [MOTOR_TOP - 3, MOTOR_R], [MOTOR_TOP - 3, 0]], { tone: "hi" }, { extra: k.fadedSvg(G.ribsOf(MF, MOTOR_Z[0] + 4, CLAMP_Z - 3, MOTOR_R, 28, P, { fade: [0.04, 0.42], seams: true }), { tone: "faint" }) + D([at(G.pointOf(MF, CLAMP_Z + 3, MOTOR_R + 0.8, Math.atan2(V[1], V[0])))], { size: 0.45 }) });
  turned("stirrer.cap", MF, [[MOTOR_TOP - 3, 0], [MOTOR_TOP - 3, MOTOR_R - 0.6], [MOTOR_TOP - 1, MOTOR_R - 1.6, 1], [MOTOR_TOP, MOTOR_R - 3, 1], [MOTOR_TOP, 0]], { tone: "mid" });
  cyl("stirrer.knob", 2.6, 2.6, 2.4, MOTOR_TOP, 2.6, { tone: "hi" }, { steps: 20, extra: Ln(k.knurl(2.6, 2.6, 2.4, MOTOR_TOP + 0.4, MOTOR_TOP + 2.2, 12, P), { tone: "faint" }) });
  // The shaft between the gland and the chuck: it turns, so it carries a mark that runs round.
  cyl("stirrer.shaft", 0, 0, 1, GLAND[2], 8, { tone: "hi" }, { steps: 16 });
}

// ── Circulator: a heating circulator that pumps warm water through the jacket ──────────────────────────
const CIRC = { x: -23, y: -110, w: 46, d: 40, r: 2 };
const CIRC_H = 44;
const CIRC_HEAD = 12;
function circulator() {
  const c = CIRC;
  const xF = c.x + c.w;            // the face toward the front-right
  const slot = (y0, y1, z) => k.pathOf([[xF + 0.01, y0, z], [xF + 0.01, y1, z], [xF + 0.01, y1, z + 1], [xF + 0.01, y0, z + 1]].map(at), true);
  let vents = "";
  for (let z = 6; z < 20; z += 2.6) vents += slot(c.y + 6, c.y + 20, z);
  box("circ.body", c, 0, CIRC_H, { tone: "mid", bevel: 0.8 }, {
    extra: `<path class="cstr-louvre" d="${vents}"/>` + Ln(vents, { tone: "lo" }) + Ln(k.sideSeam(c, 26, P, 3), { tone: "faint" }),
  });
  // Control head: display window, set-point knob and a power switch.
  const head = k.insetPlan(c, 1.5);
  const hx = head.x + head.w;
  const win = [[hx + 0.01, head.y + 6, CIRC_H + 3], [hx + 0.01, head.y + 24, CIRC_H + 3], [hx + 0.01, head.y + 24, CIRC_H + 9], [hx + 0.01, head.y + 6, CIRC_H + 9]];
  const tf = k.sideMatrix([hx + 0.05, head.y + 20.5, 0], CIRC_H + 4.6, P, "front");
  box("circ.head", head, CIRC_H, CIRC_HEAD, { tone: "hi", bevel: 0.6 }, {
    extra: `<path class="cstr-screen" d="${k.pathOf(win.map(at), true)}"/>` + Ln(k.pathOf(win.map(at), true), { tone: "lo" })
      + `<g data-part="circ-display">${k.faceTextSvg(tf, "37.0", { size: 4, tone: "hi", anchor: "start" }).replace("iso-face-text", "iso-face-text cstr-screen-text")}</g>`
      + `<circle data-part="circ-lamp" class="cstr-lamp" cx="${at([hx, head.y + 30, CIRC_H + 8])[0].toFixed(1)}" cy="${at([hx, head.y + 30, CIRC_H + 8])[1].toFixed(1)}" r="1.1"/>`,
  });
  cyl("circ.knob", head.x + head.w - 9, head.y + head.d - 9, 4, CIRC_H + CIRC_HEAD, 3, { tone: "mid" }, { steps: 28, extra: Ln(k.knurl(head.x + head.w - 9, head.y + head.d - 9, 4, CIRC_H + CIRC_HEAD + 0.5, CIRC_H + CIRC_HEAD + 2.6, 18, P), { tone: "faint" }) });
  cyl("circ.knob-cap", head.x + head.w - 9, head.y + head.d - 9, 2.4, CIRC_H + CIRC_HEAD + 3, 1, { tone: "hi" }, { steps: 20 });
  box("circ.switch", { x: head.x + 8, y: head.y + head.d - 12, w: 6, d: 4, r: 0.6 }, CIRC_H + CIRC_HEAD, 1.6, { tone: "lo", bevel: 0.3 });
  box("circ.plate", { x: head.x + 6, y: head.y + 5, w: 16, d: 9, r: 0.6 }, CIRC_H + CIRC_HEAD, 0.4, { tone: "lo", bevel: 0.1 }, {
    extra: Ln([0, 1, 2].map((i) => k.segment([head.x + 8, head.y + 7.5 + i * 2, CIRC_H + CIRC_HEAD + 0.4], [head.x + 20 - i * 3, head.y + 7.5 + i * 2, CIRC_H + CIRC_HEAD + 0.4], P)).join(""), { tone: "faint", free: true }),
  });
}

// Jacket hoses: water leaves the circulator low, enters the jacket at the bottom, leaves at the top and returns.
function hoses() {
  const yF = CIRC.y + CIRC.d;     // the circulator's face toward the vessel
  const nipple = (name, x, z) => {
    const F = G.frameOf([x, yF, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    turned(name, F, [[0, 0], [0, 2.6], [1.2, 2.6], [1.2, 1.6], [4, 1.6], [4.6, 1.9], [5.2, 1.6], [5.2, 0]], { tone: "mid" });
    return [x, yF + 5.2, z];
  };
  const barb = (name, t, z) => {
    const F = G.frameOf(polar(RO, t, z), [Math.cos(t), Math.sin(t), 0], [-Math.sin(t), Math.cos(t), 0], [0, 0, 1]);
    turned(name, F, [[-0.05, 0], [-0.05, 2.4], [1.2, 2.4], [1.2, 1.6], [4.4, 1.6], [5, 1.9], [5.6, 1.6], [5.6, 0]], { tone: "hi" });
    return polar(RO + 5.6, t, z);
  };
  const tIn = -96 * DEG, tOut = -84 * DEG, zIn = Z0 + 10, zOut = JTOP - 8;
  const inBarb = barb("jacket.in", tIn, zIn);
  const outBarb = barb("jacket.out", tOut, zOut);
  const flowFrom = nipple("circ.out", -8, zIn);
  const backTo = nipple("circ.in", 8, 26);
  const out = (b, t, d) => [b[0] + Math.cos(t) * d, b[1] + Math.sin(t) * d, b[2]];
  pipe("hose.flow", [flowFrom, [flowFrom[0], flowFrom[1] + 7, zIn], out(inBarb, tIn, 7), inBarb], 1.6, { tone: "mid", flanges: [false, false], bend: 3 });
  pipe("hose.return", [outBarb, out(outBarb, tOut, 8), [backTo[0], backTo[1] + 8, 26 + 12], [backTo[0], backTo[1] + 8, 26], backTo], 1.6, { tone: "mid", flanges: [false, false], bend: 3 });
}

// ── Feed: a bottle of feed on a magnetic stirrer, and a peristaltic pump on a timer ─────────────────────
const PUMP = { x: -54, y: 46, w: 24, d: 26, r: 1.6 };
const PUMP_H = 15;
const HEAD = { c: [PUMP.x + PUMP.w, PUMP.y + 13, 8.5], r: 6.4 };   // pump head on the face toward the front-right
const BOTTLE = { c: [-40, 94], r: 12.5, z: 7 };
const ROTOR = { c: [HEAD.c[0] + 2.6, HEAD.c[1], HEAD.c[2]], r: 4.2 };
function feedLine() {
  const p = PUMP, xF = p.x + p.w;
  // Pump body with a speed display on the side toward the viewer and a run lamp.
  const win = [[p.x + 4, p.y + p.d + 0.01, 9], [p.x + 14, p.y + p.d + 0.01, 9], [p.x + 14, p.y + p.d + 0.01, 13], [p.x + 4, p.y + p.d + 0.01, 13]];
  const tf = k.sideMatrix([p.x + 4.8, p.y + p.d + 0.05, 0], 12.1, P, "left");
  const lamp = at([p.x + 18, p.y + p.d, 11]);
  box("pump.body", p, 0, PUMP_H, { tone: "mid", bevel: 0.7 }, {
    extra: `<path class="cstr-screen" d="${k.pathOf(win.map(at), true)}"/>` + Ln(k.pathOf(win.map(at), true), { tone: "lo" })
      + `<g data-part="pump-display">${k.faceTextSvg(tf, "2.0", { size: 2.8, tone: "hi" }).replace("iso-face-text", "iso-face-text cstr-screen-text")}</g>`
      + `<circle data-part="pump-lamp" class="cstr-lamp" cx="${lamp[0].toFixed(1)}" cy="${lamp[1].toFixed(1)}" r="0.9"/>`
      + Ln(k.sideSeam(p, 4, P, 3), { tone: "faint" }),
  });
  // The head: a round housing on the face, its clear cover, and the rotor's live slot.
  const HF = G.frameOf([xF, HEAD.c[1], HEAD.c[2]], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  turned("pump.head", HF, [[0, 0], [0, HEAD.r], [2, HEAD.r], [2.6, HEAD.r - 0.6], [2.6, 0]], { tone: "hi" }, { extra: Ln(G.circleOf(HF, 2.6, HEAD.r - 1.4, P), { tone: "faint" }) + `<g data-part="rotor"></g>` });
  // Tube clips above the head: the tubing enters and leaves the head here.
  for (const [i, dy] of [[0, -3.6], [1, 3.6]]) {
    const F = G.frameOf([xF - 3, HEAD.c[1] + dy, PUMP_H], UP, [1, 0, 0], [0, 1, 0]);
    turned(`pump.port${i}`, F, [[0, 0], [0, 1.9], [1.2, 1.9], [1.2, 1.2], [3.6, 1.2], [4.1, 1.5], [4.6, 1.2], [4.6, 0]], { tone: "mid" });
  }
  // Magnetic stirrer and the feed bottle on it.
  const st = { x: BOTTLE.c[0] - 16, y: BOTTLE.c[1] - 15, w: 32, d: 30, r: 2.4 };
  box("feedstir.body", st, 0, BOTTLE.z, { tone: "mid", bevel: 0.7 }, { extra: Ln(k.planOutline(k.insetPlan(st, 3), BOTTLE.z, P), { tone: "faint" }) });
  const kx = st.x + st.w, ky = st.y + 7;
  const KF = G.frameOf([kx, ky, 3.5], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  turned("feedstir.knob", KF, [[0, 0], [0, 2.4], [2.4, 2.4], [2.4, 0]], { tone: "hi" }, { extra: Ln(G.ribsOf(KF, 0.3, 2.2, 2.4, 14, P, { least: 0.15 }), { tone: "faint" }) });
  const BF = vert(BOTTLE.c[0], BOTTLE.c[1], BOTTLE.z);
  turned("feed.bottle", BF, [[0, 0], [0, BOTTLE.r - 0.8], [0.8, BOTTLE.r, 1], [30, BOTTLE.r, 1], [33, BOTTLE.r - 1.6, 1], [36, 7.4, 1], [38, 5.6, 1], [40, 5.6], [40, 0]], { tone: "hi" }, { extra: Ln(G.arcOf(BF, 10, BOTTLE.r, P) + G.arcOf(BF, 20, BOTTLE.r, P), { tone: "faint" }) + `<g data-part="feed-level"></g>` });
  turned("feed.cap", BF, [[40, 0], [40, 6.4], [45, 6.4], [45, 0]], { tone: "mid" }, { extra: Ln(k.knurl(BOTTLE.c[0], BOTTLE.c[1], 6.4, BOTTLE.z + 40.6, BOTTLE.z + 44.4, 18, P), { tone: "faint" }) });
  // Feed tubing: from the cap's dip tube down into the pump, and from the pump up and over into the lid.
  const capTop = [BOTTLE.c[0] + 2.4, BOTTLE.c[1] - 2.4, BOTTLE.z + 45];
  const inPort = [xF - 3, HEAD.c[1] + 3.6, PUMP_H + 4.6];
  const outPort = [xF - 3, HEAD.c[1] - 3.6, PUMP_H + 4.6];
  pipe("feed.suck", [capTop, [capTop[0], capTop[1], capTop[2] + 12], [inPort[0], inPort[1], inPort[2] + 14], inPort], 0.9, { tone: "hi", flangeR: [1.8, 1.3], thick: 0.8, bolts: 0, bend: 7 });
  const fp = PORTS.feed, port = portTop(fp);
  const RISE = 124;
  pipe("feed.in", [outPort, [outPort[0], outPort[1], RISE], [port[0], port[1], RISE], port], 0.9, { tone: "hi", flangeR: [1.3, 1.8], thick: 0.8, bolts: 0, bend: 5 });
}

// ── Effluent: an overflow side arm through the jacket at the liquid line, into a bottle ────────────────
const EFF_T = -44 * DEG;
const EFF = { r: 58, R: 10.5 };
function effluent() {
  const [bx, by] = polar(EFF.r, EFF_T, 0);
  const BF = vert(bx, by, 0);
  turned("effluent.bottle", BF, [[0, 0], [0, EFF.R - 0.8], [0.8, EFF.R, 1], [26, EFF.R, 1], [29, EFF.R - 1.6, 1], [32, 6, 1], [34, 4.6, 1], [36, 4.6], [36, 0]], { tone: "hi" }, { extra: Ln(G.arcOf(BF, 8, EFF.R, P) + G.arcOf(BF, 16, EFF.R, P), { tone: "faint" }) + `<g data-part="eff-level"></g>` });
  turned("effluent.cap", BF, [[36, 0], [36, 5.4], [40, 5.4], [40, 0]], { tone: "mid" }, { extra: Ln(k.knurl(bx, by, 5.4, 36.6, 39.4, 16, P), { tone: "faint" }) });
  // The side arm: a glass nozzle fused into the vessel, then silicone tubing down to the cap.
  const z = LEVEL - 2;
  const arm = polar(RO, EFF_T, z);
  const F = G.frameOf(arm, [Math.cos(EFF_T), Math.sin(EFF_T), 0], [-Math.sin(EFF_T), Math.cos(EFF_T), 0], [0, 0, 1]);
  turned("effluent.arm", F, [[-0.05, 0], [-0.05, 2.6], [1.4, 2.6], [1.4, 1.5], [6, 1.5], [6.6, 1.8], [7.2, 1.5], [7.2, 0]], { tone: "hi" });
  const from = polar(RO + 7.2, EFF_T, z);
  pipe("effluent.drop", [from, polar(EFF.r, EFF_T, z), [bx, by, 40]], 1.1, { tone: "hi", flanges: [false, true], flangeR: 2.4, thick: 0.8, bolts: 0, bend: 4 });
}

// ── Gas: lid port, a drum gas meter, a 10 L sampling bag ───────────────────────────────────────────────
const METER = { x: 54, y: -70, w: 26, d: 22, r: 1.4 };
const METER_Z = 4;
const DRUM = { c: [METER.x + 4, METER.y + METER.d / 2, METER_Z + 13], r: 11, len: 18 };
const BAG = { x: 95, y: -99, w: 32, d: 26, r: 6 };
const BAG_H = 9;
function gasLine() {
  // Meter: a base, the drum housing turned along x, its dial face toward the front-right, inlet and outlet on top.
  box("meter.base", METER, 0, METER_Z, { tone: "lo", bevel: 0.5 }, { extra: D(k.corners(METER, 2).map(([x, y]) => at([x, y, METER_Z])), { size: 0.4 }) });
  const DF = G.frameOf(DRUM.c, [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  turned("meter.drum", DF, [[0, 0], [0, DRUM.r - 1], [0.8, DRUM.r], [DRUM.len - 2, DRUM.r], [DRUM.len - 2, DRUM.r + 0.6], [DRUM.len, DRUM.r + 0.6], [DRUM.len, 0]], { tone: "mid" }, { extra: Ln(G.arcOf(DF, 5, DRUM.r, P) + G.arcOf(DF, 10, DRUM.r, P), { tone: "faint" }) });
  // Dial: a ring of ticks, 10 mL apart, with a major tick every 50 mL, the needle's slot and the counter window.
  const face = DRUM.len;
  const tick = (i) => { const a = (i / 10) * 2 * Math.PI; const r0 = i % 5 ? DRUM.r - 2.4 : DRUM.r - 3.4; return k.pathOf([G.pointOf(DF, face + 0.01, r0, a), G.pointOf(DF, face + 0.01, DRUM.r - 1.4, a)].map(at)); };
  const ticks = Array.from({ length: 10 }, (_, i) => tick(i));
  const winY = [DRUM.c[1] - 4.6, DRUM.c[1] + 4.6], winZ = [DRUM.c[2] - 6.4, DRUM.c[2] - 3.4];
  const xF = DRUM.c[0] + face + 0.02;
  const win = [[xF, winY[0], winZ[0]], [xF, winY[1], winZ[0]], [xF, winY[1], winZ[1]], [xF, winY[0], winZ[1]]];
  const tf = k.sideMatrix([xF + 0.03, winY[1] - 0.4, 0], winZ[0] + 0.55, P, "front");
  put("meter.dial", [xF, DRUM.c[1], DRUM.c[2]], S(G.disc(face, face + 0.01, DRUM.r - 0.6, DF, P), { tone: "hi", flat: true })
    + Ln(ticks.filter((_, i) => i % 5).join(""), { tone: "lo" }) + Ln(ticks.filter((_, i) => !(i % 5)).join(""), { tone: "mid" })
    + `<path class="cstr-screen" d="${k.pathOf(win.map(at), true)}"/>` + Ln(k.pathOf(win.map(at), true), { tone: "lo" })
    + `<g data-part="meter-count">${k.faceTextSvg(tf, "0000.0 L", { size: 2.3, tone: "hi" }).replace("iso-face-text", "iso-face-text cstr-screen-text")}</g>`
    + `<g data-part="meter-needle"></g>`, [A.disc(DF, face, face + 0.01, DRUM.r - 0.6)]);
  // Saddle feet under the drum.
  for (const s of [3, DRUM.len - 5]) obox("meter.saddle", [DRUM.c[0] + s, DRUM.c[1]], [1, 0], 2, 12, METER_Z, DRUM.c[2] - METER_Z - DRUM.r, { tone: "mid", bevel: 0.2 });
  // Nipples on top of the drum: gas in toward the back, out toward the front.
  const nip = (name, s) => {
    const F = G.frameOf([DRUM.c[0] + s, DRUM.c[1], DRUM.c[2] + Math.sqrt(DRUM.r ** 2 - 2.1 ** 2)], UP, [1, 0, 0], [0, 1, 0]);
    turned(name, F, [[0, 0], [0, 2.1], [1.6, 2.1], [1.6, 1.2], [4.2, 1.2], [4.7, 1.5], [5.2, 1.2], [5.2, 0]], { tone: "hi" });
    return [DRUM.c[0] + s, DRUM.c[1], DRUM.c[2] + Math.sqrt(DRUM.r ** 2 - 2.1 ** 2) + 5.2];
  };
  const gin = nip("meter.in", 4), gout = nip("meter.out", 12);
  const gp = portTop(PORTS.gas);
  const RISE = 128;
  pipe("gas.tube", [gp, [gp[0], gp[1], RISE], [gin[0], gin[1], RISE], gin], 0.9, { tone: "hi", flangeR: [1.8, 1.3], thick: 0.8, bolts: 0, bend: 5 });
  // Bag: its fitting and valve on a block at the end toward the meter, the bag itself redrawn live as it fills.
  const fit = { x: BAG.x - 7, y: BAG.y + BAG.d / 2 - 3.5, w: 7, d: 7, r: 0.8 };
  box("bag.fitting", fit, 0, 5, { tone: "mid", bevel: 0.4 }, { extra: D([at([fit.x + 3.5, fit.y + 3.5, 5])], { size: 0.45 }) });
  const vF = G.frameOf([fit.x + 3.5, fit.y + 3.5, 5], UP, [1, 0, 0], [0, 1, 0]);
  turned("bag.valve", vF, [[0, 0], [0, 2.2], [3, 2.2], [3, 1.2], [6.4, 1.2], [6.9, 1.5], [7.4, 1.2], [7.4, 0]], { tone: "hi" }, { extra: Ln(G.ribsOf(vF, 0.2, 2.8, 2.2, 12, P, { least: 0.15 }), { tone: "faint" }) });
  const vTop = [fit.x + 3.5, fit.y + 3.5, 12.4];
  pipe("gas.bag", [gout, [gout[0], gout[1], gout[2] + 6], [vTop[0], vTop[1], gout[2] + 6], vTop], 0.9, { tone: "hi", flangeR: 1.3, thick: 0.8, bolts: 0, bend: 5 });
  put("bag", [BAG.x + BAG.w / 2, BAG.y + BAG.d / 2, BAG_H / 2], `<g data-part="bag"></g>`, [A.slab(BAG, 0, BAG_H, {}, 4)]);
}

// ── Assembly ────────────────────────────────────────────────────────────────
put("stand.plate", [0, 0, -PLATE_H / 2], bench(), [A.slab(PLATE, -PLATE_H, PLATE_H, {}, 8)], { key: -1e6 });
support();
put("vessel", [0, 0, 55], vessel(), [
  A.cylinder(0, 0, RO, Z0, JTOP - Z0), A.cylinder(0, 0, RI + GLASS, JTOP, FL[0] - JTOP), A.cylinder(0, 0, CLAMP[1], CLAMP[2], CLAMP[3] - CLAMP[2]),
  A.cylinder(0, 0, 3.2, LID[1], GLAND[2] - LID[1]),
]);
ports();
stirrer();
circulator();
hoses();
feedLine();
effluent();
gasLine();
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const body = wrapItems("lab", R.items);

export const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: [
  "A 5 litre bench-top CSTR, cut open: a jacketed glass vessel on a support ring, stirred by an overhead motor on a lab stand. Warm water from a heating circulator runs through the jacket. A peristaltic pump feeds it from a bottle; an overflow side arm sends effluent to a bottle; the gas runs through a drum gas meter into a sampling bag.",
  "Um CSTR de bancada de 5 litros, cortado ao meio: um reator de vidro encamisado sobre um anel de apoio, agitado por um motor de agitação mecânica num suporte universal. Água quente de um banho termostático circula pela camisa. Uma bomba peristáltica o alimenta a partir de um frasco; um braço de transbordo leva o efluente a um frasco; o gás passa por um medidor de tambor até uma bolsa de amostragem.",
][L], body });
export { R, P };
export const text = {
  title: ["Lab scale · 5 L", "Bancada · 5 L"][L],
  keys: [
    [{ mark: "dashed", label: "Dashes: what is flowing right now" }, { mark: "lit", label: "Needle: the gas meter, 100 mL a turn" }],
    [{ mark: "dashed", label: "Tracejado: o que está escoando agora" }, { mark: "lit", label: "Ponteiro: o medidor de gás, 100 mL por volta" }],
  ][L],
  caption: [
    "A 5 L jacketed glass CSTR run on the same feed, temperature and HRT as the farm tank, so it reaches the same share of B₀ and makes the same methane per litre of reactor, about 104 000 times less in all. A peristaltic pump feeds it four times a day; the circulator holds the jacket water at the set point; the overhead stirrer follows the same mixer setting; the drum meter counts the gas into a 10 L bag, which is emptied for analysis when full.",
    "Um CSTR de vidro encamisado de 5 L operado com a mesma alimentação, temperatura e TRH do tanque da fazenda: atinge a mesma fração do B₀ e produz o mesmo metano por litro de reator, cerca de 104 000 vezes menos no total. Uma bomba peristáltica o alimenta quatro vezes por dia; o banho segura a água da camisa na temperatura; o agitador segue o mesmo modo do agitador da fazenda; o medidor de tambor conta o gás até uma bolsa de 10 L, esvaziada para análise quando enche.",
  ][L],
};
export const data = {
  P, CUT, KEPT, RI, ZF, LEVEL, HUB_Z, BLADE_R, ROTOR, DRUM, BAG, BAG_H,
  feedBottle: { c: BOTTLE.c, r: BOTTLE.r, z: BOTTLE.z, top: BOTTLE.z + 30 }, effBottle: { c: polar(EFF.r, EFF_T, 0).slice(0, 2), r: EFF.R, z: 0, top: 26 },
  text: { bag: L ? "bolsa " : "bag ", emptied: L ? "bolsa esvaziada" : "bag emptied", run: L ? "BOMBA" : "RUN" },
};

export const live = String.raw`
function labLive(C, root, clock) {
  const P = C.P;
  const svg = root.querySelector("svg");
  const readout = root.querySelector("[data-readout]");
  const q = (s) => svg.querySelector(s);
  const qa = (s) => [...svg.querySelectorAll(s)];
  const parts = {
    impeller: q('[data-part="impeller"]'), bubbles: q('[data-part="bubbles"]'), swirl: q('[data-part="swirl"]'),
    scum: qa('[data-part="scum"]'), sediment: qa('[data-part="sediment"]'), jacket: qa('[data-part="jacket"]'),
    rotor: q('[data-part="rotor"]'), needle: q('[data-part="meter-needle"]'), count: q('[data-part="meter-count"] text'), bag: q('[data-part="bag"]'),
    circ: q('[data-part="circ-display"] text'), circLamp: q('[data-part="circ-lamp"]'), pump: q('[data-part="pump-display"] text'), pumpLamp: q('[data-part="pump-lamp"]'),
    feedLevel: q('[data-part="feed-level"]'), effLevel: q('[data-part="eff-level"]'),
  };
  const flows = {};
  qa("[data-flow-of]").forEach((el) => (flows[el.dataset.flowOf] ??= []).push(el));
  const setFlow = (names, on) => names.forEach((n) => (flows[n] || []).forEach((el) => el.classList.toggle("on", on)));
  const area = (r) => Math.PI * (r * 3) ** 2 / 1000;     // mL per mm of height, r in units of 3 mm
  // State: the jacket, the mixer, the gas counted (mL), the bag (mL), the two bottles (mL).
  const sim = { temp: DESIGN.temperature, heater: false, mixing: false, feeding: false, strat: 0.4, prop: 0, rotor: 0, gas: 0, bag: 2600, feed: 330, eff: 60, extra: 0, note: 0 };
  let plant = { ...DESIGN }, steadyNow = steady(plant, LAB_VOLUME), warmNow = steadyNow, gasRate = steadyNow.biogas * 1e6 / 24;   // mL / h
  const bubbles = Array.from({ length: 50 }, (_, i) => ({ face: i % 2, r: 2 + Math.random() * (C.RI - 4), z: C.ZF + Math.random() * (C.LEVEL - C.ZF), s: 0.5 + Math.random() * 0.7, live: Math.random() < 0.5 }));
  const polar3 = (r, t, z) => [r * Math.cos(t), r * Math.sin(t), z];
  const inWedge = (t) => { const a = ((t - C.CUT[0]) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI); return a > 0.08 && a < C.CUT[1] - C.CUT[0] - 0.08; };
  const solid = (paths, tone) => solidSvg(paths, { tone });
  function drawImpeller(angle) {
    // Four blades pitched at 45 degrees; only those in the open wedge show, the rest turn behind the cut faces.
    let d = "";
    for (let b = 0; b < 4; b++) {
      const a = angle + (b * Math.PI) / 2;
      if (!inWedge(a)) continue;
      const c = Math.cos(a), s = Math.sin(a), n = [-s, c];
      const pt = (r, w, dz) => iso([r * c + w * n[0], r * s + w * n[1], C.HUB_Z + dz], P);
      d += pathOf([pt(2.4, -1.6, -1.6), pt(C.BLADE_R, -1.6, -1.6), pt(C.BLADE_R, 1.6, 1.6), pt(2.4, 1.6, 1.6)], true);
    }
    parts.impeller.innerHTML = d ? '<path class="iso-fill" d="' + d + '"/><path class="iso-shade" data-shade="2" d="' + d + '"/><path class="iso-line" data-tone="hi" d="' + d + '"/>' : "";
  }
  function drawBubbles(dtH) {
    const rate = clamp(gasRate / 160, 0, 2.5);
    let html = "";
    for (const b of bubbles) {
      if (b.live) {
        b.z += dtH * 30 * b.s * (sim.mixing ? 1.3 : 1);
        if (b.z > C.LEVEL - 0.6) { b.live = Math.random() < rate * 0.6; b.z = C.ZF + 1 + Math.random() * 5; b.r = 2 + Math.random() * (C.RI - 4); }
      } else if (Math.random() < rate * dtH * 2) b.live = true;
      if (!b.live) continue;
      const p = iso(polar3(b.r, C.CUT[b.face], b.z), P);
      html += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (0.5 + 0.3 * b.s).toFixed(2) + '"/>';
    }
    parts.bubbles.innerHTML = html;
  }
  // A ring in the plane of a face along +x, centre c: (dy, dz) offsets.
  const onX = (c, x, pts) => pathOf(pts.map(([dy, dz]) => iso([x, c[1] + dy, c[2] + dz], P)), true);
  const circ = (r, n = 18) => Array.from({ length: n }, (_, i) => [r * Math.cos((i / n) * 2 * Math.PI), r * Math.sin((i / n) * 2 * Math.PI)]);
  function drawRotor() {
    const c = C.ROTOR.c, x = c[0] + 0.05;
    let d = onX(c, x, circ(1.4));
    for (let i = 0; i < 3; i++) {
      const a = sim.rotor + (i * 2 * Math.PI) / 3;
      const rc = [C.ROTOR.r * Math.cos(a), C.ROTOR.r * Math.sin(a)];
      d += onX(c, x, circ(1.25).map(([u, v]) => [rc[0] + u, rc[1] + v]));
    }
    const arms = [0, 1, 2].map((i) => { const a = sim.rotor + (i * 2 * Math.PI) / 3; return pathOf([iso([x, c[1] + 1.4 * Math.cos(a), c[2] + 1.4 * Math.sin(a)], P), iso([x, c[1] + (C.ROTOR.r - 1.25) * Math.cos(a), c[2] + (C.ROTOR.r - 1.25) * Math.sin(a)], P)]); }).join("");
    parts.rotor.innerHTML = '<path class="iso-fill" d="' + d + '"/><path class="iso-line" data-tone="mid" d="' + d + '"/><path class="iso-line" data-tone="lo" d="' + arms + '"/>';
  }
  function drawNeedle() {
    const x = C.DRUM.c[0] + C.DRUM.len + 0.06, c = C.DRUM.c;
    const a = (sim.gas / LAB.meterMl) * 2 * Math.PI;
    const tip = [Math.sin(a) * (C.DRUM.r - 2.2), Math.cos(a) * (C.DRUM.r - 2.2)], side = [Math.cos(a) * 0.5, -Math.sin(a) * 0.5];
    const d = onX(c, x, [[side[0], side[1]], tip, [-side[0], -side[1]], [-tip[0] * 0.22, -tip[1] * 0.22]]);
    parts.needle.innerHTML = '<path class="cstr-needle" d="' + d + '"/><path class="iso-fill" d="' + onX(c, x, circ(0.9, 12)) + '"/><path class="iso-line" data-tone="hi" d="' + onX(c, x, circ(0.9, 12)) + '"/>';
  }
  function drawBag() {
    const f = clamp(sim.bag / (LAB.bagL * 1000), 0, 1);
    const h = 0.8 + (C.BAG_H - 0.8) * Math.sqrt(f);
    const b = { ...C.BAG }, inset = (1 - Math.sqrt(f)) * 1.2;
    const plan = { x: b.x + inset, y: b.y + inset, w: b.w - 2 * inset, d: b.d - 2 * inset, r: b.r };
    parts.bag.innerHTML = solid(slabOf(plan, 0, h, P, 8, Math.min(h * 0.46, 3.6)), "mid") + '<path class="iso-line" data-tone="faint" d="' + sideSeam(plan, h * 0.5, P, 8) + '"/>';
  }
  function drawLevel(el, B, ml) {
    const h = clamp(ml / area(B.r) / 3, 0.3, B.top - 0.3);
    el.innerHTML = '<g class="cstr-slurry">' + solid(cylinder(B.c[0], B.c[1], B.r - 0.25, B.z + 0.8, h, P, 40), "lo") + "</g>";
  }
  const hhmm = (h) => String(Math.floor(h)).padStart(2, "0") + ":" + String(Math.floor((h * 60) % 60)).padStart(2, "0");
  function tick(dt, dtH, wall, calm, visible) {
    // The same kinetics as the farm, read at the liquid's own temperature.
    warmNow = steady({ ...plant, temperature: sim.temp }, LAB_VOLUME);
    gasRate += (warmNow.biogas * 1e6 / 24 - gasRate) * (1 - Math.exp(-dtH / 6));
    // Feeding: the timer runs the pump four times a day; the side arm lets the same volume out.
    const per = 24 / LAB.pulses, pulse = (steadyNow.q * 1e6) / LAB.pulses / LAB.pumpMlMin / 60;   // h
    sim.feeding = clock.hour % per < pulse || sim.extra > 0;
    if (sim.extra > 0) sim.extra -= dtH;
    if (sim.feeding) {
      const ml = LAB.pumpMlMin * 60 * dtH;
      sim.feed -= ml; sim.eff += ml;
      if (!calm) sim.rotor -= dt * 2 * Math.PI * 0.8;
    }
    if (sim.feed < 25) sim.feed = 360;        // a fresh bottle of feed
    if (sim.eff > 230) sim.eff = 20;          // the effluent is taken for analysis
    sim.mixing = clock.mixerMode === "on" || (clock.mixerMode === "auto" && clock.hour % 1 < 0.25);
    sim.strat = clamp(sim.strat + dtH * (sim.mixing ? -1.6 : 0.12), 0, 1);
    // 5 L warms and cools in an hour or two, where the farm tank takes days: the circulator cycles often.
    const set = plant.temperature;
    if (sim.temp < set - 0.1) sim.heater = true;
    if (sim.temp > set + 0.1 || clock.heaterFail) sim.heater = false;
    sim.temp += dtH * ((sim.heater ? 3.2 + 0.1 * Math.max(0, set - 22) : 0) - (sim.temp - 22) / (LAB.tempTau * 4));
    // Gas: through the meter into the bag; a full bag is taken away for analysis.
    const dGas = gasRate * dtH;
    sim.gas += dGas; sim.bag += dGas;
    if (sim.bag > LAB.bagL * 1000) { sim.bag = 0; sim.note = 6; }
    sim.note = Math.max(0, sim.note - dtH);
    if (!calm) sim.prop += sim.mixing ? dt * 2 * Math.PI * 1.2 : 0;
    if (!visible) return;
    drawImpeller(sim.prop);
    drawBubbles(dtH);
    drawRotor();
    drawNeedle();
    drawBag();
    drawLevel(parts.feedLevel, C.feedBottle, sim.feed);
    drawLevel(parts.effLevel, C.effBottle, sim.eff);
    parts.scum.forEach((el) => (el.style.opacity = (0.15 + 0.85 * sim.strat).toFixed(3)));
    parts.sediment.forEach((el) => (el.style.opacity = (0.15 + 0.85 * sim.strat).toFixed(3)));
    parts.jacket.forEach((el) => el.classList.toggle("on", sim.heater));
    parts.swirl.classList.toggle("on", sim.mixing);
    parts.circLamp.classList.toggle("on", sim.heater);
    parts.pumpLamp.classList.toggle("on", sim.feeding);
    setFlow(["feed.suck", "feed.in", "effluent.drop"], sim.feeding);
    setFlow(["gas.tube", "gas.bag"], gasRate > 1);
    setFlow(["hose.flow", "hose.return"], true);
    const circText = sim.temp.toFixed(1);
    if (parts.circ.textContent !== circText) parts.circ.textContent = circText;
    const pumpText = sim.feeding ? C.text.run : hhmm(per - (clock.hour % per));
    if (parts.pump.textContent !== pumpText) parts.pump.textContent = pumpText;
    const count = (sim.gas / 1000).toFixed(1).padStart(6, "0") + " L";
    if (parts.count.textContent !== count) parts.count.textContent = count;
    const text = clockText(clock.hour) + " · " + sim.temp.toFixed(1) + " °C · " + (sim.note > 0 ? C.text.emptied : C.text.bag + Math.round((sim.bag / (LAB.bagL * 1000)) * 100) + " %") + " · " + (sim.gas / 1000).toFixed(2).replace(".", LANG === "pt" ? "," : ".") + " L";
    if (readout.textContent !== text) readout.textContent = text;
  }
  const F = U.facts, n1 = (v) => fmt(v, 1), n0 = (v) => fmt(v, 0);
  const onOff = (on) => (on ? F.on : F.off);
  function facts(topic) {
    const per = 24 / LAB.pulses;
    switch (topic) {
      case "vessel": return [[F.volume, n1(LAB_VOLUME * 1000) + " L"], [F.hrt, n0(plant.hrt) + " d"], [F.temp, n1(sim.temp) + " °C"], [F.surface, fmt(surfacePerVolume(LAB.radius, LAB.level), 1) + " m²/m³"]];
      case "slurry": return [[F.temp, n1(sim.temp) + " °C"], [F.olr, fmt(steadyNow.olr, 2) + " kg VS/m³·d"], [F.share, n0(warmNow.share * 100) + " %"], [F.layers, n0(sim.strat * 100) + " %"]];
      case "jacket": return [[F.state, clock.heaterFail ? F.failed : sim.heater ? F.heating : F.off], [F.temp, n1(sim.temp) + " °C"], [F.set, n0(plant.temperature) + " °C"]];
      case "circ": return [[F.state, clock.heaterFail ? F.failed : onOff(sim.heater)], [F.temp, n1(sim.temp) + " °C"], [F.set, n0(plant.temperature) + " °C"]];
      case "stirrer": return [[F.state, onOff(sim.mixing)], [F.mode, U[clock.mixerMode]], [F.layers, n0(sim.strat * 100) + " %"]];
      case "lid": return [[F.temp, n1(sim.temp) + " °C"], [F.biogasIn, n1(gasRate) + " mL/h"]];
      case "feed": return [[F.state, sim.feeding ? F.pumping : F.waiting], [F.perDay, n0(steadyNow.q * 1e6) + " mL/d"], [F.pulse, n0((steadyNow.q * 1e6) / LAB.pulses / LAB.pumpMlMin) + " min · " + LAB.pulses + "×/d"], [F.bottle, n0(sim.feed) + " mL"]];
      case "effluent": return [[F.state, sim.feeding ? F.flowing : F.waiting], [F.perDay, n0(steadyNow.q * 1e6) + " mL/d"], [F.bottle, n0(sim.eff) + " mL"]];
      case "meter": return [[F.biogasIn, n1(gasRate) + " mL/h"], [F.counted, fmt(sim.gas / 1000, 2) + " L"], [F.turns, n0((gasRate * 24) / LAB.meterMl) + " " + U.turnsUnit]];
      case "bag": return [[F.stored, n0(sim.bag) + " mL · " + n0((sim.bag / (LAB.bagL * 1000)) * 100) + " %"], [F.capacity, n0(LAB.bagL) + " L"]];
    }
    return [];
  }
  return {
    sim,
    facts,
    now() { return { temp: sim.temp, gas: (gasRate * 24) / 1e6 / LAB_VOLUME }; },
    update(next) { plant = next; steadyNow = steady(plant, LAB_VOLUME); },
    feedNow() { sim.extra = (steadyNow.q * 1e6) / LAB.pulses / LAB.pumpMlMin / 60; },
    emptyBag() { sim.bag = 0; sim.note = 3; },
    tick,
  };
}
`;
