<?php

namespace App\Support;

/**
 * The 19 kecamatan of Kabupaten Semarang, with an approximate centre for each.
 *
 * WHY THIS EXISTS.
 *
 * The `towers` table had no administrative field at all — `alamat_menara` was
 * seeded as the literal string "Kecamatan Dummy" for every row, so there was no
 * way to count, filter or colour anything by district. The landing page needs a
 * district count, and "how many districts does this cover" is the one statistic
 * a resident actually recognises about their own regency.
 *
 * HOW A TOWER GETS ITS KECAMATAN.
 *
 * By nearest centre — a Voronoi assignment. OpenStreetMap has no admin_level=7
 * relations inside Kabupaten Semarang (relation 9686813), so there are no real
 * polygons to test against, and inventing 19 polygons would be inventing data
 * with a false air of precision.
 *
 * Nearest-centre is honest about what it is: the coordinates are real, the
 * centres are real to roughly a kilometre, and the assignment is deterministic
 * and geographically coherent — a tower standing in Ambarawa comes out labelled
 * Ambarawa. Near a boundary it can land one district over. That is a known and
 * acceptable property of dummy data; it is NOT a cadastral source.
 *
 * If real boundaries arrive later (BIG, or an OSM import), replace `nearest()`
 * with a point-in-polygon test and reseed. Nothing else has to change.
 *
 * The two corrected centres are marked below. Both came from published
 * approximations that fall outside the regency once tested against the actual
 * boundary — Pabelan's landed inside the Kota Salatiga enclave, which is a hole
 * in the polygon, not part of the regency at all.
 */
final class KecamatanSemarang
{
    /** name => [latitude, longitude] */
    public const CENTRES = [
        'Ungaran Barat' => [-7.1389, 110.3819],
        'Ungaran Timur' => [-7.1361, 110.4200],
        'Bergas'        => [-7.1897, 110.4103],
        'Pringapus'     => [-7.1933, 110.4783],
        'Bawen'         => [-7.2333, 110.4283],
        'Ambarawa'      => [-7.2661, 110.3986],
        'Bandungan'     => [-7.2244, 110.3700],
        'Jambu'         => [-7.2733, 110.3494],
        'Sumowono'      => [-7.2178, 110.2828],
        'Banyubiru'     => [-7.3000, 110.4100],
        'Tuntang'       => [-7.2750, 110.4667],
        // corrected: the published centre sits inside the Kota Salatiga enclave
        'Pabelan'       => [-7.3109, 110.5175],
        'Bringin'       => [-7.2528, 110.5583],
        'Bancak'        => [-7.2167, 110.5583],
        'Suruh'         => [-7.3667, 110.5333],
        'Susukan'       => [-7.4000, 110.5833],
        // corrected: the published centre sits just south of the regency line
        'Kaliwungu'     => [-7.4117, 110.5167],
        'Tengaran'      => [-7.3833, 110.4833],
        'Getasan'       => [-7.3667, 110.4167],
    ];

    /** @return list<string> */
    public static function names(): array
    {
        return array_keys(self::CENTRES);
    }

    /**
     * The kecamatan whose centre is closest to the given point.
     *
     * Longitude degrees are scaled by cos(latitude) before the distance is
     * taken, because a degree of longitude is shorter than a degree of latitude
     * everywhere except the equator. At -7.3 degrees the factor is 0.992, so
     * ignoring it would bias assignments east-west by not quite one percent —
     * small, but free to get right.
     *
     * Returns null for a tower that has no coordinates, of which the seeder
     * deliberately creates a batch to exercise the "Belum Terdata" paths.
     */
    public static function nearest(?float $latitude, ?float $longitude): ?string
    {
        if ($latitude === null || $longitude === null) {
            return null;
        }

        $scale = cos(deg2rad($latitude));
        $best = null;
        $bestDistance = INF;

        foreach (self::CENTRES as $name => [$lat, $lng]) {
            $dy = $lat - $latitude;
            $dx = ($lng - $longitude) * $scale;
            $distance = $dy * $dy + $dx * $dx;

            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $best = $name;
            }
        }

        return $best;
    }

    /** A district picked at random, for dummy rows that have no coordinates. */
    public static function random(): string
    {
        $names = self::names();

        return $names[array_rand($names)];
    }
}
