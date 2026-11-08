import leechaiLogo from "../assets/responsive/leechai_logo-78.webp";
import noadsLogo from "../assets/responsive/noads_logo-78.webp";
import taiguLogo from "../assets/responsive/taigu_logo-78.webp";

import type { Project } from "../types";

export const homeProjects: Project[] = [
  {
    icon: <img src={taiguLogo} alt="Taigu" width={26} height={26} />,
    title: "Taigu",
    purpose: "A clearer view of your investments.",
    image_description: "Taigu investment overview and asset allocation screens",
    visit_label: "Explore Taigu",
    tags: ["PWA", "Investment"],
    maintaining_time_range: [new Date(2021, 1, 1)],
    description:
      "Track and monitor your investment performance with detailed analytics.",
    source_code_url: "https://github.com/bingyangchen/taigu",
    demo_url: "https://taigu.tw/welcome",
  },
  {
    icon: <img src={noadsLogo} alt="Noads" width={26} height={26} />,
    title: "Noads",
    purpose: "A cleaner web, on your terms.",
    image_description: "Noads extension interface for configuring CSS selectors",
    visit_label: "Chrome Web Store",
    tags: ["Chrome Extension", "Ad Blocker"],
    maintaining_time_range: [new Date(2024, 1, 1), new Date(2024, 1, 1)],
    description:
      "A simple ad blocker that removes specific DOM elements using CSS selectors.",
    source_code_url: "https://github.com/bingyangchen/noads",
    demo_url:
      "https://chromewebstore.google.com/detail/noads/mcdfnneilaagajpfcfiofdjibclkflhg",
  },
  {
    icon: <img src={leechaiLogo} alt="Leechai 理柴" width={26} height={26} />,
    title: "Leechai",
    purpose: "Everyday finances, made clearer.",
    image_description: "Leechai account overview and personal settings screens",
    visit_label: "View on the App Store",
    tags: ["Personal Finance", "App"],
    maintaining_time_range: [new Date(2026, 1, 1)],
    description:
      "Keep track of daily income and expenses, and manage your budget in one app.",
    source_code_url: "https://github.com/bingyangchen/leechai",
    demo_url: "https://apps.apple.com/tw/app/leechai-%E7%90%86%E6%9F%B4/id6761012779",
  },
];
