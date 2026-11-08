import styles from "./Button.module.scss";

import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

interface ButtonAppearanceProperties {
  variant?: "primary" | "brand";
  size?: "large" | "extra-large";
  bold?: boolean;
  className?: string;
}

interface ButtonProperties
  extends ButtonAppearanceProperties, ButtonHTMLAttributes<HTMLButtonElement> {}

interface ButtonLinkProperties
  extends ButtonAppearanceProperties, AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

function getButtonClassName({
  variant = "primary",
  size = "large",
  bold = false,
  className,
}: ButtonAppearanceProperties): string {
  return [styles.button, styles[variant], styles[size], bold && styles.bold, className]
    .filter(Boolean)
    .join(" ");
}

export default function Button({
  variant,
  size,
  bold,
  className,
  children,
  type = "button",
  ...buttonProperties
}: ButtonProperties) {
  return (
    <button
      {...buttonProperties}
      type={type}
      className={getButtonClassName({ variant, size, bold, className })}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  bold,
  className,
  children,
  ...linkProperties
}: ButtonLinkProperties) {
  return (
    <a
      {...linkProperties}
      className={getButtonClassName({ variant, size, bold, className })}
    >
      {children}
    </a>
  );
}
