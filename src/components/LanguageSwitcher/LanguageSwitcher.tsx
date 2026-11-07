import React from "react";

import { useTranslation } from "../../i18n/context";
import Tooltip from "../Tooltip/Tooltip";
import styles from "./LanguageSwitcher.module.scss";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, dictionary } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh-TW" : "en");
  };

  return (
    <Tooltip text={dictionary.header.switchLanguage}>
      <button
        className={styles.switcher}
        type="button"
        data-language-switcher
        onClick={toggleLanguage}
        aria-label={dictionary.header.switchLanguage}
      >
        <span lang={language === "en" ? "zh-TW" : "en"}>
          {language === "en" ? "中文" : "English"}
        </span>
      </button>
    </Tooltip>
  );
};
