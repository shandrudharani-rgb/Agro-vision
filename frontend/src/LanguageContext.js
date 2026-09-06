import React, { createContext, useContext, useEffect, useState } from "react";

  const LanguageContext = createContext();

  export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
      localStorage.getItem("language") || "en"
  );

  useEffect(() => {
    document.documentElement.lang = language === 'ta' ? 'ta' : 'en';
  }, [language]);

    const changeLanguage = (lang) => {
      setLanguage(lang);
      localStorage.setItem("language", lang);
    };

    return (
      <LanguageContext.Provider
        value={{ language, changeLanguage }}
      >
        {children}
      </LanguageContext.Provider>
    );
  };

  export const useLanguage = () => useContext(LanguageContext);
