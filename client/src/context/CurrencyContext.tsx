import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchGeolocation, GeolocationData } from '../services/currencyService';
import { getCurrencyCodeForRegion, getPricingForCurrency, RegionPricing } from '../config/pricingConfig';

interface CurrencyContextProps {
  countryCode: string;
  currency: string;
  symbol: string;
  pricing: RegionPricing;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [countryCode, setCountryCode] = useState<string>('US');
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState<boolean>(true);
  const [pricing, setPricing] = useState<RegionPricing | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initCurrency = async () => {
      try {
        const geoData: GeolocationData = await fetchGeolocation();
        if (mounted) {
          const derivedCurrency = getCurrencyCodeForRegion(geoData.countryCode);
          const currentPricing = getPricingForCurrency(derivedCurrency);
          
          setCountryCode(geoData.countryCode);
          setCurrency(derivedCurrency);
          setPricing(currentPricing);
        }
      } catch (err) {
        console.error('Currency Context Init Error:', err);
        if (mounted) {
          // Fallback
          setCountryCode('US');
          setCurrency('USD');
          setPricing(getPricingForCurrency('USD'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initCurrency();

    return () => {
      mounted = false;
    };
  }, []);

  // Return a safe default while loading or if something failed
  const contextValue: CurrencyContextProps = {
    countryCode,
    currency,
    symbol: pricing?.symbol || '$',
    pricing: pricing || getPricingForCurrency('USD'),
    loading
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
