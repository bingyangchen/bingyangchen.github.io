import logo from "../../assets/logo.webp";
import styles from "./Logo.module.scss";

import { NavLink } from "react-router-dom";

export default function Logo() {
  const className = `${styles.main} ${styles.s} ${styles.invert}`;

  return (
    <NavLink to="/" className={className} onClick={() => window.scrollTo({ top: 0 })}>
      <img className={styles.logo} src={logo} alt="陳秉洋, Bing-Yang Chen" />
      <div className={styles.product_name}>byc1999.com</div>
    </NavLink>
  );
}
