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

// --- Country name map for display ---
const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', GB: 'United Kingdom', CA: 'Canada',
  AU: 'Australia', JP: 'Japan', DE: 'Germany', FR: 'France',
  IT: 'Italy', ES: 'Spain', NL: 'Netherlands', BR: 'Brazil',
  MX: 'Mexico', SG: 'Singapore', AE: 'United Arab Emirates',
};

/**
 * Extract the 2-letter country/region code from the browser locale.
 * Uses Intl.Locale API (supported in all modern browsers) for reliable parsing.
 * Falls back to regex extraction of the region subtag from BCP 47 locale strings.
 *
 * Returns null ONLY if the locale is ambiguous (e.g., "en" with no region subtag),
 * meaning we cannot determine the country from the browser alone.
 */
export const getBrowserCountry = (): { countryCode: string; countryName: string; locale: string } | null => {
  try {
    // Step 1: Get the raw locale string
    let locale = '';
    if (typeof navigator !== 'undefined' && navigator.language) {
      locale = navigator.language;
    }
    if (!locale && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
    }

    if (!locale) return null;

    console.warn(`[CURRENCY] Browser locale: ${locale}`);

    // Step 2: Try Intl.Locale API for proper BCP 47 parsing
    let region: string | undefined;

    if (typeof Intl !== 'undefined' && 'Locale' in Intl) {
      try {
        // @ts-ignore — Intl.Locale is widely supported but may not be in all TS lib targets
        const intlLocale = new Intl.Locale(locale);
        region = intlLocale.region as string | undefined;
      } catch (_e) {
        // Intl.Locale constructor can throw for malformed locale strings; fall through
      }
    }

    // Step 3: Fallback — regex extract region subtag (the part after the hyphen)
    if (!region) {
      const match = locale.match(/^[a-z]{2,3}[-_]([A-Z]{2})$/i);
      if (match) {
        region = match[1].toUpperCase();
      }
    }

    // Step 4: Check the primary language subtag for language-only locales
    // "hi" (Hindi) → very likely India
    if (!region) {
      const lang = locale.split(/[-_]/)[0].toLowerCase();
      if (lang === 'hi') {
        region = 'IN';
      } else if (lang === 'ja') {
        region = 'JP';
      }
      // "en", "fr", "de" etc. without region → ambiguous, return null
    }

    if (!region) {
      console.warn(`[CURRENCY] No region in locale "${locale}", will use geo API`);
      return null;
    }

    region = region.toUpperCase();
    const countryName = COUNTRY_NAMES[region] || region;

    console.warn(`[CURRENCY] Browser locale resolved: region=${region}, country=${countryName}`);

    return { countryCode: region, countryName, locale };
  } catch (err) {
    console.warn('[CURRENCY] getBrowserCountry() error:', err);
    return null;
  }
};

// --- Cache key versioned to bust stale entries from previous broken flow ---
const CACHE_KEY = 'country_cache_v2';

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

    // Don't serve cached fallback entries — re-detect instead
    if (data.source === 'fallback' || data.source === 'error_fallback') {
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
    // Silent fallback — localStorage might be full or disabled
  }
};

/**
 * Attempt to determine the user's country via network APIs.
 * Order: Backend /api/location → ipwho.is → null
 * 
 * NEVER throws. Returns null if all sources fail.
 * All errors are logged with console.warn (survives production esbuild).
 */
export const fetchGeoCountry = async (): Promise<{ countryCode: string; countryName: string; geoApiResponse: any } | null> => {
  // --- Attempt 1: Our own backend /api/location ---
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
    console.warn('[CURRENCY] Backend returned no countryCode, trying ipwho.is...');
  } catch (backendErr: any) {
    // Log the exact failure reason so it's visible in production DevTools
    console.warn('[CURRENCY] Backend /api/location failed:', backendErr?.message || backendErr);
  }

  // --- Attempt 2: ipwho.is public API ---
  try {
    console.warn('[CURRENCY] Calling ipwho.is fallback...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[CURRENCY] ipwho.is returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data && data.country_code) {
      console.warn(`[CURRENCY] ipwho.is responded: country=${data.country_code}`);
      return {
        countryCode: data.country_code,
        countryName: data.country || data.country_code,
        geoApiResponse: data,
      };
    }
    console.warn('[CURRENCY] ipwho.is returned no country_code');
    return null;
  } catch (ipErr: any) {
    if (ipErr?.name === 'AbortError') {
      console.warn('[CURRENCY] ipwho.is timed out after 5s');
    } else {
      console.warn('[CURRENCY] ipwho.is failed:', ipErr?.message || ipErr);
    }
    return null;
  }
};

let activeDetectPromise: Promise<GeolocationData> | null = null;

/**
 * Main detection entrypoint. NEVER throws.
 * 
 * Priority:
 *   1. Cached result (24h TTL, excludes stale fallbacks)
 *   2. Browser locale (Intl.Locale region parsing)
 *      → If region is IN, immediately returns INR
 *   3. Backend /api/location
 *   4. ipwho.is
 *   5. USD fallback (graceful, no error thrown)
 */
export const detectCountry = (): Promise<GeolocationData> => {
  if (activeDetectPromise) {
    return activeDetectPromise;
  }
  activeDetectPromise = (async () => {
    try {
      // --- Priority 1: Cache ---
      const cached = getCachedCountry();
      if (cached) {
        console.warn(`[CURRENCY] Using cached: country=${cached.countryCode} currency=${cached.currency} source=${cached.source}`);
        return cached;
      }

      // --- Priority 2: Browser locale ---
      const browserCountry = getBrowserCountry();
      if (browserCountry) {
        const { currency, symbol } = getCurrencyInfo(browserCountry.countryCode);
        const geoData: GeolocationData = {
          countryCode: browserCountry.countryCode,
          countryName: browserCountry.countryName,
          currency,
          symbol,
          source: 'browser_locale',
          geoApiCalled: false,
          geoApiResponse: null
        };
        console.warn(`[CURRENCY] Detected from browser locale: country=${geoData.countryCode} currency=${geoData.currency}`);
        setCachedCountry(geoData);
        return geoData;
      }

      // --- Priority 3 & 4: Backend → ipwho.is ---
      const geoCountry = await fetchGeoCountry();
      if (geoCountry) {
        const { currency, symbol } = getCurrencyInfo(geoCountry.countryCode);
        const geoData: GeolocationData = {
          countryCode: geoCountry.countryCode,
          countryName: geoCountry.countryName,
          currency,
          symbol,
          source: 'geo_api',
          geoApiCalled: true,
          geoApiResponse: geoCountry.geoApiResponse
        };
        console.warn(`[CURRENCY] Detected from geo API: country=${geoData.countryCode} currency=${geoData.currency}`);
        setCachedCountry(geoData);
        return geoData;
      }

      // --- Priority 5: Graceful USD fallback (never throw) ---
      const fallback: GeolocationData = {
        countryCode: 'US',
        countryName: 'United States',
        currency: 'USD',
        symbol: '$',
        source: 'fallback',
        geoApiCalled: true,
        geoApiResponse: null
      };
      console.warn('[CURRENCY] All detection methods failed, using USD fallback');
      // Do NOT cache fallback — re-attempt next page load
      return fallback;
    } catch (err) {
      // This catch should never fire, but safety net
      console.warn('[CURRENCY] detectCountry() unexpected error:', err);
      return {
        countryCode: 'US',
        countryName: 'United States',
        currency: 'USD',
        symbol: '$',
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
      console.warn('[CURRENCY] Exchange rate fetch failed, using fallback rates:', err);
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
    // Explicit Indian fixed prices: ₹99, ₹299, ₹1999
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
