'use client';
import { useMemo } from 'react';
import { DISTRICTS, STATES, REGIONS, colorFor, layerById, layerRange, regionById, fmt, textOn, districtsOf, type Region } from '@/lib/geo';

export interface Tile { id: string; label: string; sub?: string; x: number; y: number; value: number; color: string; text: string; title: string }
export const CELL = 70, GAP = 5;

export function buildTiles(scope: string, layer: string): { tiles: Tile[]; cols: number; rows: number; w: number; h: number; range: [number, number]; regions: Region[] } {
  const def = layerById(layer)!;
  const isState = scope === 'IN';
  const regions = isState ? REGIONS.filter(r => r.level === 'state') : districtsOf(scope);
  const range = layerRange(layer, regions);
  const tiles: Tile[] = regions.map(r => {
    const pos = isState ? STATES.find(s => s.code === r.id)! : DISTRICTS.find(d => d.id === r.id)!;
    const color = colorFor(layer, r.values[layer], range);
    return { id: r.id, label: isState ? r.id : r.name.replace('Thiruvananthapuram', 'Thiruvanan.').replace('Chh. Sambhajinagar', 'Sambhajinagar').replace('Gautam Buddh Nagar', 'G.B. Nagar').replace('Mumbai Suburban', 'Mumbai Sub.'), sub: fmt(layer, r.values[layer]).replace(' days', 'd').replace(' / 10k', ''), x: pos.x, y: pos.y, value: r.values[layer], color, text: textOn(color), title: `${r.name}: ${fmt(layer, r.values[layer])} (${def.label})` };
  });
  const cols = Math.max(...tiles.map(t => t.x)) + 1, rows = Math.max(...tiles.map(t => t.y)) + 1;
  return { tiles, cols, rows, w: cols * (CELL + GAP) + GAP, h: rows * (CELL + GAP) + GAP, range, regions };
}

export function TileMap({ scope, layer, selected, onSelect, onOpen, compact = false, ariaLabel }: { scope: string; layer: string; selected?: string | null; onSelect?: (id: string) => void; onOpen?: (id: string) => void; compact?: boolean; ariaLabel?: string }) {
  const { tiles, w, h } = useMemo(() => buildTiles(scope, layer), [scope, layer]);
  const wide = scope !== 'IN';
  return <svg viewBox={`0 0 ${w} ${h}`} role="group" aria-label={ariaLabel ?? `Schematic map of ${scope === 'IN' ? 'India states and union territories' : regionById(scope)?.name + ' districts'}`} style={{ maxWidth: compact ? 420 : undefined }}>
    {tiles.map(t => { const x = GAP + t.x * (CELL + GAP), y = GAP + t.y * (CELL + GAP); const sel = selected === t.id;
      return <g key={t.id} className="tile" transform={`translate(${x},${y})`} role="button" tabIndex={0} aria-label={t.title} aria-pressed={sel}
        onClick={() => onSelect?.(t.id)} onDoubleClick={() => onOpen?.(t.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(t.id); } }}>
        <title>{t.title}</title>
        <rect width={CELL} height={CELL} rx={8} fill={t.color} stroke="rgba(0,0,0,.18)" />
        <text x={CELL / 2} y={compact ? CELL / 2 + 4 : CELL / 2 - 4} textAnchor="middle" fontSize={wide ? 11 : 15} fontWeight={700} fill={t.text}>{t.label}</text>
        {!compact && <text x={CELL / 2} y={CELL / 2 + 14} textAnchor="middle" fontSize={11} fill={t.text} opacity={.9}>{t.sub}</text>}
        {sel && <rect className="sel-ring" x={-2} y={-2} width={CELL + 4} height={CELL + 4} rx={10} />}
      </g>; })}
  </svg>;
}

export function Legend({ layer }: { layer: string }) {
  const def = layerById(layer)!; const stops = [0, .33, .66, 1];
  const css = `linear-gradient(90deg, ${stops.map(s => colorFor(layer, s * 100, [0, 100])).join(',')})`;
  return <div className="legend" aria-label={`Legend: ${def.read}`}><span>{def.low}</span><div className="ramp" style={{ background: css }} /><span>{def.high}</span><span style={{ marginLeft: 8 }}>{def.read}</span></div>;
}
