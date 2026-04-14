import React from "react";

import { useTranslation } from "../../i18n/context";
import styles from "./LanguageSwitcher.module.scss";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh-TW" : "en");
  };

  return (
    <button
      className={styles.switcher}
      onClick={toggleLanguage}
      aria-label="Toggle language"
      title={language === "en" ? "切換至中文" : "Switch to English"}
    >
      <div className={`${styles.option} ${language === "en" ? styles.active : ""}`}>
        EN
      </div>
      <div className={styles.divider} />
      <div className={`${styles.option} ${language === "zh-TW" ? styles.active : ""}`}>
        中
      </div>
    </button>
  );
};
