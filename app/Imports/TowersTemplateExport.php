<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class TowersTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths
{
    public function array(): array
    {
        // Contoh data untuk template
        return [
            [
                'Jl. Raya No. 123, Ungaran',
                'Site ABC',
                'ABC001',
                'ABC001-SAP',
                -7.123456,
                110.456789,
                50.5,
                10.2,
                100,
                4,
                'Self Support',
                'GF',
                'Owner ABC',
                'Aktif',
                'IJIN-001',
                '2024-01-01',
                '2025-01-01',
                'Izin Prinsip',
                'PRS Name',
                'PRS-001',
            ],
            [
                'Jl. Merdeka No. 456, Ungaran',
                'Site XYZ',
                'XYZ002',
                'XYZ002-SAP',
                -7.234567,
                110.567890,
                60.0,
                15.5,
                150,
                3,
                'Guyed',
                'IBS',
                'Owner XYZ',
                'Aktif',
                'IJIN-002',
                '2024-02-01',
                '2025-02-01',
                'Izin Prinsip',
                'PRS Name 2',
                'PRS-002',
            ],
        ];
    }

    public function headings(): array
    {
        return [
            'Alamat Menara',              // Required
            'Site Name',
            'Site ID',
            'Site SAP',
            'Latitude',
            'Longitude',
            'Tinggi Menara (m)',
            'Tinggi Bangunan (m)',
            'Jumlah Pengguna',
            'Jumlah Kaki',
            'Tower Type',
            'Site Type',
            'Owner Name',
            'Status Ijin',
            'No Ijin',
            'Tanggal Ijin (YYYY-MM-DD)',
            'Berlaku Hingga (YYYY-MM-DD)',
            'Jenis Ijin',
            'PRS',
            'PRS ID',
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
            'A' => 30,  // Alamat Menara
            'B' => 15,  // Site Name
            'C' => 12,  // Site ID
            'D' => 15,  // Site SAP
            'E' => 12,  // Latitude
            'F' => 12,  // Longitude
            'G' => 18,  // Tinggi Menara
            'H' => 18,  // Tinggi Bangunan
            'I' => 15,  // Jumlah Pengguna
            'J' => 12,  // Jumlah Kaki
            'K' => 15,  // Tower Type
            'L' => 12,  // Site Type
            'M' => 20,  // Owner Name
            'N' => 12,  // Status Ijin
            'O' => 15,  // No Ijin
            'P' => 20,  // Tanggal Ijin
            'Q' => 20,  // Berlaku Hingga
            'R' => 15,  // Jenis Ijin
            'S' => 15,  // PRS
            'T' => 12,  // PRS ID
        ];
    }
}



