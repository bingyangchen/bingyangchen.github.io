// Source: https://swag.live/favicon.ico
import swagLogo from "../assets/swag_logo.webp";

// Source: https://www.gaia.net/images/ci/apple-icon-152x152.png
import gaiaLogo from "../assets/responsive/gaia_logo-64.webp";

// Source: https://cdn04.pinkoi.com/pinkoi.site/general/favicon/favicon_192x192.png
import pinkoiLogo from "../assets/responsive/pinkoi_logo-64.webp";

// Source: https://www.sysfeather.com/en-US/logo-sysfeather-v2.png
import sysfeatherLogo from "../assets/responsive/sysfeather_logo-64.webp";

// Source: https://www.bdsh.ntpc.edu.tw/var/file/0/1000/msys_1000_9064694_48923.png
import beidaLogo from "../assets/responsive/beida_logo-64.webp";

export const workExperienceItems = [
  { id: "swag-2026", company_logo: swagLogo },
  { id: "gaia-2024", company_logo: gaiaLogo },
  { id: "pinkoi-2023", company_logo: pinkoiLogo },
  { id: "sysfeather-2022", company_logo: sysfeatherLogo },
  { id: "beida-2020", company_logo: beidaLogo },
] as const;

export type WorkExperienceId = (typeof workExperienceItems)[number]["id"];
