import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { renderWithLanguage } from "../../test-utils/render";
import { englishDictionary } from "../../i18n/dictionaries/en";
import { traditionalChineseDictionary } from "../../i18n/dictionaries/zhtw";
import Blog from "./Blog";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("SITE-R17.1 精選內容", () => {
  renderWithLanguage(<Blog />);
  expect(
    screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
  ).toEqual(["重新思考\n專案目錄結構", "Rate Limiter", "Clean Architecture"]);
  expect(screen.getAllByRole("link")).toHaveLength(4);
  const featured = screen.getByRole("link", {
    name: /重新思考\s+專案目錄結構 Read on GitBook/,
  });
  expect(
    within(featured).getByText(
      englishDictionary.blog.articles.directoryStructure.summary,
    ),
  ).toBeInTheDocument();
  expect(within(featured).getByText("Package by layer")).toBeInTheDocument();
  expect(within(featured).getByText("Package by feature")).toBeInTheDocument();
});

test("SITE-R17.2 文章外連", () => {
  renderWithLanguage(<Blog />);
  const destinations = [
    ["重新思考\n專案目錄結構", "system-design/chong-xin-si-kao-zhuan-an-mu-lu-jie-gou"],
    ["Rate Limiter", "system-design/rate-limiter"],
    ["Clean Architecture", "reading-notes/clean-architecture"],
  ];
  for (const [title, path] of destinations) {
    const link = screen.getByRole("link", { name: `${title} Read on GitBook` });
    expect(link).toHaveAttribute(
      "href",
      `https://blog.byc1999.com/software/software/${path}`,
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(link).queryAllByRole("link")).toHaveLength(0);
    expect(within(link).queryAllByRole("button")).toHaveLength(0);
  }
  expect(screen.getByRole("link", { name: "Browse all notes" })).toHaveAttribute(
    "href",
    "https://blog.byc1999.com/list",
  );
});

test("SITE-R17.3 雙語與原文", () => {
  renderWithLanguage(
    <>
      <Blog />
      <LanguageSwitcher />
    </>,
  );
  const originalTitles = screen
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
  const originalLinks = screen
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));
  expect(screen.getByText("Primarily in Traditional Chinese.")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: englishDictionary.header.switchLanguage }),
  );
  expect(
    screen.queryByText("Primarily in Traditional Chinese."),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(traditionalChineseDictionary.blog.articleLanguage),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("很多事寫下來之後，才知道自己是不是真的懂了。"),
  ).toBeInTheDocument();
  expect(
    screen.getByText(traditionalChineseDictionary.blog.articles.rateLimiter.summary),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
  ).toEqual(originalTitles);
  expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(
    originalLinks,
  );
  expect(
    screen.getByRole("heading", { name: /重新思考\s+專案目錄結構/ }),
  ).toHaveAttribute("lang", "zh-TW");
  expect(screen.getByRole("heading", { name: "Rate Limiter" })).toHaveAttribute(
    "lang",
    "en",
  );
});
