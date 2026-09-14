<?php

namespace App\Http\Controllers;

use App\Models\FoRoute;
use App\Models\Owner;
use App\Models\Tower;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    /**
     * The public front door.
     *
     * `/` used to be a 302 into /data-tower, so the application had no page of
     * its own — a resident arriving from a search result landed in a filter
     * table with no explanation of what the site was for.
     *
     * WHAT GETS SENT, AND WHAT DELIBERATELY DOES NOT.
     *
     * Four aggregate counts, and one positional array of map points. NOT the
     * tower table: the landing visual needs position, height and operator, and
     * every other column on a tower record — permit numbers, addresses, SAP
     * ids — is either irrelevant to a dot on a map or something a public
     * landing page has no business broadcasting.
     *
     * The points are arrays, not objects. `[-7.13915,110.40502,42,1]` against
     * `{"latitude":-7.13915,"longitude":110.40502,...}` is roughly a third of
     * the bytes once you multiply by a few hundred rows, and the shape is
     * documented in one place at each end rather than inferred from key names.
     */
    public function index(): Response
    {
        // Coordinates carry the visualisation, so the filter has to be the
        // strict one. `whereNotNull` alone would let a 0/0 row through, and
        // Null Island is off the coast of Ghana — one such row would blow the
        // map's bounding box out to half the planet. This mirrors the guard
        // TowerController::index already applies to its coordinate filter.
        $located = Tower::query()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('latitude', '!=', 0)
            ->where('longitude', '!=', 0)
            ->with(['owners:id,name'])
            ->get(['id', 'latitude', 'longitude', 'tinggi_menara']);

        // A tower can have more than one operator (the tower_owners pivot
        // allows it). Colour needs exactly one, and the rest of the app already
        // answers this question the same way: the first related owner wins.
        $primaryOwner = $located->map(fn ($t) => $t->owners->first()?->name)->filter();

        // The categorical palette has a hard cap of five (see the --data-*
        // block in app.css: five hues is the most that stays distinguishable
        // under deuteranopia and protanopia). There are more operators than
        // that, so the five biggest get a colour each and the tail becomes one
        // honest "Lainnya" bucket rather than a sixth hue nobody can name.
        $topOwners = $primaryOwner->countBy()->sortDesc()->take(5)->keys()->values();
        $ownerIndex = $topOwners->flip();

        // The tail bucket is needed in two cases, not one: there are operators
        // beyond the top five, OR some located tower has no operator recorded
        // at all. Deriving it only from the first case would leave an
        // owner-less tower pointing at whichever operator happened to be fifth.
        $needsTail = $primaryOwner->unique()->count() > $topOwners->count()
            || $primaryOwner->count() < $located->count();

        $legend = $topOwners->all();
        if ($needsTail) {
            $legend[] = 'Lainnya';
        }

        $fallbackIndex = $needsTail ? $topOwners->count() : 0;

        return Inertia::render('Landing/Index', [
            'stats' => [
                'totalTowers' => Tower::count(),
                'activeTowers' => Tower::where('status_ijin', 'Aktif')->count(),
                // `kecamatan` is populated by App\Support\KecamatanSemarang.
                // Counting distinct on a nullable column would count NULL as a
                // value on some drivers, hence the explicit whereNotNull.
                'kecamatanCount' => Tower::whereNotNull('kecamatan')->distinct()->count('kecamatan'),
                'operatorCount' => Owner::whereHas('towers')->count(),
                'foRouteCount' => FoRoute::count(),
            ],

            // [latitude, longitude, height in metres, owner index into `owners`]
            //
            // Five decimal places is about one metre. More than that is noise
            // no screen can draw, and it is also more precision about physical
            // infrastructure than a public page needs to publish.
            'towerPoints' => $located->map(function ($t) use ($ownerIndex, $fallbackIndex) {
                $name = $t->owners->first()?->name;

                return [
                    round((float) $t->latitude, 5),
                    round((float) $t->longitude, 5),
                    (int) round((float) ($t->tinggi_menara ?? 0)),
                    $name !== null && $ownerIndex->has($name)
                        ? $ownerIndex->get($name)
                        : $fallbackIndex,
                ];
            })->values(),

            'owners' => $legend,
        ]);
    }
}
