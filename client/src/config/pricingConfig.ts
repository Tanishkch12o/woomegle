import PRICING_DATA from './pricingConfig.json';

export interface RegionPricing {
  currency: string;
  symbol: string;
  weekly: number;
  monthly: number;
  yearly: number;
}

export const PRICING_CONFIG: Record<string, RegionPricing> = PRICING_DATA;

export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

export const getPricingForCountry = (countryCode: string): RegionPricing => {
  const code = (countryCode || '').toUpperCase();
  if (PRICING_CONFIG[code]) {
    return PRICING_CONFIG[code];
  }
  if (EU_COUNTRIES.includes(code)) {
    return PRICING_CONFIG['EU'];
  }
  return PRICING_CONFIG['US']; // Default fallback
};
