import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { LanguageProvider, useTranslation } from "./context";
import { LanguageSwitcher } from "../components/LanguageSwitcher/LanguageSwitcher";

function LanguageProbe() {
  const { language, dictionary } = useTranslation();
  return <output>{language}:{dictionary.name}</output>;
}

function showLanguage(browserLanguage: string, saved?: string) {
  localStorage.clear();
  if (saved) localStorage.setItem("preferred_language", saved);
  Object.defineProperty(navigator, "language", { configurable: true, value: browserLanguage });
  return render(<LanguageProvider><LanguageProbe /><LanguageSwitcher /></LanguageProvider>);
}

afterEach(cleanup);

test("SITE-R3.1 儲存英文優先", () => {
  showLanguage("zh-TW", "en");
  expect(screen.getByRole("status")).toHaveTextContent("en:Bing-Yang Chen");
});

test("SITE-R3.2 儲存繁中優先", () => {
  showLanguage("en-US", "zh-TW");
  expect(screen.getByRole("status")).toHaveTextContent("zh-TW:陳秉洋");
});

test("SITE-R3.3 中文瀏覽器", () => {
  for (const locale of ["zh-TW", "zh-CN"]) {
    showLanguage(locale);
    expect(document.documentElement.lang).toBe("zh-TW");
    cleanup();
  }
});

test("SITE-R3.4 非中文瀏覽器", () => {
  for (const locale of ["en-US", "ja-JP"]) {
    showLanguage(locale);
    expect(document.documentElement.lang).toBe("en");
    cleanup();
  }
});

test("SITE-R3.5 無效偏好", () => {
  showLanguage("zh-TW", "unsupported");
  expect(document.documentElement.lang).toBe("zh-TW");
});

test("SITE-R4.1 雙向切換", () => {
  showLanguage("en-US");
  const toggle = screen.getByRole("button", { name: "Toggle language" });
  fireEvent.click(toggle);
  expect(screen.getByRole("status")).toHaveTextContent("zh-TW:陳秉洋");
  expect(localStorage.getItem("preferred_language")).toBe("zh-TW");
  expect(toggle).toHaveAttribute("title", "Switch to English");
  fireEvent.click(toggle);
  expect(screen.getByRole("status")).toHaveTextContent("en:Bing-Yang Chen");
  expect(localStorage.getItem("preferred_language")).toBe("en");
  expect(document.documentElement.lang).toBe("en");
});
