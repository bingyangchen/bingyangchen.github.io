import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { LanguageProvider } from "../i18n/context";
import type { Language } from "../i18n/types";

export function renderWithLanguage(ui: ReactElement, language: Language = "en") {
  localStorage.setItem("preferred_language", language);
  return render(ui, { wrapper: LanguageProvider });
}
