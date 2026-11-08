import { vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "../components/LanguageSwitcher/LanguageSwitcher";
import { LanguageProvider, useTranslation } from "./context";

function LanguageProbe() {
  const { language, dictionary } = useTranslation();
  return (
    <output>
      {language}:{dictionary.name}
    </output>
  );
}

function showLanguage(browserLanguage: string, saved?: string) {
  if (saved) localStorage.setItem("preferred_language", saved);
  Object.defineProperty(navigator, "language", {
    configurable: true,
    value: browserLanguage,
  });
  return render(
    <LanguageProvider>
      <LanguageProbe />
      <LanguageSwitcher />
    </LanguageProvider>,
  );
}

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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
  const toggle = screen.getByRole("button", { name: "Switch to Traditional Chinese" });
  expect(toggle).toHaveTextContent("中文");
  fireEvent.click(toggle);
  expect(toggle).toHaveTextContent("English");
  expect(screen.getByRole("status")).toHaveTextContent("zh-TW:陳秉洋");
  expect(localStorage.getItem("preferred_language")).toBe("zh-TW");
  expect(toggle).not.toHaveAttribute("title");
  expect(screen.getByText("切換成英文")).toHaveAttribute("aria-hidden", "true");
  fireEvent.click(toggle);
  expect(screen.getByRole("status")).toHaveTextContent("en:Bing-Yang Chen");
  expect(localStorage.getItem("preferred_language")).toBe("en");
  expect(document.documentElement.lang).toBe("en");
});

test.each(["zh-TW", "zh-CN", "en-US", "ja-JP"])(
  "SITE-R3.6 讀取儲存失敗時依瀏覽器語言選擇：%s",
  (browserLanguage) => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage access denied", "SecurityError");
    });

    showLanguage(browserLanguage);

    const expectedLanguage = browserLanguage.startsWith("zh") ? "zh-TW" : "en";
    expect(document.documentElement.lang).toBe(expectedLanguage);
    expect(screen.getByRole("status")).toHaveTextContent(
      expectedLanguage === "zh-TW" ? "zh-TW:陳秉洋" : "en:Bing-Yang Chen",
    );
  },
);

test("SITE-R3.6 SITE-R4.6 localStorage 本身被拒絕時仍可瀏覽與雙向切換", () => {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("Storage access denied", "SecurityError");
  });

  showLanguage("zh-TW");
  const toggle = screen.getByRole("button", { name: "切換成英文" });
  expect(screen.getByRole("status")).toHaveTextContent("zh-TW:陳秉洋");

  fireEvent.click(toggle);
  expect(screen.getByRole("status")).toHaveTextContent("en:Bing-Yang Chen");
  expect(document.documentElement.lang).toBe("en");
  expect(toggle).toHaveAccessibleName("Switch to Traditional Chinese");

  fireEvent.click(toggle);
  expect(screen.getByRole("status")).toHaveTextContent("zh-TW:陳秉洋");
  expect(document.documentElement.lang).toBe("zh-TW");
});

test.each(["SecurityError", "QuotaExceededError"])(
  "SITE-R4.6 寫入儲存失敗時仍可雙向切換：%s",
  (errorName) => {
    showLanguage("en-US");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Cannot save preference", errorName);
    });

    const toggle = screen.getByRole("button", {
      name: "Switch to Traditional Chinese",
    });
    fireEvent.click(toggle);
    expect(screen.getByRole("status")).toHaveTextContent("zh-TW:陳秉洋");
    expect(document.documentElement.lang).toBe("zh-TW");
    expect(toggle).toHaveAccessibleName("切換成英文");
    expect(localStorage.getItem("preferred_language")).toBeNull();

    fireEvent.click(toggle);
    expect(screen.getByRole("status")).toHaveTextContent("en:Bing-Yang Chen");
    expect(document.documentElement.lang).toBe("en");
  },
);
