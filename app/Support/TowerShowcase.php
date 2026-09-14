<?php

namespace App\Support;

use App\Models\Tower;

/**
 * The tower positions the auth screens draw their regency model from.
 *
 * WHY THIS IS NOT LandingController's PAYLOAD.
 *
 * LandingController sends four aggregate counts, an owner legend and a colour
 * index per tower, because the landing map is a legend-bearing data graphic. The
 * auth panel is not: it is one shape, seen from an angle, with masts standing on
 * it. It needs position and height and nothing else, so it asks for nothing
 * else — no operator join, no permit fields, no addresses. A login page is the
 * single most-requested URL in any application and the one most often hit by
 * things that are not people; whatever it queries, it queries all day.
 *
 * WHY REAL COORDINATES AT ALL.
 *
 * Decoration invented for the occasion would be cheaper still. But the shape
 * being drawn is the regency this office administers, and the masts on it are
 * the ones it keeps a register of — the panel says what the application is for
 * before the reader has typed anything. That only holds if the masts are real.
 */
final class TowerShowcase
{
    /**
     * The cap is a byte guard, not a selection rule.
     *
     * At the register's present size every located tower is returned, and 400 of
     * them is about 12KB of JSON. The limit exists so that an import an order of
     * magnitude larger cannot quietly turn the login page into a 200KB document
     * for the sake of a drawing whose masts would be a pixel apart anyway.
     */
    private const MAX_POINTS = 400;

    /**
     * @return array{points: list<array{0: float, 1: float, 2: int}>, total: int}
     */
    public static function panel(): array
    {
        // The strict coordinate guard, same as LandingController and
        // TowerController: `whereNotNull` alone lets a 0/0 row through, and Null
        // Island is off the coast of Ghana. One such row would stretch the
        // model's bounding box across the Atlantic and shrink the regency to a
        // speck. The composite (latitude, longitude) index on `towers` serves
        // exactly this predicate.
        $located = Tower::query()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('latitude', '!=', 0)
            ->where('longitude', '!=', 0)
            ->limit(self::MAX_POINTS)
            ->get(['latitude', 'longitude', 'tinggi_menara']);

        return [
            // [latitude, longitude, height in metres] — five decimals is about
            // one metre, which is finer than any screen can draw and as much
            // precision about physical infrastructure as a public page needs.
            'points' => $located->map(fn ($t) => [
                round((float) $t->latitude, 5),
                round((float) $t->longitude, 5),
                (int) round((float) ($t->tinggi_menara ?? 0)),
            ])->values()->all(),

            // Counted rather than derived from `points`, because the cap above
            // and the coordinate guard both hold rows back: a register with
            // 900 towers, 60 of them never surveyed, must still say 900.
            'total' => Tower::count(),
        ];
    }
}
