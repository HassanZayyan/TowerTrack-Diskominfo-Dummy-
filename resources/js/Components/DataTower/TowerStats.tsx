import React from 'react';
import { cn } from '@/lib/utils';

interface Tower {
  id: number;
  site_name: string;
  status?: string;
  owner?: string;
}

interface TowerStatsProps {
  total: number;
  towers: Tower[];
  mapMarkersCount: number;
  ownerFilter: string;
  totalActiveTowers: number; // Total active towers from backend
}

/**
 * Stat tiles, rebuilt in the shadcn register.
 *
 * Only "Menara Aktif" gets a coloured dot, because only that tile reports a
 * state. With a red brand, a red dot beside a plain count reads as an alarm.
 *
 * Gone: the 4px coloured left stripe, `shadow` lifting to `shadow-xl`, and
 * `hover:scale-105 hover:-translate-y-1` on a non-interactive card — a tile
 * that grows when you point at it reads as clickable when it is not.
 *
 * The figure is `text-foreground` rather than brand-coloured. A number is not
 * a status, so colouring it spends emphasis without encoding anything; the
 * small accent dot carries the category instead, and the number stays maximally
 * legible. `tabular-nums` keeps the three tiles' digits on a shared rhythm.
 */
interface StatTileProps {
  label: string;
  value: number;
  accent: string;
}

function StatTile({ label, value, accent }: StatTileProps) {
  return (
    <div className="tt-enter-up flex items-baseline gap-3 bg-card p-4">
      <span className="text-3xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
        {value.toLocaleString('id-ID')}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', accent)} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
    </div>
  );
}

export default function TowerStats({ total, mapMarkersCount, ownerFilter, totalActiveTowers }: TowerStatsProps) {
  // Use totalActiveTowers from backend instead of calculating from paginated towers
  const activeCount = totalActiveTowers;

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
      <StatTile label="Total Menara" value={total} accent="bg-border-strong" />
      <StatTile label="Menara Aktif" value={activeCount} accent="bg-success" />
      <StatTile
        label={ownerFilter === 'all' ? 'Menara di Peta' : `Menara ${ownerFilter}`}
        value={mapMarkersCount}
        accent="bg-border-strong"
      />
    </div>
  );
}
