import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  detectCountry, 
  getConvertedPlans, 
  formatCurrency, 
  GeolocationData, 
  ConvertedPricing 
} from '../services/currencyService';

interface CurrencyState {
  loading: boolean;
  country: string;
  currency: string;
  exchangeRate: number;
  formattedPrices: ConvertedPricing;
  error: string | null;
}

interface CurrencyContextProps extends CurrencyState {
  symbol: string;
  formatPrice: (amount: number) => string;
  countryCode: string;
  countryName: string;
  pricing: ConvertedPricing;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const fallbackPricing = getConvertedPlans('US');
  
  const [currencyState, setCurrencyState] = useState<CurrencyState>({
    loading: true,
    country: 'US',
    currency: 'USD',
    exchangeRate: 1,
    formattedPrices: fallbackPricing,
    error: null
  });
  
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const initCurrency = async () => {
      try {
        const geoData: GeolocationData = await detectCountry();

        if (mounted) {
          const currentPricing = getConvertedPlans(geoData.countryCode);
          
          setCurrencyState({
            loading: false,
            country: geoData.countryCode,
            currency: geoData.currency,
            exchangeRate: 1,
            formattedPrices: currentPricing,
            error: null
          });
        }
      } catch (err: any) {
        console.warn('[CURRENCY CONTEXT] Init Error:', err);
        if (mounted) {
          setCurrencyState({
            loading: false,
            country: 'US',
            currency: 'USD',
            exchangeRate: 1,
            formattedPrices: fallbackPricing,
            error: null
          });
        }
      }
    };

    initCurrency();

    return () => {
      mounted = false;
    };
  }, []);

  const symbolMap: Record<string, string> = {
    INR: '₹', USD: '$', GBP: '£', EUR: '€', CAD: '$', AUD: '$', AED: 'AED ', SGD: '$', JPY: '¥'
  };
  const currentSymbol = symbolMap[currencyState.currency] || '$';

  const contextValue: CurrencyContextProps = {
    ...currencyState,
    symbol: currentSymbol,
    formatPrice: (amount: number) => formatCurrency(amount, currencyState.currency),
    countryCode: currencyState.country,
    countryName: currencyState.country === 'IN' ? 'India' : currencyState.country === 'US' ? 'United States' : currencyState.country,
    pricing: currencyState.formattedPrices
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
