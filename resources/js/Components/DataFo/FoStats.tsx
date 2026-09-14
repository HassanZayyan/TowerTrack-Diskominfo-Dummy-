import React from 'react';
import { cn } from '@/lib/utils';

interface FoPoint {
  id: number;
  name: string;
  type: string;
  status: string;
  area: string;
}

interface FoRoute {
  id: number;
  name: string;
  status: string;
  area: string;
}

interface FoStatsProps {
  filteredPoints: FoPoint[];
  filteredRoutes: FoRoute[];
  selectedArea: string;
}

/**
 * Matches the tile pattern in DataTower/TowerStats.
 *
 * The three figures used to be brand red, dark green and blue — three different
 * hues for three counts that carry no status between them. "Total Jalur FO"
 * being green implied those routes were healthy, which the number does not say.
 * The figure is neutral now; the icon tile is the only accent.
 */
interface FoTileProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}

function FoTile({ label, value, icon }: FoTileProps) {
  return (
    <div className="tt-enter-up flex items-center gap-3 bg-card p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        <span className="truncate text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

const ICON = 'w-5 h-5';

export default function FoStats({ filteredPoints, filteredRoutes, selectedArea }: FoStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
      <FoTile
        label="Total Titik FO"
        value={filteredPoints.length.toLocaleString('id-ID')}
        icon={
          <svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />
      <FoTile
        label="Total Jalur FO"
        value={filteredRoutes.length.toLocaleString('id-ID')}
        icon={
          <svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3 6 3v8.764a1 1 0 01-.553.894L21 20l-6-3-6 3z" />
          </svg>
        }
      />
      <FoTile
        label="Area Aktif"
        value={<span className="text-xl">{selectedArea === 'all' ? 'Semua Area' : selectedArea}</span>}
        icon={
          <svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
    </div>
  );
}
