import { createElement as e, type ReactNode, type CSSProperties } from 'react'
import type { HybridBaseVariety } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { cx3 } from '@/lib/garden/bezier'
import { applyPlantFacing } from './facing-art'
import type { SeededPlantContext, SeededVariety } from './types'

export type HybridPlantPalette = Pick<ScenePalette, 'sil' | 'silSoft' | 'rim' | 'glow' | 'accent'>

const rimStroke = (C: HybridPlantPalette, rim: number) => ({
  stroke: C.rim,
  strokeOpacity: 0.5 * rim,
  strokeWidth: 0.6,
})

function seedInSoil(C: HybridPlantPalette, rim: number, r: () => number): ReactNode[] {
  return [
    e('path', {
      key: 'mound',
      d: 'M -10 1 Q -4 -5 4 -4 Q 10 -3 10 1 Q 0 3 -10 1 Z',
      fill: C.silSoft,
      stroke: C.rim,
      strokeOpacity: 0.35 * rim,
      strokeWidth: 0.5,
    }),
    e('path', {
      key: 'crack',
      d: 'M -3 0 Q 0 -2.2 3 0',
      stroke: C.rim,
      strokeOpacity: 0.25 * rim,
      strokeWidth: 0.45,
      fill: 'none',
    }),
    e('ellipse', {
      key: 'seed',
      cx: (r() - 0.5) * 1.2,
      cy: -3.6,
      rx: 2.1,
      ry: 2.8,
      fill: C.sil,
      ...rimStroke(C, rim),
    }),
    e('circle', { key: 'dew', cx: 1.2, cy: -4.8, r: 0.55, fill: C.glow, opacity: 0.75 }),
  ]
}

function sproutPair(C: HybridPlantPalette, rim: number, tipY: number, tipX: number): ReactNode[] {
  return [
    e('path', {
      key: 'c1',
      d: `M ${tipX} ${tipY} Q ${tipX - 5} ${tipY - 3}, ${tipX - 6} ${tipY - 7}`,
      stroke: C.sil,
      strokeWidth: 1.05,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'c2',
      d: `M ${tipX} ${tipY} Q ${tipX + 5} ${tipY - 3}, ${tipX + 6} ${tipY - 7}`,
      stroke: C.sil,
      strokeWidth: 1.05,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('ellipse', {
      key: 'l1',
      cx: tipX - 6,
      cy: tipY - 7.5,
      rx: 2.8,
      ry: 1.6,
      fill: C.silSoft,
      ...rimStroke(C, rim),
    }),
    e('ellipse', {
      key: 'l2',
      cx: tipX + 6,
      cy: tipY - 7.5,
      rx: 2.8,
      ry: 1.6,
      fill: C.silSoft,
      ...rimStroke(C, rim),
    }),
  ]
}

function buildFlower(s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean): ReactNode[] {
  const out: ReactNode[] = []
    const rimS = rimStroke(C, rim);
    if (s === 0) {
      return seedInSoil(C, rim, r);
    }
    const H = [0, 13, 25, 38, 50, 58, 66, 72][s];
    const lean = (r() - 0.5) * 12;
    const tipX = lean * 0.8, tipY = -H;
    const stemW = 1.1 + s * 0.28;
    const stem = `M 0 0 C ${lean * 0.2} ${-H * 0.35}, ${lean} ${-H * 0.7}, ${tipX} ${tipY}`;
    out.push(e('path', { key: 'st', d: stem, stroke: C.sil, strokeWidth: stemW, fill: 'none', strokeLinecap: 'round' }));
    out.push(e('path', { key: 'str', d: stem, stroke: C.rim, strokeWidth: stemW * 0.35, fill: 'none', strokeLinecap: 'round', opacity: 0.45 * rim, transform: 'translate(0.7 0)' }));
    const L = [0, 0, 2, 3, 4, 4, 5, 5][s];
    for (let i = 0; i < L; i++) {
      const t = 0.2 + 0.55 * (i / Math.max(1, L - 1));
      const side = i % 2 ? 1 : -1;
      const px = cx3(lean * 0.2, lean, tipX, t), py = -H * t;
      const ll = (7 + s * 1.5) * (1 - t * 0.45) * (0.8 + r() * 0.4);
      out.push(e('path', { key: 'l' + i, d: `M ${px} ${py} Q ${px + side * ll * 0.55} ${py - ll * 0.5}, ${px + side * ll} ${py - ll * 0.28} Q ${px + side * ll * 0.5} ${py + ll * 0.08}, ${px} ${py} Z`, fill: C.sil, ...rimS }));
    }
    if (s === 1) {
      out.push(...sproutPair(C, rim, tipY, tipX));
    }
    if (s === 2 || s === 3) {
      const tl = 5 + s * 1.6;
      out.push(e('path', { key: 't1', d: `M ${tipX} ${tipY} Q ${tipX - tl * 0.8} ${tipY - tl * 0.6}, ${tipX - tl} ${tipY - tl * 1.15} Q ${tipX - tl * 0.25} ${tipY - tl * 0.8}, ${tipX} ${tipY} Z`, fill: C.sil, ...rimS }));
      out.push(e('path', { key: 't2', d: `M ${tipX} ${tipY} Q ${tipX + tl * 0.8} ${tipY - tl * 0.6}, ${tipX + tl} ${tipY - tl * 1.15} Q ${tipX + tl * 0.25} ${tipY - tl * 0.8}, ${tipX} ${tipY} Z`, fill: C.sil, ...rimS }));
      out.push(e('path', { key: 't3', d: `M ${tipX} ${tipY} Q ${tipX - 1} ${tipY - tl}, ${tipX} ${tipY - tl * 1.35} Q ${tipX + 1} ${tipY - tl}, ${tipX} ${tipY} Z`, fill: C.sil, ...rimS }));
    }
    if (s === 4) {
      out.push(e('circle', { key: 'bg', cx: tipX, cy: tipY - 4, r: 7, fill: C.glow, opacity: 0.12, style: { filter: 'blur(3px)' } }));
      out.push(e('path', { key: 'bud', d: `M ${tipX} ${tipY + 2} C ${tipX - 4.6} ${tipY - 1}, ${tipX - 3.6} ${tipY - 9}, ${tipX} ${tipY - 11} C ${tipX + 3.6} ${tipY - 9}, ${tipX + 4.6} ${tipY - 1}, ${tipX} ${tipY + 2} Z`, fill: C.sil, stroke: C.rim, strokeOpacity: 0.6 * rim, strokeWidth: 0.7 }));
      out.push(e('path', { key: 'slit', d: `M ${tipX} ${tipY - 9.5} Q ${tipX + 0.6} ${tipY - 5}, ${tipX} ${tipY - 1}`, stroke: C.glow, strokeWidth: 0.9, fill: 'none', opacity: 0.75 }));
      out.push(e('path', { key: 'sp1', d: `M ${tipX - 4} ${tipY + 1} Q ${tipX - 6} ${tipY - 3}, ${tipX - 4.5} ${tipY - 6}`, stroke: C.sil, strokeWidth: 1.1, fill: 'none', strokeLinecap: 'round' }));
      out.push(e('path', { key: 'sp2', d: `M ${tipX + 4} ${tipY + 1} Q ${tipX + 6} ${tipY - 3}, ${tipX + 4.5} ${tipY - 6}`, stroke: C.sil, strokeWidth: 1.1, fill: 'none', strokeLinecap: 'round' }));
    }
    if (s === 5) {
      const pr = 7.5
      out.push(e('circle', { key: 'hg', cx: tipX, cy: tipY, r: pr * 1.6, fill: C.glow, opacity: 0.15, style: { filter: 'blur(4px)' } }));
      for (let i = 0; i < 6; i++) {
        const a = i * 60 + (r() - 0.5) * 10
        out.push(e('g', { key: 'bp' + i, transform: `translate(${tipX} ${tipY}) rotate(${a})` },
          e('path', {
            d: `M 0 0 Q ${-pr * 0.42} ${-pr * 0.62}, 0 ${-pr} Q ${pr * 0.42} ${-pr * 0.62}, 0 0 Z`,
            fill: C.sil,
            stroke: C.rim,
            strokeOpacity: 0.55 * rim,
            strokeWidth: 0.5,
            transform: 'rotate(-8)',
          })));
      }
      out.push(e('circle', { key: 'cc', cx: tipX, cy: tipY, r: 2.8, fill: C.glow, opacity: 0.95 }));
      out.push(e('circle', { key: 'ci', cx: tipX, cy: tipY, r: 1.15, fill: '#ffffff', opacity: 0.85 }));
    }
    if (s === 6) {
      const n = 11
      const pr = 9
      out.push(e('circle', { key: 'hg', cx: tipX, cy: tipY, r: pr * 1.8, fill: C.glow, opacity: 0.17, style: { filter: 'blur(4px)' } }));
      for (let i = 0; i < n; i++) {
        const a = i * 360 / n + (r() - 0.5) * 8
        out.push(e('g', { key: 'mp' + i, transform: `translate(${tipX} ${tipY}) rotate(${a})` },
          e('path', { d: `M 0 0 Q ${-pr * 0.36} ${-pr * 0.58}, 0 ${-pr} Q ${pr * 0.36} ${-pr * 0.58}, 0 0 Z`, fill: C.sil, stroke: C.rim, strokeOpacity: 0.5 * rim, strokeWidth: 0.5 })));
      }
      out.push(e('circle', { key: 'cc', cx: tipX, cy: tipY, r: 3.1, fill: C.glow, opacity: 0.95 }));
      const bx = lean * 0.5 + 14
      const by = -H * 0.62
      out.push(e('path', { key: 'sbs', d: `M ${lean * 0.55} ${-H * 0.5} Q ${bx - 4} ${by + 8}, ${bx} ${by}`, stroke: C.sil, strokeWidth: 1, fill: 'none', strokeLinecap: 'round' }));
      out.push(e('path', { key: 'sbb', d: `M ${bx} ${by + 1.5} C ${bx - 3} ${by - 0.5}, ${bx - 2.4} ${by - 5.5}, ${bx} ${by - 7} C ${bx + 2.4} ${by - 5.5}, ${bx + 3} ${by - 0.5}, ${bx} ${by + 1.5} Z`, fill: C.sil, stroke: C.rim, strokeOpacity: 0.5 * rim, strokeWidth: 0.5 }));
    }
    if (s === 7) {
      const n = 12
      const pr = 9.2
      for (let i = 0; i < n; i++) {
        const a = i * 360 / n + (r() - 0.5) * 10
        const droop = i % 2 === 0 ? 1.12 : 0.92
        out.push(e('g', { key: 'ep' + i, transform: `translate(${tipX} ${tipY - 2}) rotate(${a}) scale(1 ${droop})` },
          e('path', { d: `M 0 0 Q ${-pr * 0.34} ${-pr * 0.55}, 0 ${-pr * 0.95} Q ${pr * 0.34} ${-pr * 0.5}, 0 0 Z`, fill: C.silSoft, stroke: C.rim, strokeOpacity: 0.42 * rim, strokeWidth: 0.45, transform: 'rotate(6)' })));
      }
      out.push(e('circle', { key: 'cc', cx: tipX, cy: tipY - 1, r: 2.6, fill: C.glow, opacity: 0.85 }));
      for (let i = 0; i < 4; i++) {
        const sx = tipX + (i - 1.5) * 5.5
        const sy = tipY - pr - 4 - i * 1.2
        out.push(e('ellipse', { key: 'sd' + i, cx: sx, cy: sy, rx: 1.3, ry: 2.2, fill: C.silSoft, opacity: 0.9 }));
      }
      [[-1, 0.55], [1, 0.42]].forEach(([sd, f], j) => {
        const bx = tipX + sd * 17
        const by = -H * f - 8
        out.push(e('path', { key: 'e' + j + 's', d: `M ${lean * 0.4 * f} ${-H * f} Q ${bx - sd * 6} ${by + 12}, ${bx} ${by}`, stroke: C.sil, strokeWidth: 1.1, fill: 'none', strokeLinecap: 'round' }));
        out.push(e('circle', { key: 'e' + j + 'c', cx: bx, cy: by, r: 1.5, fill: C.glow, opacity: 0.75 }));
      })
      if (motion) for (let i = 0; i < 3; i++) {
        out.push(e('circle', { key: 'mt' + i, cx: tipX - 8 + i * 8, cy: tipY - 14 - i * 3, r: 0.9, fill: C.glow, opacity: 0.7, style: { animation: `mgMote ${3 + r() * 2}s ease-in-out ${r() * 2.5}s infinite` } }));
      }
    }
    return out;
  return out
}

function buildTree(s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean): ReactNode[] {
  const out: ReactNode[] = []
    if (s === 0) {
      return seedInSoil(C, rim, r);
    }
    if (s === 1) {
      out.push(e('path', { key: 'st', d: 'M 0 0 L 0 -10', stroke: C.sil, strokeWidth: 1.2, strokeLinecap: 'round' }));
      out.push(...sproutPair(C, rim, -10, 0));
      return out;
    }
    const H = [0, 15, 28, 42, 56, 68, 80, 90][s];
    const bw = 1.6 + s * 1.0, tw = Math.max(0.7, bw * 0.3);
    out.push(e('path', { key: 'tr', d: `M ${-bw} 0 C ${-bw * 0.7} ${-H * 0.4}, ${-tw * 1.4} ${-H * 0.72}, ${-tw} ${-H} L ${tw} ${-H} C ${tw * 1.4} ${-H * 0.72}, ${bw * 0.7} ${-H * 0.4}, ${bw} 0 Z`, fill: C.sil, stroke: C.rim, strokeOpacity: 0.4 * rim, strokeWidth: 0.6 }));
    if (s >= 4) {
      out.push(e('path', { key: 'r1', d: `M ${-bw} 0 Q ${-bw - 3.5} -1.5, ${-bw - 6} 0`, stroke: C.sil, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' }));
      out.push(e('path', { key: 'r2', d: `M ${bw} 0 Q ${bw + 3.5} -1.5, ${bw + 6} 0`, stroke: C.sil, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' }));
    }
    const nb = Math.min(2 + s, 7);
    if (s >= 2) for (let i = 0; i < nb; i++) {
      const f = 0.5 + 0.45 * (i / nb);
      const side = i % 2 ? 1 : -1;
      const y0 = -H * f;
      const len = H * 0.36 * (1.15 - f * 0.55) * (0.8 + r() * 0.4);
      out.push(e('path', { key: 'b' + i, d: `M 0 ${y0} Q ${side * len * 0.55} ${y0 - len * 0.4}, ${side * len} ${y0 - len * 0.72}`, stroke: C.sil, strokeWidth: Math.max(0.7, 2.4 - i * 0.25), fill: 'none', strokeLinecap: 'round' }));
    }
    if (s >= 2) {
      const bloomScale = s === 5 ? 0.88 : s === 6 ? 1.05 : s === 7 ? 1.12 : 1;
      const cw = (7 + s * 4.2) * bloomScale, ch = (5 + s * 3) * bloomScale;
      const blobs = 3 + s * 2;
      out.push(e('ellipse', { key: 'cb', cx: 0, cy: -H - ch * 0.35, rx: cw, ry: ch * 0.85, fill: C.sil }));
      for (let j = 0; j < blobs; j++) {
        const bx = (r() - 0.5) * cw * 1.7;
        const by = -H - r() * ch * 1.1 - 1;
        const rr = cw * 0.4 * (0.5 + r() * 0.8);
        out.push(e('circle', { key: 'cn' + j, cx: bx, cy: by, r: rr, fill: C.silSoft, opacity: 0.9 }));
      }
      out.push(e('ellipse', { key: 'ch', cx: -cw * 0.3, cy: -H - ch * 0.75, rx: cw * 0.45, ry: ch * 0.3, fill: C.rim, opacity: 0.08 + 0.1 * rim }));
      out.push(e('path', { key: 'crim', d: `M ${-cw * 0.85} ${-H - ch * 0.2} Q ${-cw * 0.4} ${-H - ch * 1.15}, ${cw * 0.35} ${-H - ch * 0.95}`, stroke: C.rim, strokeOpacity: 0.35 * rim, strokeWidth: 1, fill: 'none', strokeLinecap: 'round' }));
    }
    if (s === 7) {
      const cw = 7 + s * 4.2;
      [[-cw * 0.6, -H + 2], [cw * 0.5, -H - 2], [-cw * 0.15, -H + 5]].forEach(([mx, my], j) => {
        out.push(e('path', { key: 'ms' + j, d: `M ${mx} ${my} q 1.6 4 0 8 q -1.6 4 0.5 ${9 + j * 2}`, stroke: C.silSoft, strokeWidth: 1, fill: 'none', opacity: 0.85 }));
      });
      out.push(e('ellipse', { key: 'hollow', cx: tw * 0.4, cy: -H * 0.38, rx: 1.6, ry: 2.6, fill: C.glow, opacity: 0.5, style: motion ? { animation: 'mgPulse 3.4s ease-in-out infinite alternate' } : null }));
    }
    return out;
  return out
}

function buildSucculent(s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean): ReactNode[] {
  const out: ReactNode[] = []
    if (s === 0) {
      return seedInSoil(C, rim, r);
    }
    const LR = 5 + s * 2.4;
    const layers = [1, 1, 1, 2, 2, 3, 3, 4][s];
    const inner: ReactNode[] = [];
    for (let li = 0; li < layers; li++) {
      const ll = LR * (1 - li * 0.24);
      const n = Math.max(5, Math.round(6 + (s - li) * 1.4));
      for (let i = 0; i < n; i++) {
        const a = i * 360 / n + li * 19 + (r() - 0.5) * 8;
        inner.push(e('g', { key: li + '-' + i, transform: `rotate(${a})` },
          e('path', { d: `M 0 0 Q ${-ll * 0.3} ${-ll * 0.55}, 0 ${-ll} Q ${ll * 0.3} ${-ll * 0.55}, 0 0 Z`, fill: li % 2 ? C.silSoft : C.sil, stroke: C.rim, strokeOpacity: (0.3 + li * 0.1) * rim, strokeWidth: 0.5 })));
      }
    }
    inner.push(e('circle', { key: 'core', cx: 0, cy: 0, r: LR * 0.14, fill: C.glow, opacity: 0.55 }));
    out.push(e('g', { key: 'ros', transform: 'translate(0 -2) scale(1 0.62)' }, inner));
    if (s >= 6) {
      const SH = 26 + (s - 6) * 12;
      out.push(e('path', { key: 'spk', d: `M 0 -4 C 2 ${-SH * 0.4}, -1 ${-SH * 0.7}, 1.5 ${-SH}`, stroke: C.sil, strokeWidth: 1.2, fill: 'none', strokeLinecap: 'round' }));
      for (let i = 0; i < 4; i++) {
        out.push(e('circle', { key: 'bl' + i, cx: 1.5 + (i % 2 ? 3 : -3), cy: -SH + 2 + i * 3.4, r: 1.5, fill: C.sil, stroke: C.rim, strokeOpacity: 0.5 * rim, strokeWidth: 0.4 }));
        out.push(e('circle', { key: 'blg' + i, cx: 1.5 + (i % 2 ? 3 : -3), cy: -SH + 2 + i * 3.4, r: 0.7, fill: C.glow, opacity: 0.85 }));
      }
    }
    return out;
  return out
}

function buildVine(s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean): ReactNode[] {
  const out: ReactNode[] = []
    if (s === 0) {
      return seedInSoil(C, rim, r);
    }
    const H = [0, 12, 22, 34, 46, 56, 66, 74][s];
    out.push(e('path', { key: 'stake', d: `M 2 0 L 4 ${-H * 0.92}`, stroke: C.silSoft, strokeWidth: 1.5, strokeLinecap: 'round' }));
    if (s >= 4) out.push(e('path', { key: 'bar', d: `M ${4 - 7} ${-H * 0.6} L ${4 + 7} ${-H * 0.64}`, stroke: C.silSoft, strokeWidth: 1.1, strokeLinecap: 'round' }));
    const segs = 5 + s;
    const ph = r() * 6;
    let d = 'M 0 0', px = 0, py = 0;
    const pts: number[][] = [];
    for (let i = 1; i <= segs; i++) {
      const ny = -H * (i / segs);
      const nx = 3 + Math.sin(i * 1.75 + ph) * (2.5 + i * 0.45);
      const mx = (px + nx) / 2 + Math.sin(i * 2.4 + ph) * 2.6;
      d += ` Q ${mx} ${(py + ny) / 2}, ${nx} ${ny}`;
      pts.push([nx, ny]);
      px = nx; py = ny;
    }
    out.push(e('path', { key: 'vine', d, stroke: C.sil, strokeWidth: 1.3, fill: 'none', strokeLinecap: 'round' }));
    out.push(e('path', { key: 'viner', d, stroke: C.rim, strokeWidth: 0.4, fill: 'none', opacity: 0.4 * rim, transform: 'translate(0.5 0)' }));
    pts.forEach(([lx, ly], i) => {
      if (i % 2 === 0 && i < pts.length - 1) {
        const side = (i / 2) % 2 ? 1 : -1;
        const ls = 3.4 + s * 0.5;
        out.push(e('path', { key: 'lf' + i, d: `M ${lx} ${ly} Q ${lx + side * ls} ${ly - ls * 0.7}, ${lx + side * ls * 1.25} ${ly - ls * 0.1} Q ${lx + side * ls * 0.6} ${ly + ls * 0.45}, ${lx} ${ly} Z`, fill: C.sil, stroke: C.rim, strokeOpacity: 0.4 * rim, strokeWidth: 0.4 }));
      }
      if (s >= 5 && i % 3 === 1) {
        out.push(e('path', { key: 'fst' + i, d: `M ${lx} ${ly} q 0.5 2.5, 0 4.5`, stroke: C.sil, strokeWidth: 0.6, fill: 'none' }));
        out.push(e('path', { key: 'fb' + i, d: `M ${lx} ${ly + 4.5} C ${lx - 2} ${ly + 5.5}, ${lx - 1.6} ${ly + 8.5}, ${lx} ${ly + 9.5} C ${lx + 1.6} ${ly + 8.5}, ${lx + 2} ${ly + 5.5}, ${lx} ${ly + 4.5} Z`, fill: C.sil, stroke: C.rim, strokeOpacity: 0.45 * rim, strokeWidth: 0.4 }));
        out.push(e('circle', { key: 'fg' + i, cx: lx, cy: ly + 9.2, r: 0.9, fill: C.glow, opacity: 0.9, style: motion ? { animation: `mgPulse ${2.6 + r()}s ease-in-out infinite alternate` } : null }));
      }
    });
    if (s === 7) {
      const [tx, ty] = pts[pts.length - 1];
      const sp: string[] = [];
      const cxx = tx + 3, cyy = ty - 3;
      for (let a = -90; a <= 480; a += 30) {
        const rad = 4.2 * (1 - (a + 90) / 700);
        sp.push(`${cxx + rad * Math.cos(a * Math.PI / 180)} ${cyy + rad * Math.sin(a * Math.PI / 180)}`);
      }
      out.push(e('path', { key: 'tend', d: 'M ' + sp.join(' L '), stroke: C.sil, strokeWidth: 0.8, fill: 'none', strokeLinecap: 'round' }));
      let d2 = `M ${tx} ${ty}`;
      for (let i = 1; i <= 4; i++) {
        d2 += ` Q ${tx - 8 - i * 3} ${ty + i * 9 - 5}, ${tx - 6 - i * 3.5} ${ty + i * 10}`;
      }
      out.push(e('path', { key: 'casc', d: d2, stroke: C.sil, strokeWidth: 1, fill: 'none', strokeLinecap: 'round' }));
    }
    return out;
  return out
}

function buildHerb(s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean): ReactNode[] {
  const out: ReactNode[] = []
    if (s === 0) {
      return seedInSoil(C, rim, r);
    }
    const K = [0, 2, 3, 4, 5, 6, 7, 9][s];
    for (let i = 0; i < K; i++) {
      const ang = (K === 1 ? 0 : (-1 + 2 * i / (K - 1))) * 0.55;
      const hh = (10 + s * 6.5) * (0.72 + r() * 0.5);
      const tx = Math.sin(ang) * hh * 0.6;
      const d = `M 0 0 Q ${tx * 0.3} ${-hh * 0.55}, ${tx} ${-hh}`;
      out.push(e('path', { key: 's' + i, d, stroke: C.sil, strokeWidth: 0.9, fill: 'none', strokeLinecap: 'round' }));
      for (let j = 1; j <= 3; j++) {
        const t = j / 4;
        const lx = tx * t * 0.55, ly = -hh * t;
        const ln = 2.4 * (1 - t * 0.4);
        out.push(e('path', { key: 's' + i + 'l' + j, d: `M ${lx} ${ly} l ${-ln} ${-ln * 0.7} M ${lx} ${ly} l ${ln} ${-ln * 0.7}`, stroke: C.sil, strokeWidth: 0.55, fill: 'none', strokeLinecap: 'round' }));
      }
      if (s >= 5) {
        for (let j = 0; j < 4; j++) {
          out.push(e('circle', { key: 's' + i + 'h' + j, cx: tx + Math.cos(j * 1.7) * 1.8, cy: -hh - 1 + Math.sin(j * 1.9) * 1.8, r: 0.85, fill: C.silSoft }));
        }
        out.push(e('circle', { key: 's' + i + 'hg', cx: tx, cy: -hh - 1, r: 0.7, fill: C.glow, opacity: 0.55 }));
      }
    }
    return out;
  return out
}

function buildWildflower(s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean): ReactNode[] {
  const out: ReactNode[] = []
    if (s === 0) {
      return seedInSoil(C, rim, r);
    }
    const M = [0, 1, 2, 3, 5, 7, 9, 11][s];
    const spread = 3 + s * 3.1;
    for (let i = 0; i < s + 2; i++) {
      const gx = (r() - 0.5) * 2 * spread;
      const gl = 6 + r() * 8;
      const side = r() > 0.5 ? 1 : -1;
      out.push(e('path', { key: 'g' + i, d: `M ${gx} 0 Q ${gx + side * gl * 0.35} ${-gl * 0.6}, ${gx + side * gl * 0.7} ${-gl}`, stroke: C.silSoft, strokeWidth: 0.8, fill: 'none', strokeLinecap: 'round' }));
    }
    for (let i = 0; i < M; i++) {
      const bx = (r() - 0.5) * 2 * spread;
      const hh = 8 + r() * 9 + s * 1.4;
      const lean = (r() - 0.5) * 5;
      out.push(e('path', { key: 'f' + i + 's', d: `M ${bx} 0 Q ${bx + lean * 0.5} ${-hh * 0.55}, ${bx + lean} ${-hh}`, stroke: C.sil, strokeWidth: 0.8, fill: 'none', strokeLinecap: 'round' }));
      const hx = bx + lean, hy = -hh;
      const useAccent = r() > 0.6;
      for (let p = 0; p < 5; p++) {
        const a = p * 72 * Math.PI / 180;
        out.push(e('circle', { key: 'f' + i + 'p' + p, cx: hx + Math.cos(a) * 2, cy: hy + Math.sin(a) * 2, r: 1.35, fill: C.sil, stroke: C.rim, strokeOpacity: 0.4 * rim, strokeWidth: 0.3 }));
      }
      out.push(e('circle', { key: 'f' + i + 'c', cx: hx, cy: hy, r: 1.05, fill: useAccent ? C.accent : C.glow, opacity: 0.95 }));
    }
    return out;
  return out
}

function buildFern(s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean): ReactNode[] {
  const out: ReactNode[] = []
    if (s === 0) {
      return seedInSoil(C, rim, r);
    }
    const F = [0, 1, 2, 3, 4, 5, 6, 7][s];
    for (let f = 0; f < F; f++) {
      const dir = (F === 1 ? (r() > 0.5 ? 1 : -1) * 0.5 : -1 + 2 * f / (F - 1)) * 0.85;
      const len = (11 + s * 5.5) * (0.78 + r() * 0.42);
      if (s <= 1) {
        out.push(e('path', { key: 'fh' + f + 's', d: `M 0 0 Q ${dir * 2} -5, ${dir * 3.2} -9`, stroke: C.sil, strokeWidth: 1.2, fill: 'none', strokeLinecap: 'round' }));
        const cxx = dir * 3.8, cyy = -11.5;
        const sp: string[] = [];
        for (let a = -90; a <= 500; a += 26) {
          const rad = 3.1 * (1 - (a + 90) / 760);
          sp.push(`${cxx + rad * Math.cos(a * Math.PI / 180)} ${cyy + rad * Math.sin(a * Math.PI / 180)}`);
        }
        out.push(e('path', { key: 'fh' + f, d: 'M ' + sp.join(' L '), stroke: C.sil, strokeWidth: 1.1, fill: 'none', strokeLinecap: 'round' }));
        continue;
      }
      const p1x = dir * len * 0.3, p1y = -len * 0.78;
      const p2x = dir * len, p2y = -len * 0.92;
      out.push(e('path', { key: 'fr' + f, d: `M 0 0 Q ${p1x} ${p1y}, ${p2x} ${p2y}`, stroke: C.sil, strokeWidth: 0.9, fill: 'none', strokeLinecap: 'round' }));
      const nP = 9;
      for (let j = 2; j <= nP; j++) {
        const t = j / (nP + 1);
        const u = 1 - t;
        const qx = 2 * u * t * p1x + t * t * p2x;
        const qy = 2 * u * t * p1y + t * t * p2y;
        const dxx = 2 * u * (p1x - 0) + 2 * t * (p2x - p1x);
        const dyy = 2 * u * (p1y - 0) + 2 * t * (p2y - p1y);
        const dl = Math.hypot(dxx, dyy) || 1;
        const nx = -dyy / dl, ny = dxx / dl;
        const pl = len * 0.26 * (1 - t * 0.85);
        out.push(e('path', { key: 'fr' + f + 'p' + j, d: `M ${qx} ${qy} L ${qx + nx * pl - dxx / dl * pl * 0.3} ${qy + ny * pl - dyy / dl * pl * 0.3} M ${qx} ${qy} L ${qx - nx * pl - dxx / dl * pl * 0.3} ${qy - ny * pl - dyy / dl * pl * 0.3}`, stroke: C.sil, strokeWidth: 0.65, fill: 'none', strokeLinecap: 'round' }));
      }
      if (s === 7 && f === Math.floor(F / 2)) {
        out.push(e('path', { key: 'crl', d: `M ${p2x} ${p2y} q ${dir * 2.4} -2.4, ${dir * 1.4} -4.2 q ${-dir * 1.6} -1.4, ${-dir * 2.2} 0.2`, stroke: C.rim, strokeWidth: 0.7, fill: 'none', opacity: 0.7 * rim }));
      }
    }
    return out;
  return out
}

function buildMushroom(s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean): ReactNode[] {
  const out: ReactNode[] = []
    if (s === 0) {
      return seedInSoil(C, rim, r);
    }
    const members = ([[0, 0, 1], [-6.5, 0.5, 0.68], [6, 0.5, 0.8], [-11, 1, 0.5]] as [number, number, number][]).slice(0, [1, 1, 1, 2, 2, 3, 3, 4][s]);
    members.forEach(([mx, my, msc], mi) => {
      const capW = (4 + s * 1.15) * msc;
      const capH = capW * 0.72;
      const stemH = (4 + s * 1.5) * msc;
      const g: ReactNode[] = [];
      g.push(e('path', { key: 'stem', d: `M ${-capW * 0.28} 0 C ${-capW * 0.2} ${-stemH * 0.6}, ${-capW * 0.24} ${-stemH}, ${-capW * 0.3} ${-stemH} L ${capW * 0.3} ${-stemH} C ${capW * 0.24} ${-stemH}, ${capW * 0.2} ${-stemH * 0.6}, ${capW * 0.28} 0 Z`, fill: C.silSoft }));
      g.push(e('path', { key: 'gillglow', d: `M ${-capW * 0.82} ${-stemH + 0.4} Q 0 ${-stemH + capH * 0.5}, ${capW * 0.82} ${-stemH + 0.4}`, stroke: C.glow, strokeWidth: 1, fill: 'none', opacity: 0.8, style: motion ? { animation: `mgPulse ${2.8 + mi * 0.7}s ease-in-out infinite alternate` } : null }));
      g.push(e('ellipse', { key: 'under', cx: 0, cy: -stemH + capH * 0.2, rx: capW * 0.6, ry: capH * 0.28, fill: C.glow, opacity: 0.18, style: { filter: 'blur(2px)' } }));
      g.push(e('path', { key: 'cap', d: `M ${-capW} ${-stemH} Q 0 ${-stemH - capH * 2}, ${capW} ${-stemH} Q 0 ${-stemH + capH * 0.4}, ${-capW} ${-stemH} Z`, fill: C.sil, stroke: C.rim, strokeOpacity: 0.5 * rim, strokeWidth: 0.6 }));
      if (s >= 6) {
        g.push(e('circle', { key: 'sp1', cx: -capW * 0.34, cy: -stemH - capH * 0.62, r: 0.75 * msc, fill: C.rim, opacity: 0.35 }));
        g.push(e('circle', { key: 'sp2', cx: capW * 0.3, cy: -stemH - capH * 0.42, r: 0.6 * msc, fill: C.rim, opacity: 0.3 }));
      }
      out.push(e('g', { key: 'mu' + mi, transform: `translate(${mx} ${my})` }, g));
    });
    return out;
  return out
}

function buildLotus(s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean): ReactNode[] {
  const out: ReactNode[] = []
    const nPads = [1, 1, 2, 2, 3, 3, 3, 4][s];
    const padPos = [[0, 0, 1], [-13, 2, 0.75], [12, 2.5, 0.85], [-4, 4.5, 0.6]];
    for (let i = 0; i < nPads; i++) {
      const [px, py, psc] = padPos[i];
      const prx = (7 + s * 0.8) * psc;
      out.push(e('ellipse', { key: 'pad' + i, cx: px, cy: py, rx: prx, ry: prx * 0.3, fill: C.silSoft, stroke: C.rim, strokeOpacity: 0.35 * rim, strokeWidth: 0.5 }));
      out.push(e('path', { key: 'padn' + i, d: `M ${px} ${py} L ${px + prx * 0.85} ${py - prx * 0.18}`, stroke: C.sil, strokeWidth: 0.5, opacity: 0.6 }));
    }
    if (s >= 2 && s < 4) {
      out.push(e('path', { key: 'bud', d: 'M 0 -1 C -3 -3, -2.4 -8, 0 -9.5 C 2.4 -8, 3 -3, 0 -1 Z', fill: C.sil, stroke: C.rim, strokeOpacity: 0.55 * rim, strokeWidth: 0.6 }));
      out.push(e('path', { key: 'slit', d: 'M 0 -8.5 Q 0.5 -5, 0 -2', stroke: C.glow, strokeWidth: 0.7, fill: 'none', opacity: 0.7 }));
    }
    if (s >= 4) {
      const bh = 2 + (s - 4);
      out.push(e('circle', { key: 'bg', cx: 0, cy: -6 - bh, r: 8, fill: C.glow, opacity: 0.14, style: { filter: 'blur(3px)' } }));
      const petalsOuter = [-55, -28, 0, 28, 55];
      petalsOuter.forEach((a, i) => {
        out.push(e('g', { key: 'po' + i, transform: `translate(0 ${-1 - bh * 0.4}) rotate(${a})` },
          e('path', { d: `M 0 0 Q ${-3.2} ${-4.5}, 0 ${-9 - (s - 4)} Q ${3.2} ${-4.5}, 0 0 Z`, fill: C.sil, stroke: C.rim, strokeOpacity: 0.55 * rim, strokeWidth: 0.5 })));
      });
      [-24, 0, 24].forEach((a, i) => {
        out.push(e('g', { key: 'pi' + i, transform: `translate(0 ${-1.5 - bh * 0.4}) rotate(${a})` },
          e('path', { d: `M 0 0 Q ${-2.2} ${-3.4}, 0 ${-6.5 - (s - 4) * 0.7} Q ${2.2} ${-3.4}, 0 0 Z`, fill: C.silSoft, stroke: C.rim, strokeOpacity: 0.4 * rim, strokeWidth: 0.4 })));
      });
      out.push(e('circle', { key: 'core', cx: 0, cy: -4 - bh * 0.5, r: 1.3, fill: C.glow, opacity: 0.95 }));
    }
    return out;
  return out
}

const BUILDERS: Record<HybridBaseVariety, (s: number, r: () => number, C: HybridPlantPalette, rim: number, motion: boolean) => ReactNode[]> = {
  flower: buildFlower,
  tree: buildTree,
  succulent: buildSucculent,
  vine: buildVine,
  herb: buildHerb,
  wildflower: buildWildflower,
  fern: buildFern,
  mushroom: buildMushroom,
  lotus: buildLotus,
}

export function getSwayStyle(seedN: number, motion: boolean, big = false): CSSProperties | undefined {
  if (!motion) return undefined
  return {
    animation: `${big ? 'mgSway' : 'mgSwayB'} ${3.8 + (seedN % 17) / 4}s ease-in-out ${(seedN % 23) / 7}s infinite alternate`,
    transformBox: 'fill-box',
    transformOrigin: '50% 100%',
  }
}

export function buildSeededPlant(variety: SeededVariety, ctx: SeededPlantContext): ReactNode[]
export function buildSeededPlant(
  variety: HybridBaseVariety,
  s: number,
  r: () => number,
  C: HybridPlantPalette,
  rim: number,
  motion: boolean,
): ReactNode[]
export function buildSeededPlant(
  variety: HybridBaseVariety,
  ctxOrS: SeededPlantContext | number,
  r?: () => number,
  C?: HybridPlantPalette,
  rim?: number,
  motion?: boolean,
): ReactNode[] {
  if (typeof ctxOrS === 'object') {
    const ctx = ctxOrS
    const base = BUILDERS[variety](ctx.stageIndex, ctx.rng, ctx.palette, ctx.rimStrength, ctx.motion)
    const facing = ctx.facing ?? 'front'
    return applyPlantFacing(
      variety,
      facing,
      base,
      ctx.palette,
      ctx.rimStrength,
      ctx.stageIndex,
      ctx.rimFromLeft ?? true,
    )
  }
  return BUILDERS[variety](ctxOrS, r!, C!, rim!, motion!)
}
