import { cleanup, screen, within } from "@testing-library/react";
import { renderWithLanguage } from "../../test-utils/render";
import About from "./About";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

test.each([
  [
    "en",
    "About",
    [
      "Economics, then code. What changed?",
      "What have you built?",
      "What do you do outside of work?",
    ],
    "Download full resume",
  ],
  [
    "zh-TW",
    "關於",
    ["經濟學，怎麼走到寫程式？", "你做過哪些產品？", "工作之外，你喜歡做什麼？"],
    "下載完整履歷",
  ],
] as const)("SITE-R6.10 %s 依序顯示完整訪談", (language, title, questions, resume) => {
  renderWithLanguage(<About />, language);
  const about = screen.getByRole("region", { name: title });
  const chapters = within(about).getAllByRole("article");
  expect(chapters).toHaveLength(3);
  expect(
    chapters.map((chapter) => within(chapter).getByRole("heading").textContent),
  ).toEqual(questions);
  expect(chapters[0].textContent).toMatch(
    language === "en"
      ? /economics.*creating value.*solve a problem for someone else/
      : /經濟學.*創造價值.*替人解決問題/,
  );
  expect(chapters[1].textContent).toMatch(
    language === "en"
      ? /Pinkoi.*AI knowledge platform.*games at Swag/
      : /Pinkoi.*企業 AI 知識平台.*Swag.*遊戲/,
  );
  expect(chapters[2].textContent).toMatch(
    language === "en" ? /psychology.*calligraphy.*photos/ : /心理學.*書法.*拍照/,
  );
  expect(within(chapters[1]).getByRole("link", { name: resume })).toHaveAttribute(
    "href",
    "/resume.pdf",
  );
  expect(within(chapters[2]).getAllByRole("img")).toHaveLength(4);
  expect(within(chapters[2]).queryByRole("link")).toBeNull();
});
