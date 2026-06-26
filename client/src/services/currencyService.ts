export interface GeolocationData {
  countryCode: string;
  currency: string;
}

export const fetchGeolocation = async (): Promise<GeolocationData> => {
  try {
    // Check cache
    const cachedData = localStorage.getItem('woomegle_geolocation');
    const cacheTimestamp = localStorage.getItem('woomegle_geolocation_ts');
    
    // Cache for 24 hours (86400000 ms)
    if (cachedData && cacheTimestamp) {
      const isExpired = (Date.now() - parseInt(cacheTimestamp, 10)) > 24 * 60 * 60 * 1000;
      if (!isExpired) {
        return JSON.parse(cachedData);
      }
    }

    // Replace rate-limited ipapi.co (429) with highly reliable ipwho.is
    const response = await fetch('https://ipwho.is/');
    if (!response.ok) throw new Error('Geolocation fetch failed');
    
    const data = await response.json();
    
    const geoData: GeolocationData = {
      countryCode: data.country_code || 'US',
      currency: data.currency?.code || data.currency || 'USD'
    };

    localStorage.setItem('woomegle_geolocation', JSON.stringify(geoData));
    localStorage.setItem('woomegle_geolocation_ts', Date.now().toString());

    return geoData;
  } catch (error) {
    console.warn('Geolocation Error, defaulting to USD:', error);
    // Fallback default to USD
    return {
      countryCode: 'US',
      currency: 'USD'
    };
  }
};
