import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '../data/services';

type LanguageContextValue = { locale: Locale; isEn: boolean; toggle: () => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('yuzersef.locale') === 'en' ? 'en' : 'ar'));
  const toggle = () => setLocale((current) => (current === 'ar' ? 'en' : 'ar'));

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('yuzersef.locale', locale);
  }, [locale]);

  const value = useMemo(() => ({ locale, isEn: locale === 'en', toggle }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
