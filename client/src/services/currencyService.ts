import { apiFetch } from '../config/api';

export interface GeolocationData {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
}

export interface ConvertedPricing {
  symbol: string;
  weekly: number;
  monthly: number;
  yearly: number;
  weeklyOriginal: number;
  monthlyOriginal: number;
  yearlyOriginal: number;
}

export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

export const getCurrencyInfo = (countryCode: string): { currency: string; symbol: string } => {
  const code = countryCode.toUpperCase();
  if (code === 'IN') return { currency: 'INR', symbol: '₹' };
  if (code === 'US') return { currency: 'USD', symbol: '$' };
  if (code === 'GB') return { currency: 'GBP', symbol: '£' };
  if (EU_COUNTRIES.includes(code)) return { currency: 'EUR', symbol: '€' };
  if (code === 'CA') return { currency: 'CAD', symbol: '$' };
  if (code === 'AU') return { currency: 'AUD', symbol: '$' };
  if (code === 'AE') return { currency: 'AED', symbol: 'AED ' };
  if (code === 'SG') return { currency: 'SGD', symbol: '$' };
  if (code === 'JP') return { currency: 'JPY', symbol: '¥' };
  return { currency: 'USD', symbol: '$' }; // Default fallback
};

export const fetchGeolocation = async (): Promise<GeolocationData> => {
  try {
    const CACHE_KEY = 'woomegle_geo_cache';
    const CACHE_TS_KEY = 'woomegle_geo_ts';
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cacheTimestamp = localStorage.getItem(CACHE_TS_KEY);
    
    // Cache for 24 hours (86400000 ms)
    if (cachedData && cacheTimestamp) {
      const isExpired = (Date.now() - parseInt(cacheTimestamp, 10)) > 24 * 60 * 60 * 1000;
      if (!isExpired) {
        if (import.meta.env.DEV) {
          console.log('[GEOLOCATION] Serving cached geolocation from localStorage:', JSON.parse(cachedData));
        }
        return JSON.parse(cachedData);
      }
    }

    let countryCode = 'US';
    let countryName = 'United States';

    try {
      if (import.meta.env.DEV) {
        console.log('[GEOLOCATION] Fetching location from backend endpoint /api/location...');
      }
      const { data } = await apiFetch('/api/location');
      if (data && data.countryCode) {
        countryCode = data.countryCode;
        countryName = data.countryName || countryCode;
      }
    } catch (backendErr) {
      if (import.meta.env.DEV) {
        console.warn('[GEOLOCATION] Backend endpoint failed, falling back to direct ipwho.is fetch:', backendErr);
      }
      const ipRes = await fetch('https://ipwho.is/');
      if (!ipRes.ok) throw new Error('ipwho.is fetch failed');
      const ipData = await ipRes.json();
      countryCode = ipData.country_code || 'US';
      countryName = ipData.country || 'United States';
    }

    const { currency, symbol } = getCurrencyInfo(countryCode);
    const geoData: GeolocationData = { countryCode, countryName, currency, symbol };

    localStorage.setItem(CACHE_KEY, JSON.stringify(geoData));
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString());

    if (import.meta.env.DEV) {
      console.log('[GEOLOCATION] New geolocation detected and cached:', geoData);
    }
    return geoData;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[GEOLOCATION] Geolocation failed, attempting fallback via navigator.language...', error);
    }
    // Fallback to browser locale (navigator.language)
    let countryCode = 'US';
    if (typeof navigator !== 'undefined' && navigator.language) {
      const parts = navigator.language.split('-');
      if (parts.length > 1) {
        countryCode = parts[1].toUpperCase();
      } else if (parts[0].toLowerCase() === 'en') {
        countryCode = 'US';
      } else if (parts[0].toLowerCase() === 'hi') {
        countryCode = 'IN';
      } else if (parts[0].toLowerCase() === 'ja') {
        countryCode = 'JP';
      }
    }

    const { currency, symbol } = getCurrencyInfo(countryCode);
    if (import.meta.env.DEV) {
      console.log(`[GEOLOCATION] Fallback completed. Country: ${countryCode} | Currency: ${currency}`);
    }
    return { countryCode, countryName: countryCode, currency, symbol };
  }
};

export const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  const CACHE_KEY = 'woomegle_rates_cache';
  const CACHE_TS_KEY = 'woomegle_rates_ts';
  const cachedRates = localStorage.getItem(CACHE_KEY);
  const cacheTimestamp = localStorage.getItem(CACHE_TS_KEY);

  // Fallback rates in case API is down
  const fallbackRates: Record<string, number> = {
    INR: 1,
    USD: 0.012,
    GBP: 0.0095,
    EUR: 0.011,
    CAD: 0.016,
    AUD: 0.018,
    AED: 0.044,
    SGD: 0.016,
    JPY: 1.85
  };

  // Cache for 24 hours
  if (cachedRates && cacheTimestamp) {
    const isExpired = (Date.now() - parseInt(cacheTimestamp, 10)) > 24 * 60 * 60 * 1000;
    if (!isExpired) {
      if (import.meta.env.DEV) {
        console.log('[EXCHANGE RATES] Serving cached exchange rates from localStorage');
      }
      return JSON.parse(cachedRates);
    }
  }

  try {
    if (import.meta.env.DEV) {
      console.log('[EXCHANGE RATES] Fetching latest exchange rates from open.er-api.com...');
    }
    const response = await fetch('https://open.er-api.com/v6/latest/INR');
    if (!response.ok) throw new Error('Exchange rate fetch failed');
    const data = await response.json();
    const rates = data.rates || fallbackRates;

    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString());

    return rates;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[EXCHANGE RATES] Fetch failed, using fallback exchange rates:', err);
    }
    return fallbackRates;
  }
};

export const getConvertedPlans = (currency: string, symbol: string, rates: Record<string, number>): ConvertedPricing => {
  // Base Woomegle Premium plans in INR
  const basePlans = {
    weekly: 99,
    monthly: 299,
    yearly: 1999,
    weeklyOriginal: 199,
    monthlyOriginal: 599,
    yearlyOriginal: 3999
  };

  if (currency === 'INR') {
    return { symbol, ...basePlans };
  }

  const rate = rates[currency] || rates['USD'] || 0.012;
  const formatPrice = (inrPrice: number) => {
    const converted = inrPrice * rate;
    // Format beautifully (e.g. round to 2 decimals)
    return Math.round(converted * 100) / 100;
  };

  return {
    symbol,
    weekly: formatPrice(basePlans.weekly),
    monthly: formatPrice(basePlans.monthly),
    yearly: formatPrice(basePlans.yearly),
    weeklyOriginal: formatPrice(basePlans.weeklyOriginal),
    monthlyOriginal: formatPrice(basePlans.monthlyOriginal),
    yearlyOriginal: formatPrice(basePlans.yearlyOriginal)
  };
};
