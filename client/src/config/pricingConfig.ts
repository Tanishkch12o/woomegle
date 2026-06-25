import PRICING_DATA from './pricingConfig.json';

export interface RegionPricing {
  symbol: string;
  weekly: number;
  monthly: number;
  yearly: number;
  weeklyOriginal: number;
  monthlyOriginal: number;
  yearlyOriginal: number;
}

export const PRICING_CONFIG: Record<string, RegionPricing> = PRICING_DATA;

export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

export const getCurrencyCodeForRegion = (countryCode: string): string => {
  if (countryCode === 'IN') return 'INR';
  if (countryCode === 'GB') return 'GBP';
  if (countryCode === 'US') return 'USD';
  if (EU_COUNTRIES.includes(countryCode)) return 'EUR';
  return 'USD'; // Default fallback
};

export const getPricingForCurrency = (currencyCode: string): RegionPricing => {
  if (PRICING_CONFIG[currencyCode]) {
    return PRICING_CONFIG[currencyCode];
  }
  return PRICING_CONFIG['USD']; // Fallback
};
