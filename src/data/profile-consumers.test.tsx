import { cleanup, fireEvent, within } from "@testing-library/react";
import { vi } from "vitest";
import Footer from "../components/Footer/Footer";
import Home from "../pages/Home/Home";
import Resume from "../features/resume";
import { renderWithLanguage } from "../test-utils/render";

vi.mock("./profile", async (importOriginal) => {
  const original = await importOriginal<typeof import("./profile")>();
  return {
    ...original,
    profile: {
      ...original.profile,
      email: "updated@example.test",
      urls: {
        site: "https://updated.example.test/profile/?ref=contact#home",
        github: "https://github.com/updated-person",
        linkedin: "https://www.linkedin.com/in/updated-person/",
        cake: "https://www.cake.me/me/updated-person",
        blog: "https://notes.example.test/",
      },
    },
  };
});

vi.mock("./career", async (importOriginal) => {
  const original = await importOriginal<typeof import("./career")>();
  return {
    ...original,
    workExperienceIdToFacts: {
      ...original.workExperienceIdToFacts,
      "swag-2026": {
        company: { en: "Example Labs", "zh-TW": "範例公司" },
        title: { en: "Staff Engineer", "zh-TW": "主任工程師" },
        period: {
          kind: "employment",
          start: { year: 2022, month: 8 },
          end: { year: 2024, month: 7 },
        },
      },
    },
  };
});

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => <svg data-qr-value={value} />,
}));

const dialogDescriptors = Object.getOwnPropertyDescriptors(HTMLDialogElement.prototype);
beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value() {} },
    close: { configurable: true, value() {} },
  });
});
afterAll(() => {
  for (const method of ["showModal", "close"]) {
    const descriptor = dialogDescriptors[method];
    if (descriptor)
      Object.defineProperty(HTMLDialogElement.prototype, method, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, method);
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

test.each(["en", "zh-TW"] as const)(
  "只修改來源後，%s 首頁、Footer、QR code 與履歷同步更新",
  (language) => {
    const view = renderWithLanguage(
      <>
        <Home />
        <Footer />
        <Resume />
      </>,
      language,
    );
    const content = within(view.container);
    expect(content.getAllByText("updated@example.test")).toHaveLength(3);
    expect(
      view.container.querySelectorAll('a[href="mailto:updated@example.test"]'),
    ).toHaveLength(2);
    for (const [url, count] of [
      ["https://github.com/updated-person", 4],
      ["https://www.linkedin.com/in/updated-person/", 2],
      ["https://www.cake.me/me/updated-person", 2],
    ] as const)
      expect(view.container.querySelectorAll(`a[href="${url}"]`)).toHaveLength(count);
    expect(
      view.container.querySelector('a[href="https://notes.example.test/list"]'),
    ).not.toBeNull();
    expect(
      view.container.querySelector(
        'a[href="https://updated.example.test/profile/?ref=contact#home"]',
      ),
    ).not.toBeNull();
    expect(content.getAllByText("updated.example.test")).toHaveLength(2);
    const jobTitle = language === "en" ? "Staff Engineer" : "主任工程師";
    const company = language === "en" ? "Example Labs" : "範例公司";
    expect(content.getByText(`${jobTitle} @ ${company}`)).toBeInTheDocument();
    const resume = within(
      view.container.querySelector<HTMLElement>("[data-resume-root]")!,
    );
    expect(resume.getByText("Aug. 2022 – Jul. 2024 (2 yrs)")).toBeInTheDocument();
    expect(
      resume.getByText(
        (_text, element) =>
          element?.tagName === "SPAN" &&
          element.textContent === "Staff Engineer · Example Labs",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      content.getByRole("button", {
        name: language === "en" ? "Show QR code" : "顯示 QR code",
      }),
    );
    expect(document.querySelector("[data-qr-value]")).toHaveAttribute(
      "data-qr-value",
      "https://updated.example.test/profile/?ref=contact#home",
    );
  },
);
