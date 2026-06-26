import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  detectCountry, 
  fetchExchangeRates, 
  updatePricingUI, 
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
  const fallbackPricing = updatePricingUI('USD', '$', { USD: 1 });
  
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
        const rates = await fetchExchangeRates();

        if (mounted) {
          const currentPricing = updatePricingUI(geoData.currency, geoData.symbol, rates);
          const currentRate = rates[geoData.currency] || 1;
          
          setCurrencyState({
            loading: false,
            country: geoData.countryCode,
            currency: geoData.currency,
            exchangeRate: currentRate,
            formattedPrices: currentPricing,
            error: null
          });
        }
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error('[CURRENCY CONTEXT] Init Error:', err);
        }
        if (mounted) {
          setCurrencyState({
            loading: false,
            country: 'US',
            currency: 'USD',
            exchangeRate: 1,
            formattedPrices: fallbackPricing,
            error: err.message || 'Geolocation fetch failed'
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
