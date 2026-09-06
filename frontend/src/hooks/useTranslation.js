import { useLanguage } from '../LanguageContext';
import en from '../locales/en';
import ta from '../locales/ta';

export const useTranslation = () => {
  const { language, changeLanguage } = useLanguage();
  const dictionary = language === 'ta' ? ta : en;
  // The fallback parameter is for dynamic API/database values. Static UI must
  // always use a key, while dynamic values are translated when a mapping exists.
  const lookup = (source, key) => key.split('.').reduce((value, part) => value?.[part], source);
  const t = (key, fallback) => lookup(dictionary, key) ?? lookup(en, key) ?? fallback ?? key;
  return { t, language, changeLanguage };
};
