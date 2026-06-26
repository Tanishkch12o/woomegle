import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchGeolocation, fetchExchangeRates, getConvertedPlans, GeolocationData, ConvertedPricing } from '../services/currencyService';

interface CurrencyContextProps {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
  pricing: ConvertedPricing;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [countryCode, setCountryCode] = useState<string>('US');
  const [countryName, setCountryName] = useState<string>('United States');
  const [currency, setCurrency] = useState<string>('USD');
  const [symbol, setSymbol] = useState<string>('$');
  const [loading, setLoading] = useState<boolean>(true);
  const [pricing, setPricing] = useState<ConvertedPricing | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initCurrency = async () => {
      try {
        const geoData: GeolocationData = await fetchGeolocation();
        const rates = await fetchExchangeRates();

        if (mounted) {
          const currentPricing = getConvertedPlans(geoData.currency, geoData.symbol, rates);
          
          setCountryCode(geoData.countryCode);
          setCountryName(geoData.countryName);
          setCurrency(geoData.currency);
          setSymbol(geoData.symbol);
          setPricing(currentPricing);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[CURRENCY CONTEXT] Init Error:', err);
        }
        if (mounted) {
          // Fallback to USD
          setCountryCode('US');
          setCountryName('United States');
          setCurrency('USD');
          setSymbol('$');
          setPricing(getConvertedPlans('USD', '$', { USD: 0.012 }));
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

  const fallbackPricing = getConvertedPlans('USD', '$', { USD: 0.012 });
  const contextValue: CurrencyContextProps = {
    countryCode,
    countryName,
    currency,
    symbol,
    pricing: pricing || fallbackPricing,
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

