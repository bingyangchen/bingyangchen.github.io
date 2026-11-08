import { createRef } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import Tooltip from "./Tooltip";

afterEach(cleanup);

test("SITE-R19.1 視覺提示保留控制名稱、描述及原有操作", async () => {
  const reference = createRef<HTMLButtonElement>();
  const handleClick = vi.fn();
  render(
    <>
      <p id="profile-description">Open the public profile</p>
      <Tooltip text="GitHub">
        <button
          ref={reference}
          aria-label="GitHub"
          aria-describedby="profile-description"
          onClick={handleClick}
        >
          Profile
        </button>
      </Tooltip>
    </>,
  );
  const control = screen.getByRole("button", { name: "GitHub" });
  fireEvent.focus(control);
  await waitFor(() => expect(screen.getByText("GitHub")).toBeInTheDocument());
  expect(reference.current).toBe(control);
  expect(control).toHaveAccessibleName("GitHub");
  expect(control).toHaveAccessibleDescription(/^Open the public profile\s*$/);
  fireEvent.click(control);
  expect(handleClick).toHaveBeenCalledOnce();
});
