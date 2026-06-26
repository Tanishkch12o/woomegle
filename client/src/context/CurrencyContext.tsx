import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  detectCountry, 
  fetchExchangeRates, 
  updatePricingUI, 
  formatCurrency, 
  GeolocationData, 
  ConvertedPricing 
} from '../services/currencyService';

interface CurrencyContextProps {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
  pricing: ConvertedPricing;
  loading: boolean;
  formatPrice: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [countryCode, setCountryCode] = useState<string>('US');
  const [countryName, setCountryName] = useState<string>('United States');
  const [currency, setCurrency] = useState<string>('USD');
  const [symbol, setSymbol] = useState<string>('$');
  const [loading, setLoading] = useState<boolean>(true);
  const [pricing, setPricing] = useState<ConvertedPricing | null>(null);
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const initCurrency = async () => {
      try {
        setLoading(true);
        const geoData: GeolocationData = await detectCountry();
        const rates = await fetchExchangeRates();

        if (mounted) {
          const currentPricing = updatePricingUI(geoData.currency, geoData.symbol, rates);
          
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
          setPricing(updatePricingUI('USD', '$', { USD: 1 }));
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

  const fallbackPricing = updatePricingUI('USD', '$', { USD: 1 });
  const activePricing = pricing || fallbackPricing;

  const contextValue: CurrencyContextProps = {
    countryCode,
    countryName,
    currency,
    symbol,
    pricing: activePricing,
    loading,
    formatPrice: (amount: number) => formatCurrency(amount, currency)
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
