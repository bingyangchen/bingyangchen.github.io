import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "../../i18n/context";
import { englishDictionary } from "../../i18n/dictionaries/en";
import { traditionalChineseDictionary } from "../../i18n/dictionaries/zhtw";
import Footer from "./Footer";

const languages = [
  { language: "en", dictionary: englishDictionary },
  { language: "zh-TW", dictionary: traditionalChineseDictionary },
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2030-01-02T00:00:00Z"));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

test.each(languages)("SITE-R6.3 Footer 內容 $language", ({ language, dictionary }) => {
  localStorage.setItem("preferred_language", language);
  render(
    <LanguageProvider>
      <Footer />
    </LanguageProvider>,
  );
  const footer = screen.getByRole("contentinfo", { name: dictionary.footer.title });
  expect(footer).toHaveTextContent(dictionary.footer.description);
  expect(footer).toHaveTextContent(`© 2030 ${dictionary.name}`);
  const navigation = within(footer).getByRole("navigation", {
    name: dictionary.footer.elsewhere,
  });
  const destinations = [
    ["GitHub", "https://github.com/bingyangchen"],
    ["LinkedIn", "https://www.linkedin.com/in/bing-yang-chen/"],
    ["Cake", "https://www.cake.me/me/BingYangChen"],
  ];
  expect(within(navigation).getAllByRole("link")).toHaveLength(3);
  for (const [name, href] of destinations) {
    const link = within(navigation).getByRole("link", { name });
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  expect(
    within(footer).getByRole("link", {
      name: `${dictionary.footer.home}: ${dictionary.name}`,
    }),
  ).toHaveAttribute("href", "/#home");
  expect(within(footer).queryByText(/Services|服務項目/)).not.toBeInTheDocument();
});

test.each(languages)(
  "SITE-R6.6 Footer 郵件入口 $language",
  ({ language, dictionary }) => {
    localStorage.setItem("preferred_language", language);
    render(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>,
    );
    const email = screen.getByRole("link", {
      name: `${dictionary.footer.email}: bryan.chen.429@gmail.com`,
    });
    expect(email).toHaveTextContent("bryan.chen.429@gmail.com");
    expect(email).toHaveAttribute("href", "mailto:bryan.chen.429@gmail.com");
    expect(email).not.toHaveAttribute("target");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(5);
  },
);

test.each(languages)("SITE-R19.4 Footer 文字入口 $language", ({ language }) => {
  localStorage.setItem("preferred_language", language);
  render(
    <LanguageProvider>
      <Footer />
    </LanguageProvider>,
  );
  for (const name of ["GitHub", "LinkedIn", "Cake"]) {
    const link = screen.getByRole("link", { name });
    fireEvent.mouseOver(link);
    fireEvent.focus(link);
    expect(link).toHaveTextContent(name);
    expect(link).not.toHaveAttribute("title");
    expect(link).toHaveAccessibleDescription("");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  }
});
