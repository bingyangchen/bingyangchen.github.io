import { vi } from "vitest";
import { cleanup, fireEvent, within } from "@testing-library/react";
import { renderWithLanguage } from "../../test-utils/render";
import * as printing from "./print";
import Resume from "./Resume";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

test("SITE-R10.2 非公開預覽列印", () => {
  const print = vi
    .spyOn(printing, "openResumePrintDialog")
    .mockImplementation(() => {});
  const { container } = renderWithLanguage(<Resume />);
  fireEvent.click(within(container).getByRole("button", { name: "Download PDF" }));
  expect(print).toHaveBeenCalledTimes(1);
});
