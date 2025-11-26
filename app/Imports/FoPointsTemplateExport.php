<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class FoPointsTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths
{
    public function array(): array
    {
        // Contoh data untuk template
        return [
            [
                1,
                'Titik FO 1',
                -7.123456,
                110.456789,
                'Jalur FO A',
                'pole',
                'active',
                'left',
                'Deskripsi titik FO 1',
                'ungaran',
                'https://drive.google.com/...',
                'https://drive.google.com/...',
                null,
                'Provider A, Provider B',
            ],
            [
                2,
                'Titik FO 2',
                -7.234567,
                110.567890,
                'Jalur FO A',
                'junction',
                'active',
                'right',
                'Deskripsi titik FO 2',
                'ungaran',
                'https://drive.google.com/...',
                'https://drive.google.com/...',
                'https://drive.google.com/...',
                'Provider A',
            ],
        ];
    }

    public function headings(): array
    {
        return [
            'Sequence Number',        // Required
            'Name',                   // Required
            'Latitude',               // Required
            'Longitude',              // Required
            'Route Name',             // Required
            'Type',                   // Required (pole, junction, hub, endpoint)
            'Status',                 // Required (active, inactive, maintenance)
            'Side of Road',           // Optional (left, right, unknown)
            'Description',            // Optional
            'Area',                   // Optional (default: ungaran)
            'ISP Image URL',          // Optional (Google Drive URL)
            'Pole Image URL',         // Optional (Google Drive URL)
            'Junction Box Image URL', // Optional (Google Drive URL)
            'Providers',              // Optional (comma-separated provider names)
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4']
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 18,  // Sequence Number
            'B' => 20,  // Name
            'C' => 12,  // Latitude
            'D' => 12,  // Longitude
            'E' => 20,  // Route Name
            'F' => 12,  // Type
            'G' => 12,  // Status
            'H' => 15,  // Side of Road
            'I' => 30,  // Description
            'J' => 12,  // Area
            'K' => 40,  // ISP Image URL
            'L' => 40,  // Pole Image URL
            'M' => 40,  // Junction Box Image URL
            'N' => 30,  // Providers
        ];
    }
}


