import type { SimConfig, SimIndicator } from './types';

export type LeverValues = Record<string, number>;
export const defaultLevers = (s: SimConfig): LeverValues => Object.fromEntries(s.levers.map(l => [l.id, l.default]));

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const round = (v: number, d: number) => { const m = 10 ** d; return Math.round(v * m) / m; };

/** value of indicator at the end of the horizon, given lever settings (full effect) */
export function steadyDelta(ind: SimIndicator, s: SimConfig, lv: LeverValues): number {
  let d = 0; for (const l of s.levers) d += (ind.effects[l.id] ?? 0) * (lv[l.id] - l.default); return d;
}
export function valueAt(ind: SimIndicator, s: SimConfig, lv: LeverValues, month: number): number {
  const ramp = 1 - Math.exp(-month / s.timeConstant);
  return round(clamp(ind.baseline + steadyDelta(ind, s, lv) * ramp, ind.min, ind.max), ind.decimals);
}
export interface SimResult {
  months: number[];
  series: Record<string, { baseline: number[]; scenario: number[] }>;
  final: Record<string, { baseline: number; scenario: number; change: number; pct: number; improved: boolean }>;
  cost: number;
  changed: boolean;
}
export function runSim(s: SimConfig, lv: LeverValues): SimResult {
  const months = Array.from({ length: s.horizonMonths + 1 }, (_, i) => i);
  const series: SimResult['series'] = {}; const final: SimResult['final'] = {};
  for (const ind of s.indicators) {
    const base = months.map(() => round(ind.baseline, ind.decimals));
    const scen = months.map(m => valueAt(ind, s, lv, m));
    series[ind.id] = { baseline: base, scenario: scen };
    const b = base[base.length - 1], v = scen[scen.length - 1], ch = round(v - b, ind.decimals + 1);
    final[ind.id] = { baseline: b, scenario: v, change: ch, pct: b ? round(100 * ch / b, 1) : 0, improved: ind.better === 'lower' ? ch < 0 : ch > 0 };
  }
  const cost = round(s.levers.reduce((a, l) => a + Math.max(0, lv[l.id] - l.default) * l.cost, 0), 1);
  const changed = s.levers.some(l => lv[l.id] !== l.default);
  return { months, series, final, cost, changed };
}
export function leverSummary(s: SimConfig, lv: LeverValues): string {
  const ch = s.levers.filter(l => lv[l.id] !== l.default).map(l => `${l.label}: ${lv[l.id]} ${l.unit}`);
  return ch.length ? ch.join('; ') : 'Baseline (no change)';
}
export interface Scenario { id: string; sim: string; name: string; levers: LeverValues; created: string; note?: string }
