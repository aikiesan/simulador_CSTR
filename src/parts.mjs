// The part helpers every figure uses, bound to its own camera P and recorder R: each one draws a part and records
// its true shape, so the audit measures order and clearances instead of trusting keys set by eye.
import { k, G, A, TB } from "./kit.mjs";

export function partsFor(P, R) {
  const V = G.viewOf(P);
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const put = (name, ref, svg, shapes = [], { bias = 0, key } = {}) => {
    const id = R.nameFor(name);
    return R.put({ name: id, at: ref, bias, key, svg, shapes: shapes.map((shape) => R.solid({ ...shape, name: shape.name ?? id })) });
  };
  const ringBox = ([cx, cy], [ux, uy], len, wid) => {
    const [vx, vy] = [-uy, ux];
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [cx + (ux * len * a) / 2 + (vx * wid * b) / 2, cy + (uy * len * a) / 2 + (vy * wid * b) / 2]);
  };
  function obox(name, c, u, len, wid, z, h, style = {}, { extra = "", bias = 0, owner } = {}) {
    const ring = ringBox(c, u, len, wid);
    put(name, [c[0], c[1], z + h / 2], S(k.extrude(ring, z, h, P, { bevel: style.bevel ?? 0.4 }), { tone: "mid", ...style }) + extra, [A.extruded(ring, z, h, { owner })], { bias });
    return ring;
  }
  function box(name, plan, z, h, style = {}, { extra = "", bias = 0, steps = 3, owner } = {}) {
    put(name, [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], S(k.slabOf(plan, z, h, P, steps, style.bevel ?? 0.5), { tone: "mid", ...style }) + extra, [A.slab(plan, z, h, { owner }, steps)], { bias });
  }
  function cyl(name, cx, cy, r, z, h, style = {}, { extra = "", bias = 0, owner, steps = 32 } = {}) {
    put(name, [cx, cy, z + h / 2], S(k.cylinder(cx, cy, r, z, h, P, steps, style.bevel ?? 0.4), { tone: "mid", ...style }) + extra, [A.cylinder(cx, cy, r, z, h, { owner })], { bias });
  }
  function turned(name, F, profile, style = {}, { extra = "", bias = 0, owner } = {}) {
    const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
    put(name, G.add3(F.o, G.mul3(F.a, mid)), S(G.solidOf(profile, F, P), { tone: "mid", ...style }) + extra, [A.solid(F, profile, { owner })], { bias });
  }
  function flange(name, centre, axis, r, thick, { owner, tone = "mid", bolts = 6 } = {}) {
    const F = G.frameAlong(centre, axis);
    const face = G.dot3(F.a, V) > 0 ? thick / 2 : -thick / 2;
    const dots = Math.abs(G.dot3(F.a, V)) > 0.15 && bolts ? D(G.dotsOf(F, face, r * 0.74, bolts, P, { all: true }), { size: 0.38 }) : "";
    put(name, centre, S(G.disc(-thick / 2, thick / 2, r, F, P), { tone }) + dots, [A.disc(F, -thick / 2, thick / 2, r, { owner })]);
  }
  // A pipe with end flanges, filleted bends, and an optional valve on a straight leg (body, bonnet and handwheel).
  // Its flow marks sit in <g data-flow-of="name">, so the page can show what is flowing.
  function pipe(name, control, r, { bend = 2.4, flanges = [true, true], flangeR = 1.7, tone = "hi", valve = null, side = [0, 0, 1], minBend = 2.4, thick: thickOf = null, bolts = 6, className = "" } = {}) {
    const line = G.fillet(control, Math.max(r * bend, minBend), 10, { P, tube: r });
    const total = G.pathLength(line);
    const collars = [];
    [[0, -1], [total, 1]].forEach(([along, sign], index) => {
      if (!flanges[index]) return;
      const thick = thickOf ?? Math.max(0.8, r * 0.5);
      const tangent = G.tangentAlong(line, along);
      const fr = [flangeR].flat()[Math.min(index, [flangeR].flat().length - 1)];
      collars.push({ centre: G.add3(G.pointAlong(line, along), G.mul3(tangent, (-sign * thick) / 2)), tangent, radius: r * fr, thick, gap: sign < 0 ? [0, thick] : [total - thick, total] });
    });
    const gaps = collars.map((c) => c.gap);
    let valveAt = null;
    if (valve !== null) {
      valveAt = valve * total;
      gaps.push([valveAt - r * 2.2, valveAt + r * 2.2]);
    }
    const frOf = (index) => [flangeR].flat()[Math.min(index, [flangeR].flat().length - 1)];
    R.route(name, line, r, { gaps, rims: flanges.map((f, index) => (f ? r * frOf(index) : r)) });
    TB.tubePieces(line, r, P, { maxLength: 14, spacing: Math.max(0.8, Math.min(2.4, r * 0.4)), gaps }).forEach((part, index) =>
      R.put({ name: `${name}:${index}`, at: part.mid, svg: (className ? `<g class="${className}">` : "") + TB.tubeSvg(part, { tone }) + (className ? "</g>" : "") + `<g data-flow-of="${name}">${Ln(k.pathOf(part.points.map(at)), { tone: "hi", flow: true, free: true, className: "cstr-flow" })}</g>`, route: name, chunk: index, shapes: [A.tube(part.points, part.radii, { name, owner: name })] }));
    collars.forEach((c, index) => flange(`${name}.flange${index}`, c.centre, c.tangent, c.radius, c.thick, { owner: name, bolts }));
    if (valveAt !== null) {
      const c = G.pointAlong(line, valveAt), tangent = G.tangentAlong(line, valveAt);
      const F = G.frameAlong(c, tangent);
      const len = r * 2.2;
      turned(`${name}.valve`, F, [[-len, 0], [-len, r * 1.7], [-len + 0.7, r * 1.7], [-len + 0.7, r * 1.35], [-0.9, r * 1.35], [-0.6, r * 1.9], [0.6, r * 1.9], [0.9, r * 1.35], [len - 0.7, r * 1.35], [len - 0.7, r * 1.7], [len, r * 1.7], [len, 0]], { tone: "mid" }, { owner: name });
      const up = G.unit3(side);
      const NF = G.frameAlong(c, up);
      const s0 = r * 1.9 - 0.3, s1 = s0 + r * 2.4;
      turned(`${name}.bonnet`, NF, [[s0, 0], [s0, r * 0.9], [s1, r * 0.6], [s1, 0]], { tone: "mid" }, { owner: name });
      const wheel = G.frameAlong(G.add3(c, G.mul3(up, s1)), up);
      put(`${name}.wheel`, G.add3(c, G.mul3(up, s1 + 0.5)), S(G.disc(0, 0.9, r * 1.7, wheel, P), { tone: "mid" }) + Ln(G.ribsOf(wheel, 0, 0.9, r * 1.7, 24, P, { least: 0.15 }), { tone: "lo" }), [A.disc(wheel, 0, 0.9, r * 1.7, { owner: name })]);
    }
    return line;
  }
  return { V, at, S, Ln, D, put, ringBox, obox, box, cyl, turned, flange, pipe };
}
