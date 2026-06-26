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

export const getBrowserCountry = (): { countryCode: string; countryName: string } | null => {
  try {
    let locale = '';
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
    }
    if (!locale && typeof navigator !== 'undefined') {
      locale = navigator.language || '';
    }

    if (!locale) return null;

    const upper = locale.toUpperCase();
    if (upper.includes('IN')) return { countryCode: 'IN', countryName: 'India' };
    if (upper.includes('US')) return { countryCode: 'US', countryName: 'United States' };
    if (upper.includes('GB')) return { countryCode: 'GB', countryName: 'United Kingdom' };
    if (upper.includes('CA')) return { countryCode: 'CA', countryName: 'Canada' };
    if (upper.includes('AU')) return { countryCode: 'AU', countryName: 'Australia' };
    if (upper.includes('JP')) return { countryCode: 'JP', countryName: 'Japan' };
    if (upper.includes('DE')) return { countryCode: 'DE', countryName: 'Germany' };
    if (upper.includes('FR')) return { countryCode: 'FR', countryName: 'France' };
    
    const parts = locale.split('-');
    if (parts.length > 1) {
      const c = parts[1].toUpperCase();
      if (['IN', 'US', 'GB', 'CA', 'AU', 'JP', 'DE', 'FR'].includes(c)) {
        const nameMap: Record<string, string> = {
          IN: 'India', US: 'United States', GB: 'United Kingdom', CA: 'Canada',
          AU: 'Australia', JP: 'Japan', DE: 'Germany', FR: 'France'
        };
        return { countryCode: c, countryName: nameMap[c] };
      }
    }
  } catch (err) {
    // Silent fallback
  }
  return null;
};

export const getCachedCountry = (): GeolocationData | null => {
  try {
    const cached = localStorage.getItem('country_cache');
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (!data || !timestamp) return null;
    const isExpired = (Date.now() - timestamp) > 24 * 60 * 60 * 1000;
    if (isExpired) {
      localStorage.removeItem('country_cache');
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
};

export const setCachedCountry = (data: GeolocationData): void => {
  try {
    localStorage.setItem('country_cache', JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (err) {
    // Silent fallback
  }
};

export const fetchGeoCountry = async (): Promise<GeolocationData | null> => {
  try {
    try {
      const { data } = await apiFetch('/api/location');
      if (data && data.countryCode) {
        const { currency, symbol } = getCurrencyInfo(data.countryCode);
        return { countryCode: data.countryCode, countryName: data.countryName || data.countryCode, currency, symbol };
      }
    } catch (backendErr) {
      // Silent fallback to ipwho.is
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.country_code) {
      const { currency, symbol } = getCurrencyInfo(data.country_code);
      return { countryCode: data.country_code, countryName: data.country || data.country_code, currency, symbol };
    }
    return null;
  } catch (err) {
    if (import.meta.env.DEV) console.error('[CURRENCY SERVICE] fetchGeoCountry error:', err);
    return null;
  }
};

let activeDetectPromise: Promise<GeolocationData> | null = null;

export const detectCountry = (): Promise<GeolocationData> => {
  if (activeDetectPromise) {
    return activeDetectPromise;
  }
  activeDetectPromise = (async () => {
    try {
      const cached = getCachedCountry();
      if (cached) return cached;

      const browserCountry = getBrowserCountry();
      if (browserCountry) {
        const { currency, symbol } = getCurrencyInfo(browserCountry.countryCode);
        const geoData: GeolocationData = { ...browserCountry, currency, symbol };
        setCachedCountry(geoData);
        return geoData;
      }

      const geoCountry = await fetchGeoCountry();
      if (geoCountry) {
        setCachedCountry(geoCountry);
        return geoCountry;
      }

      const fallback: GeolocationData = { countryCode: 'US', countryName: 'United States', currency: 'USD', symbol: '$' };
      setCachedCountry(fallback);
      return fallback;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[CURRENCY SERVICE] detectCountry error:', err);
      const fallback: GeolocationData = { countryCode: 'US', countryName: 'United States', currency: 'USD', symbol: '$' };
      return fallback;
    } finally {
      activeDetectPromise = null;
    }
  })();
  return activeDetectPromise;
};

export const getCachedRates = (): Record<string, number> | null => {
  try {
    const cached = localStorage.getItem('exchange_rates');
    if (!cached) return null;
    const { rates, timestamp } = JSON.parse(cached);
    if (!rates || !timestamp) return null;
    const isExpired = (Date.now() - timestamp) > 24 * 60 * 60 * 1000;
    if (isExpired) {
      localStorage.removeItem('exchange_rates');
      return null;
    }
    return rates;
  } catch (err) {
    return null;
  }
};

export const setCachedRates = (rates: Record<string, number>): void => {
  try {
    localStorage.setItem('exchange_rates', JSON.stringify({
      rates,
      timestamp: Date.now()
    }));
  } catch (err) {
    // Silent fallback
  }
};

let activeRatesPromise: Promise<Record<string, number>> | null = null;

export const fetchExchangeRates = (): Promise<Record<string, number>> => {
  if (activeRatesPromise) {
    return activeRatesPromise;
  }
  activeRatesPromise = (async () => {
    const fallbackRates: Record<string, number> = {
      USD: 1, INR: 83.5, GBP: 0.79, EUR: 0.92, CAD: 1.37, AUD: 1.51, AED: 3.67, SGD: 1.35, JPY: 155.0
    };

    try {
      const cached = getCachedRates();
      if (cached) return cached;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Exchange rate fetch failed');
      const data = await res.json();
      const rates = data.rates || fallbackRates;
      
      setCachedRates(rates);
      return rates;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[CURRENCY SERVICE] fetchExchangeRates error:', err);
      return fallbackRates;
    } finally {
      activeRatesPromise = null;
    }
  })();
  return activeRatesPromise;
};

export const convertPrice = (usdPrice: number, currency: string, rates: Record<string, number>): number => {
  if (currency === 'USD') return usdPrice;
  const rate = rates[currency] || 1;
  const converted = usdPrice * rate;
  if (currency === 'JPY' || currency === 'INR') {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
};

export const formatCurrency = (amount: number, currency: string): string => {
  try {
    const localeMap: Record<string, string> = {
      INR: 'en-IN',
      USD: 'en-US',
      GBP: 'en-GB',
      EUR: 'de-DE',
      CAD: 'en-CA',
      AUD: 'en-AU',
      AED: 'ar-AE',
      SGD: 'en-SG',
      JPY: 'ja-JP'
    };
    const locale = localeMap[currency] || 'en-US';
    
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'JPY' || (currency === 'INR' && amount % 1 === 0) ? 0 : 2
    });
    return formatter.format(amount);
  } catch (err) {
    const symbolMap: Record<string, string> = {
      INR: '₹', USD: '$', GBP: '£', EUR: '€', CAD: '$', AUD: '$', AED: 'AED ', SGD: '$', JPY: '¥'
    };
    const sym = symbolMap[currency] || '$';
    return `${sym}${amount}`;
  }
};

export const updatePricingUI = (currency: string, symbol: string, rates: Record<string, number>): ConvertedPricing => {
  const basePlans = {
    weekly: 1.99,
    monthly: 5.99,
    yearly: 19.99,
    weeklyOriginal: 3.99,
    monthlyOriginal: 9.99,
    yearlyOriginal: 29.99
  };

  return {
    symbol,
    weekly: convertPrice(basePlans.weekly, currency, rates),
    monthly: convertPrice(basePlans.monthly, currency, rates),
    yearly: convertPrice(basePlans.yearly, currency, rates),
    weeklyOriginal: convertPrice(basePlans.weeklyOriginal, currency, rates),
    monthlyOriginal: convertPrice(basePlans.monthlyOriginal, currency, rates),
    yearlyOriginal: convertPrice(basePlans.yearlyOriginal, currency, rates)
  };
};

export const fetchGeolocation = detectCountry;
export const getConvertedPlans = updatePricingUI;
