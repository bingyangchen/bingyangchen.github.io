import leechaiLogo from "../assets/responsive/leechai_logo-78.webp";
import noadsLogo from "../assets/responsive/noads_logo-78.webp";
import taiguLogo from "../assets/responsive/taigu_logo-78.webp";

export interface ProjectData {
  id: string;
  title: string;
  logo: string;
  startYear: number;
  endYear?: number;
  source_code_url: string;
  demo_url: string;
}

export const homeProjects = [
  {
    id: "taigu",
    title: "Taigu",
    logo: taiguLogo,
    startYear: 2021,
    source_code_url: "https://github.com/bingyangchen/taigu",
    demo_url: "https://taigu.tw/welcome",
  },
  {
    id: "noads",
    title: "Noads",
    logo: noadsLogo,
    startYear: 2024,
    endYear: 2024,
    source_code_url: "https://github.com/bingyangchen/noads",
    demo_url:
      "https://chromewebstore.google.com/detail/noads/mcdfnneilaagajpfcfiofdjibclkflhg",
  },
  {
    id: "leechai",
    title: "Leechai",
    logo: leechaiLogo,
    startYear: 2026,
    source_code_url: "https://github.com/bingyangchen/leechai",
    demo_url: "https://apps.apple.com/tw/app/leechai-%E7%90%86%E6%9F%B4/id6761012779",
  },
] as const satisfies readonly ProjectData[];

export type ProjectId = (typeof homeProjects)[number]["id"];
