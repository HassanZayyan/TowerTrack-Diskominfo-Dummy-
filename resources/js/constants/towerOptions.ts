export type SiteTypeOption = {
  value: string;
  label: string;
  description: string;
};

export const SITE_TYPE_OPTIONS: SiteTypeOption[] = [
  {
    value: 'GF',
    label: 'GF (Ground Foot)',
    description: 'Menara berdiri langsung di atas tanah/lahan.',
  },
  {
    value: 'RT',
    label: 'RT (Rooftop)',
    description: 'Menara dipasang di atas bangunan/atap.',
  },
  {
    value: 'IBS',
    label: 'IBS (In-Building Solution)',
    description: 'Instalasi indoor untuk memperkuat sinyal dalam gedung.',
  },
];

