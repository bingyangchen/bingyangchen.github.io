import { act, render } from "@testing-library/react";
import TypingGreeting from "./TypingGreeting";

test("SITE-R13.1 完整問候與清理", () => {
  jest.useFakeTimers();
  jest.spyOn(Math, "random").mockReturnValue(0.5);
  const props = { className: "greeting", cursorClassName: "cursor" };
  const view = render(<TypingGreeting {...props} text="Old greeting." />);
  try {
    act(() => { jest.advanceTimersByTime(150); });
    view.rerender(<TypingGreeting {...props} text="New, greeting." />);
    act(() => { jest.runAllTimers(); });
    expect(view.container).toHaveTextContent("New, greeting.");
    expect(view.container.querySelector(".cursor")).toBeNull();
    expect(view.container).not.toHaveTextContent("Old greeting");
    view.rerender(<TypingGreeting {...props} text="Pending greeting" />);
    view.unmount();
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    view.unmount();
    jest.useRealTimers();
    jest.restoreAllMocks();
  }
});
