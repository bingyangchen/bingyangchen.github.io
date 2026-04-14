import logo from "../../assets/logo.webp";
import styles from "./Logo.module.scss";

import { NavLink } from "react-router-dom";

interface LogoProperties {
  size: "s" | "m" | "l";
  invert?: boolean;
  full?: boolean;
}

export default function Logo({ size, invert, full }: LogoProperties) {
  const sizeClass = size === "s" ? styles.s : size === "m" ? styles.m : styles.l;
  const className = [styles.main, sizeClass, invert && styles.invert]
    .filter(Boolean)
    .join(" ");

  return (
    <NavLink to="/" className={className} onClick={() => window.scrollTo({ top: 0 })}>
      <img className={styles.logo} src={logo} alt="陳秉洋, Bing-Yang Chen" />
      {full && <div className={styles.product_name}>byc1999.com</div>}
    </NavLink>
  );
}
