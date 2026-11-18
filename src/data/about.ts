import streetSmall from "../assets/about/web/street-480.webp";
import streetMedium from "../assets/about/web/street-960.webp";
import streetLarge from "../assets/about/web/street-1440.webp";
import architectureSmall from "../assets/about/web/architecture-480.webp";
import architectureMedium from "../assets/about/web/architecture-960.webp";
import architectureLarge from "../assets/about/web/architecture-1440.webp";
import coastSmall from "../assets/about/web/coast-480.webp";
import coastMedium from "../assets/about/web/coast-960.webp";
import coastLarge from "../assets/about/web/coast-1440.webp";
import passageSmall from "../assets/about/web/passage-480.webp";
import passageMedium from "../assets/about/web/passage-960.webp";
import passageLarge from "../assets/about/web/passage-1440.webp";

export const aboutTopics = ["origin", "work", "curiosity"] as const;
export type AboutTopic = (typeof aboutTopics)[number];

export const photographs = [
  {
    id: "street",
    width: 6000,
    height: 4000,
    small: streetSmall,
    medium: streetMedium,
    large: streetLarge,
  },
  {
    id: "architecture",
    width: 1917,
    height: 2875,
    small: architectureSmall,
    medium: architectureMedium,
    large: architectureLarge,
  },
  {
    id: "coast",
    width: 2795,
    height: 4192,
    small: coastSmall,
    medium: coastMedium,
    large: coastLarge,
  },
  {
    id: "passage",
    width: 1920,
    height: 2881,
    small: passageSmall,
    medium: passageMedium,
    large: passageLarge,
  },
] as const;

export type AboutPhoto = (typeof photographs)[number]["id"];
