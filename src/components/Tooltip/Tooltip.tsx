import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HTMLAttributes, ReactElement, SyntheticEvent, useState } from "react";

import styles from "./Tooltip.module.scss";

interface TooltipProperties {
  text: string;
  children: ReactElement<HTMLAttributes<HTMLElement>>;
}

export default function Tooltip({ text, children }: TooltipProperties) {
  const [isOpen, setIsOpen] = useState(false);

  // Radix can close on pointer departure or scroll while keyboard focus remains.
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const closeFocusHint = () => setIsFocusOpen(false);

  function updateFocusHint(event: SyntheticEvent<HTMLElement>) {
    setIsFocusOpen(event.currentTarget.matches(":focus-visible"));
  }

  return (
    <TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={0}>
      <TooltipPrimitive.Root open={isOpen || isFocusOpen} onOpenChange={setIsOpen}>
        <TooltipPrimitive.Trigger
          asChild
          onFocus={updateFocusHint}
          onPointerEnter={updateFocusHint}
          onBlur={closeFocusHint}
          onPointerDown={closeFocusHint}
          onClick={closeFocusHint}
        >
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={styles.content}
            side="bottom"
            sideOffset={Number(styles.gap)}
            collisionPadding={Number(styles.viewportPadding)}
            onEscapeKeyDown={closeFocusHint}
            onPointerDownOutside={closeFocusHint}
            role="presentation"
            data-tooltip-content
          >
            {/* Hide only the text: aria-describedby would still read a directly referenced hidden container. */}
            <span aria-hidden="true">{text}</span>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
