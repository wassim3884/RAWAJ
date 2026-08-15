import { createContext, useContext, useEffect, useState } from 'react';
import { translate } from '../lib/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('ar');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('rawaj_lang') : null;
    const initial = stored || 'ar';
    setLangState(initial);
    document.documentElement.lang = initial;
    document.documentElement.dir = initial === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem('rawaj_lang', code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (text) => translate(text, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
