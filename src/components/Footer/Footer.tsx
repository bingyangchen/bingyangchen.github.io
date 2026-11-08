import logo from "../../assets/responsive/logo-96.webp";
import { useTranslation } from "../../i18n/context";
import { IconArrowUpRight } from "../../icons";
import styles from "./Footer.module.scss";

const CONTACT_EMAIL = "bryan.chen.429@gmail.com";
const [emailLocalPart, emailDomain] = CONTACT_EMAIL.split("@");
const SOCIAL_LINKS = [
  { name: "GitHub", href: "https://github.com/bingyangchen" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/bing-yang-chen/" },
  { name: "Cake", href: "https://www.cake.me/me/BingYangChen" },
];

export default function Footer() {
  const { dictionary } = useTranslation();
  const { footer: copy } = dictionary;

  return (
    <footer className={styles.main} aria-labelledby="footer-title">
      <div className={styles.container}>
        <div className={styles.contactGrid}>
          <div className={styles.contact}>
            <h2 id="footer-title">{copy.title}</h2>
            <p>{copy.description}</p>
            <a
              className={styles.email}
              href={`mailto:${CONTACT_EMAIL}`}
              draggable={false}
              aria-label={`${copy.email}: ${CONTACT_EMAIL}`}
            >
              <span>
                {emailLocalPart}
                <wbr />@{emailDomain}
              </span>
              <span className={styles.emailAction} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12h16m-6-6 6 6-6 6" />
                </svg>
              </span>
            </a>
          </div>
          <nav className={styles.platforms} aria-label={copy.elsewhere}>
            <h3>{copy.elsewhere}</h3>
            <ul>
              {SOCIAL_LINKS.map((link) => (
                <li key={link.name}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    <span>{link.name}</span>
                    <IconArrowUpRight aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className={styles.colophon}>
          <a
            className={styles.identity}
            href="/#home"
            aria-label={`${copy.home}: ${dictionary.name}`}
          >
            <img src={logo} alt="" width="32" height="32" />
            <span className={styles.signature}>
              <span className={styles.name}>{dictionary.name}</span>
              <span className={styles.domain}>byc1999.com</span>
            </span>
          </a>
          <p>
            © {new Date().getFullYear()} {dictionary.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
