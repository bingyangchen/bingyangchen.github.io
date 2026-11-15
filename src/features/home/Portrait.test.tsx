import { StrictMode } from "react";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithLanguage } from "../../test-utils/render";
import Portrait from "./Portrait";

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute("open", "");
      }),
    },
    close: {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute("open");
      }),
    },
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  vi.restoreAllMocks();
  localStorage.clear();
  document.body.style.overflow = "";
});

test("Strict Mode 的 dialog 重開及卸載會還原捲動、焦點與 pointer listener", () => {
  // Replaying effects must not leave the page locked or keep a detached portrait alive.
  const addListener = vi.spyOn(document, "addEventListener");
  const removeListener = vi.spyOn(document, "removeEventListener");
  const view = renderWithLanguage(
    <StrictMode>
      <Portrait />
    </StrictMode>,
  );
  const opener = screen.getByRole("button", { name: "Show QR code" });
  const portrait = screen.getByRole("button", { name: "Flip portrait" });
  document.body.style.overflow = "scroll";
  fireEvent.click(portrait);
  expect(portrait).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(opener);
  expect(screen.getByRole("dialog")).toHaveAttribute("open");
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.click(screen.getByRole("button", { name: "Close QR code" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("scroll");
  expect(opener).toHaveFocus();
  expect(portrait).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(opener);
  const dialog = screen.getByRole("dialog");
  view.unmount();
  expect(dialog).not.toHaveAttribute("open");
  expect(document.body.style.overflow).toBe("scroll");
  const pointerListeners = addListener.mock.calls
    .filter(([type]) => type === "pointermove")
    .map(([, listener]) => listener);
  expect(pointerListeners).not.toHaveLength(0);
  for (const listener of pointerListeners)
    expect(removeListener.mock.calls).toContainEqual(["pointermove", listener]);
});
