import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import ResumeSheet from "./ResumeSheet";

test("SITE-R10.4 列印與取消後還原介面語言", () => {
  const originalLanguage = document.documentElement.lang;
  document.documentElement.lang = "zh-TW";
  const sheetReference = createRef<HTMLDivElement>();
  const view = render(<ResumeSheet ref={sheetReference} />);
  try {
    expect(document.documentElement.lang).toBe("zh-TW");
    expect(sheetReference.current).toHaveAttribute("lang", "en");
    expect(screen.getByText("陳秉洋")).toHaveAttribute("lang", "zh-TW");

    fireEvent(window, new Event("beforeprint"));
    fireEvent(window, new Event("beforeprint"));
    expect(document.documentElement.lang).toBe("en");
    fireEvent(window, new Event("afterprint"));
    expect(document.documentElement.lang).toBe("zh-TW");

    document.documentElement.lang = "en";
    fireEvent(window, new Event("beforeprint"));
    fireEvent(window, new Event("afterprint"));
    expect(document.documentElement.lang).toBe("en");
  } finally {
    view.unmount();
    document.documentElement.lang = originalLanguage;
  }
});

test("SITE-R10.4 卸載時還原語言並清除列印事件", () => {
  const originalLanguage = document.documentElement.lang;
  document.documentElement.lang = "zh-TW";
  const view = render(<ResumeSheet />);
  try {
    fireEvent(window, new Event("beforeprint"));
    expect(document.documentElement.lang).toBe("en");
    view.unmount();
    expect(document.documentElement.lang).toBe("zh-TW");
    fireEvent(window, new Event("beforeprint"));
    expect(document.documentElement.lang).toBe("zh-TW");
    document.documentElement.lang = "en";
    fireEvent(window, new Event("afterprint"));
    expect(document.documentElement.lang).toBe("en");
  } finally {
    view.unmount();
    document.documentElement.lang = originalLanguage;
  }
});
