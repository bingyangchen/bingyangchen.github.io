import leechaiLogo from "../assets/leechai_logo.webp";
import leechaiThumbnail from "../assets/leechai_thumbnail.webp";
import noadsLogo from "../assets/noads_logo.webp";
import noadsThumbnail from "../assets/noads_thumbnail.webp";
import taiguLogo from "../assets/taigu_logo.webp";
import taiguThumbnail from "../assets/taigu_thumbnail.webp";

import type { Project } from "../types";

export const homeProjects: Project[] = [
  {
    thumbnail: <img src={taiguThumbnail} alt="Taigu" />,
    icon: <img src={taiguLogo} alt="Taigu" />,
    title: "Taigu",
    tags: ["PWA", "Investment"],
    maintaining_time_range: [new Date(2021, 1, 1)],
    description:
      "Track and monitor your investment performance with detailed analytics.",
    source_code_url: "https://github.com/bingyangchen/taigu",
    demo_url: "https://taigu.tw/welcome",
  },
  {
    thumbnail: <img src={noadsThumbnail} alt="Noads" />,
    icon: <img src={noadsLogo} alt="Noads" />,
    title: "Noads",
    tags: ["Chrome Extension", "Ad Blocker"],
    maintaining_time_range: [new Date(2024, 1, 1), new Date(2024, 1, 1)],
    description:
      "A simple ad blocker that removes specific DOM elements using CSS selectors.",
    source_code_url: "https://github.com/bingyangchen/noads",
    demo_url:
      "https://chromewebstore.google.com/detail/noads/mcdfnneilaagajpfcfiofdjibclkflhg",
  },
  {
    thumbnail: <img src={leechaiThumbnail} alt="Leechai 理柴" />,
    icon: <img src={leechaiLogo} alt="Leechai 理柴" />,
    title: "Leechai",
    tags: ["Personal Finance", "App"],
    maintaining_time_range: [new Date(2026, 1, 1)],
    description:
      "Explore various pathfinding algorithms and maze generation algorithms.",
    source_code_url: "https://github.com/bingyangchen/leechai",
    demo_url: "https://apps.apple.com/tw/app/leechai-%E7%90%86%E6%9F%B4/id6761012779",
  },
];
