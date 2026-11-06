import { asIcon, type IconSvgChildProperties } from "./IconLayout";
import styles from "./IconArrowUpRight.module.scss";

function ArrowUpRightPath(_properties: IconSvgChildProperties) {
  return (
    <path d="M22,0H10V2h10.586L.043,22.543l1.414,1.414L22,3.414V14h2V2c0-1.103-.897-2-2-2Z" />
  );
}

const ArrowUpRightSvg = asIcon(ArrowUpRightPath);

export default function IconArrowUpRight(properties: IconSvgChildProperties) {
  const className = [styles.main, properties.className].filter(Boolean).join(" ");
  return <ArrowUpRightSvg {...properties} className={className} />;
}
