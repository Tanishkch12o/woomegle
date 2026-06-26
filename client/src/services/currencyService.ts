import { apiFetch } from '../config/api';

export interface GeolocationData {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
  source: string;
  geoApiCalled: boolean;
  geoApiResponse: any;
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
  if (code === 'JP') return { currency: 'JPY', symbol: '¥' };
  return { currency: 'USD', symbol: '$' }; // Default fallback
};

export const getBrowserCountry = (): { countryCode: string; countryName: string; locale: string } | null => {
  try {
    let locale = '';
    if (typeof navigator !== 'undefined' && navigator.language) {
      locale = navigator.language;
    }
    if (!locale && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
    }

    if (!locale) return null;

    if (import.meta.env.DEV) {
      console.log(`Browser Locale: ${locale}`);
    }

    const upper = locale.toUpperCase();
    // Definitive non-US matches that establish country without Geo API
    if (upper.includes('IN') || upper === 'HI') return { countryCode: 'IN', countryName: 'India', locale };
    if (upper.includes('GB')) return { countryCode: 'GB', countryName: 'United Kingdom', locale };
    if (upper.includes('CA')) return { countryCode: 'CA', countryName: 'Canada', locale };
    if (upper.includes('AU')) return { countryCode: 'AU', countryName: 'Australia', locale };
    if (upper.includes('JP') || upper === 'JA') return { countryCode: 'JP', countryName: 'Japan', locale };
    if (upper.includes('DE')) return { countryCode: 'DE', countryName: 'Germany', locale };
    if (upper.includes('FR')) return { countryCode: 'FR', countryName: 'France', locale };
    if (upper.includes('IT')) return { countryCode: 'IT', countryName: 'Italy', locale };
    if (upper.includes('ES')) return { countryCode: 'ES', countryName: 'Spain', locale };
    if (upper.includes('NL')) return { countryCode: 'NL', countryName: 'Netherlands', locale };

    // NOTE: If locale is 'en-US' or 'en', do NOT return US immediately. 
    // Many users in India use en-US as their default browser language.
    // We must let it fall through to ipwho.is so their real Indian IP is detected!
    return null;
  } catch (err) {
    return null;
  }
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

export const fetchGeoCountry = async (): Promise<{ countryCode: string; countryName: string; geoApiResponse: any } | null> => {
  try {
    if (import.meta.env.DEV) {
      console.log('Geo API Called: true');
    }

    try {
      const { data } = await apiFetch('/api/location');
      if (data && data.countryCode) {
        if (import.meta.env.DEV) {
          console.log('Geo API Response:', JSON.stringify(data));
        }
        return { countryCode: data.countryCode, countryName: data.countryName || data.countryCode, geoApiResponse: data };
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
    if (import.meta.env.DEV) {
      console.log('Geo API Response:', JSON.stringify(data));
    }
    if (data && data.country_code) {
      return { countryCode: data.country_code, countryName: data.country || data.country_code, geoApiResponse: data };
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
      if (cached) {
        if (import.meta.env.DEV) {
          console.log(`Detected Country: ${cached.countryCode}`);
          console.log(`Detected Currency: ${cached.currency}`);
        }
        return cached;
      }

      const browserCountry = getBrowserCountry();
      if (browserCountry) {
        const { currency, symbol } = getCurrencyInfo(browserCountry.countryCode);
        const geoData: GeolocationData = { 
          countryCode: browserCountry.countryCode, 
          countryName: browserCountry.countryName, 
          currency, 
          symbol,
          source: 'navigator.language',
          geoApiCalled: false,
          geoApiResponse: null
        };
        if (import.meta.env.DEV) {
          console.log(`Detected Country: ${geoData.countryCode}`);
          console.log(`Detected Currency: ${geoData.currency}`);
        }
        setCachedCountry(geoData);
        return geoData;
      }

      const geoCountry = await fetchGeoCountry();
      if (geoCountry) {
        const { currency, symbol } = getCurrencyInfo(geoCountry.countryCode);
        const geoData: GeolocationData = { 
          countryCode: geoCountry.countryCode, 
          countryName: geoCountry.countryName, 
          currency, 
          symbol, 
          source: 'ipwho.is',
          geoApiCalled: true,
          geoApiResponse: geoCountry.geoApiResponse
        };
        if (import.meta.env.DEV) {
          console.log(`Detected Country: ${geoData.countryCode}`);
          console.log(`Detected Currency: ${geoData.currency}`);
        }
        setCachedCountry(geoData);
        return geoData;
      }

      const fallback: GeolocationData = { 
        countryCode: 'US', 
        countryName: 'United States', 
        currency: 'USD', 
        symbol: '$',
        source: 'fallback',
        geoApiCalled: true,
        geoApiResponse: { error: 'Geolocation fetch failed' }
      };
      if (import.meta.env.DEV) {
        console.log(`Detected Country: ${fallback.countryCode}`);
        console.log(`Detected Currency: ${fallback.currency}`);
      }
      setCachedCountry(fallback);
      return fallback;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[CURRENCY SERVICE] detectCountry error:', err);
      const fallback: GeolocationData = { 
        countryCode: 'US', 
        countryName: 'United States', 
        currency: 'USD', 
        symbol: '$',
        source: 'error_fallback',
        geoApiCalled: true,
        geoApiResponse: { error: 'Unexpected error' }
      };
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
      if (cached) {
        if (import.meta.env.DEV) console.log(`Exchange Rate: ${JSON.stringify(cached)}`);
        return cached;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Exchange rate fetch failed');
      const data = await res.json();
      const rates = data.rates || fallbackRates;
      
      if (import.meta.env.DEV) console.log(`Exchange Rate: ${JSON.stringify(rates)}`);
      setCachedRates(rates);
      return rates;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[CURRENCY SERVICE] fetchExchangeRates error:', err);
      if (import.meta.env.DEV) console.log(`Exchange Rate: ${JSON.stringify(fallbackRates)}`);
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
    monthly: 4.99,
    yearly: 39.99,
    weeklyOriginal: 3.99,
    monthlyOriginal: 9.99,
    yearlyOriginal: 49.99
  };

  if (import.meta.env.DEV) {
    console.log(`Price Before Conversion: ${JSON.stringify(basePlans)}`);
  }

  let pricing: ConvertedPricing;

  if (currency === 'INR') {
    // Explicit Indian fixed prices: 99, 299, 1999
    pricing = {
      symbol,
      weekly: 99,
      monthly: 299,
      yearly: 1999,
      weeklyOriginal: 199,
      monthlyOriginal: 599,
      yearlyOriginal: 3999
    };
  } else {
    pricing = {
      symbol,
      weekly: convertPrice(basePlans.weekly, currency, rates),
      monthly: convertPrice(basePlans.monthly, currency, rates),
      yearly: convertPrice(basePlans.yearly, currency, rates),
      weeklyOriginal: convertPrice(basePlans.weeklyOriginal, currency, rates),
      monthlyOriginal: convertPrice(basePlans.monthlyOriginal, currency, rates),
      yearlyOriginal: convertPrice(basePlans.yearlyOriginal, currency, rates)
    };
  }

  if (import.meta.env.DEV) {
    console.log(`Price After Conversion: ${JSON.stringify(pricing)}`);
    console.log(`UI Updated: true`);
  }

  return pricing;
};

export const fetchGeolocation = detectCountry;
export const getConvertedPlans = updatePricingUI;
