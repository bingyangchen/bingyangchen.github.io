import React from "react";

function greetingDelayMs(fullText: string, index: number): number {
  if (index !== 0) {
    if (fullText[index - 1] === ".") return 550;
    if (fullText[index - 1] === ",") return 300;
  }
  return Math.max(0.1, Math.random()) * 200;
}

export interface TypingGreetingProps {
  text: string;
  className: string;
  cursorClassName: string;
}

const TypingGreeting = React.memo(function TypingGreeting({
  text,
  className,
  cursorClassName,
}: TypingGreetingProps): React.ReactElement {
  // Start at the finished state: the prerendered snapshot then contains the
  // whole greeting (good for crawlers). The layout effect below rewinds to empty
  // before the browser paints, so the animation still plays from the start.
  const [typed, setTyped] = React.useState(text);
  const [complete, setComplete] = React.useState(true);

  React.useLayoutEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    setTyped("");
    setComplete(false);

    const step = (i: number): void => {
      if (cancelled || i >= text.length) return;
      timeoutId = setTimeout(
        () => {
          if (cancelled) return;
          setTyped(text.slice(0, i + 1));
          setComplete(i === text.length - 1);
          step(i + 1);
        },
        greetingDelayMs(text, i),
      );
    };

    step(0);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [text]);

  return (
    <div className={className}>
      {typed}
      {!complete && <span className={cursorClassName}>|</span>}
    </div>
  );
});

export default TypingGreeting;
