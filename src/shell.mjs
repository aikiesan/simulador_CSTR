// A spherical-cap membrane over part of a circle, as facets painted back to front.
// Runs in Node (build) and in the page (the import line is stripped and the kit is already in scope).
import { iso, cameraOf, pathOf } from "__KIT__";

// The kit's light, bucketed into its four shades the way extrude buckets its sides.
const shadeOf = (score) => Math.min(3, Math.max(0, Math.floor(((score + 1) / 2) * 4)));

// Rim radius a at height zr, rising h at the axis; angles in radians, from < to.
export function capAt(a, zr, h) {
  const rs = (a * a + h * h) / (2 * h);
  const zc = zr + h - rs;
  return { a, zr, h, rs, zc, z: (r) => zc + Math.sqrt(Math.max(0, rs * rs - r * r)) };
}

export function shellSvg(cap, from, to, P, { nTheta = 28, nRing = 7, under = "cstr-under", split = null } = {}) {
  const { sinA, cosA, sinE, cosE } = cameraOf(P);
  const V = [cosA * cosE, sinA * cosE, sinE];
  const L = (() => { const l = [-sinA, cosA, 1.2]; const n = Math.hypot(...l); return l.map((v) => v / n); })();
  const pt = (r, t) => [r * Math.cos(t), r * Math.sin(t), cap.z(r)];
  const rings = Array.from({ length: nRing + 1 }, (_, j) => (cap.a * Math.sqrt(j / nRing)));
  const thetas = Array.from({ length: nTheta + 1 }, (_, i) => from + ((to - from) * i) / nTheta);
  const facets = [];
  const side = [];
  for (let i = 0; i < nTheta; i++) {
    side.push([]);
    for (let j = 0; j < nRing; j++) {
      const corners = [pt(rings[j], thetas[i]), pt(rings[j + 1], thetas[i]), pt(rings[j + 1], thetas[i + 1]), pt(rings[j], thetas[i + 1])];
      const mid = pt((rings[j] + rings[j + 1]) / 2, (thetas[i] + thetas[i + 1]) / 2);
      const n = [mid[0], mid[1], mid[2] - cap.zc].map((v) => v / cap.rs);
      const facing = n[0] * V[0] + n[1] * V[1] + n[2] * V[2];
      const outer = facing >= 0;
      const lit = (outer ? 1 : -1) * (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
      side[i].push(outer);
      facets.push({ d: pathOf(corners.map((p) => iso(p, P)), true), depth: mid[0] * V[0] + mid[1] * V[1] + mid[2] * V[2], cls: outer ? "" : under, shade: shadeOf(lit), mid });
    }
  }
  facets.sort((p, q) => p.depth - q.depth);
  // Consecutive facets of one tone share a path.
  const groups = { far: [], near: [] };
  for (const f of facets) {
    const bin = split && f.depth > split ? groups.near : groups.far;
    const last = bin[bin.length - 1];
    if (last && last.cls === f.cls && last.shade === f.shade) last.d += f.d;
    else bin.push({ cls: f.cls, shade: f.shade, d: f.d });
  }
  const paint = (bin) => bin.map((g) => `<path class="iso-shade${g.cls ? " " + g.cls : ""}" data-shade="${g.shade}" d="${g.d}"/>`).join("");
  // Edges: the rim, the two cut meridians, and the silhouette where a facet turns from outer to inner side.
  const meridian = (t) => rings.map((r) => iso(pt(r, t), P));
  const rim = thetas.map((t) => iso(pt(cap.a, t), P));
  const cuts = pathOf(meridian(from)) + pathOf(meridian(to));
  const edges = pathOf(rim);
  return { far: paint(groups.far), near: paint(groups.near), edges, cuts };
}
