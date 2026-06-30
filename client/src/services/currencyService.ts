import { apiFetch } from '../config/api';
import { getPricingForCountry, RegionPricing } from '../config/pricingConfig';

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

const CACHE_KEY = 'country_cache_v3';

export const getCachedCountry = (): GeolocationData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (!data || !timestamp) return null;
    const isExpired = (Date.now() - timestamp) > 24 * 60 * 60 * 1000;
    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
};

export const setCachedCountry = (data: GeolocationData): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (err) {
    // Silent fallback
  }
};

export const fetchGeoCountry = async (): Promise<{ countryCode: string; countryName: string; geoApiResponse: any } | null> => {
  // Try backend location API first
  try {
    console.warn('[CURRENCY] Calling backend /api/location...');
    const { data } = await apiFetch('/api/location');
    if (data && data.countryCode) {
      console.warn(`[CURRENCY] Backend responded: ${JSON.stringify(data)}`);
      return {
        countryCode: data.countryCode,
        countryName: data.countryName || data.countryCode,
        geoApiResponse: data,
      };
    }
  } catch (backendErr: any) {
    console.warn('[CURRENCY] Backend /api/location failed:', backendErr?.message || backendErr);
  }

  // Fallback to ipwho.is public API directly from client
  try {
    console.warn('[CURRENCY] Calling ipwho.is fallback...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.country_code) {
        console.warn(`[CURRENCY] ipwho.is responded: country=${data.country_code}`);
        return {
          countryCode: data.country_code,
          countryName: data.country || data.country_code,
          geoApiResponse: data,
        };
      }
    }
  } catch (ipErr: any) {
    console.warn('[CURRENCY] ipwho.is failed:', ipErr?.message || ipErr);
  }

  // Try ipapi.co as third option
  try {
    console.warn('[CURRENCY] Calling ipapi.co fallback...');
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_code) {
        console.warn(`[CURRENCY] ipapi.co responded: country=${data.country_code}`);
        return {
          countryCode: data.country_code,
          countryName: data.country_name || data.country_code,
          geoApiResponse: data,
        };
      }
    }
  } catch (ipapiErr: any) {
    console.warn('[CURRENCY] ipapi.co failed:', ipapiErr?.message || ipapiErr);
  }

  return null;
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
        console.warn(`[CURRENCY] Using cached: country=${cached.countryCode} currency=${cached.currency}`);
        return cached;
      }

      const geoCountry = await fetchGeoCountry();
      if (geoCountry) {
        const pricing = getPricingForCountry(geoCountry.countryCode);
        const geoData: GeolocationData = {
          countryCode: geoCountry.countryCode,
          countryName: geoCountry.countryName,
          currency: pricing.currency,
          symbol: pricing.symbol,
          source: 'geo_api',
          geoApiCalled: true,
          geoApiResponse: geoCountry.geoApiResponse
        };
        setCachedCountry(geoData);
        return geoData;
      }

      // Default fallback to US
      const fallbackPricing = getPricingForCountry('US');
      const fallback: GeolocationData = {
        countryCode: 'US',
        countryName: 'United States',
        currency: fallbackPricing.currency,
        symbol: fallbackPricing.symbol,
        source: 'fallback',
        geoApiCalled: true,
        geoApiResponse: null
      };
      return fallback;
    } catch (err) {
      console.warn('[CURRENCY] detectCountry() error:', err);
      const fallbackPricing = getPricingForCountry('US');
      return {
        countryCode: 'US',
        countryName: 'United States',
        currency: fallbackPricing.currency,
        symbol: fallbackPricing.symbol,
        source: 'error_fallback',
        geoApiCalled: true,
        geoApiResponse: null
      };
    } finally {
      activeDetectPromise = null;
    }
  })();
  return activeDetectPromise;
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
      AED: 'ar-AE'
    };
    const locale = localeMap[currency] || 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  } catch (err) {
    const symbolMap: Record<string, string> = {
      INR: '₹', USD: '$', GBP: '£', EUR: '€', CAD: 'C$', AUD: 'A$', AED: 'AED '
    };
    const sym = symbolMap[currency] || '$';
    return `${sym}${amount}`;
  }
};

export const updatePricingUI = (currency: string, symbol: string): ConvertedPricing => {
  // Backward compatibility wrapper (maps config based on currency to keep types aligned)
  // Search config for matching currency
  let pricing = getPricingForCountry('US');
  const found = Object.values(getPricingForCountry('US')); // Dummy check
  // Since we are matching country now, this function is only called as a fallback/compatibility handler
  return {
    symbol,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    weeklyOriginal: 0,
    monthlyOriginal: 0,
    yearlyOriginal: 0
  };
};

export const getConvertedPlans = (countryCode: string): ConvertedPricing => {
  const pricing = getPricingForCountry(countryCode);
  return {
    symbol: pricing.symbol,
    weekly: pricing.weekly,
    monthly: pricing.monthly,
    yearly: pricing.yearly,
    weeklyOriginal: pricing.weekly * 2,
    monthlyOriginal: pricing.monthly * 2,
    yearlyOriginal: pricing.yearly * 2
  };
};

export const fetchGeolocation = detectCountry;
