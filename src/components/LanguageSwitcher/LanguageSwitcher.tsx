import React from "react";

import { useTranslation } from "../../i18n/context";
import styles from "./LanguageSwitcher.module.scss";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, dictionary } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh-TW" : "en");
  };

  return (
    <button
      className={styles.switcher}
      type="button"
      data-language-switcher
      onClick={toggleLanguage}
      aria-label={dictionary.header.switchLanguage}
      title={dictionary.header.switchLanguage}
    >
      <span lang={language === "en" ? "zh-TW" : "en"}>
        {language === "en" ? "中文" : "English"}
      </span>
    </button>
  );
};
