import styles from "./Footer.module.scss";

import { useTranslation } from "../../i18n/context";
import { IconCSquareFill, IconGitHub, IconLinkedIn } from "../../icons";
import Logo from "../Logo/Logo";

export default function Footer() {
  const { dictionary } = useTranslation();
  const { footer } = dictionary;
  return (
    <footer className={styles.main}>
      <div className={`${styles.section} ${styles.contact_me}`}>
        <div className={styles.title}>{footer.contactMe}</div>
        <div className={styles.body}>bryan.chen.429@gmail.com</div>
      </div>
      <div className={`${styles.section} ${styles.services}`}>
        <div className={styles.title}>{footer.services}</div>
        <div className={styles.list}>
          <div className={styles.item}>{footer.personalBranding}</div>
          <hr />
          <div className={styles.item}>{footer.corporateBranding}</div>
          <hr />
          <div className={styles.item}>{footer.internalSystems}</div>
          <hr />
          <div className={styles.item}>{footer.otherWebApps}</div>
          <hr />
          <div className={styles.item}>{footer.programmingInstruction}</div>
          <hr />
          <div className={styles.item}>{footer.economicsInstruction}</div>
          <hr />
        </div>
      </div>
      <div className={`${styles.section} ${styles.social_media}`}>
        <div className={styles.title}>{footer.socialMedia}</div>
        <div className={styles.list}>
          <a
            href="https://github.com/bingyangchen"
            target="_blank"
            rel="noreferrer noopener"
            className={styles.item}
            title="GitHub"
          >
            <IconGitHub sideLength="20" />
            <span>GitHub</span>
          </a>
          <hr />
          <a
            href="https://www.linkedin.com/in/bing-yang-chen/"
            target="_blank"
            rel="noreferrer noopener"
            className={styles.item}
            title="LinkedIn"
          >
            <IconLinkedIn sideLength="18.5" />
            <span>LinkedIn</span>
          </a>
          <hr />
          <a
            href="https://www.cake.me/me/BingYangChen"
            target="_blank"
            rel="noreferrer noopener"
            className={styles.item}
            title="Cake"
          >
            <IconCSquareFill sideLength="18.5" />
            <span>Cake</span>
          </a>
          <hr />
        </div>
      </div>
      <Logo size="s" full invert />
      <div className={`${styles.section} ${styles.copyright}`}>
        Copyright © {new Date().getFullYear()} {dictionary.name} All rights reserved
      </div>
    </footer>
  );
}
