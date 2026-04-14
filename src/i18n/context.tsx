import React, { createContext, useContext, useEffect, useState } from "react";

import { englishDictionary } from "./dictionaries/en";
import { traditionalChineseDictionary } from "./dictionaries/zhtw";
import type { Language, TranslationDictionary } from "./types";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  dictionary: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "preferred_language";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage === "en" || savedLanguage === "zh-TW") {
      return savedLanguage;
    }
    const browserLanguage = navigator.language;
    if (browserLanguage.startsWith("zh")) {
      return "zh-TW";
    }
    return "en";
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const dictionary =
    language === "zh-TW" ? traditionalChineseDictionary : englishDictionary;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dictionary }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};
