import { useState, type ImgHTMLAttributes } from "react";
import styles from "./BrandImage.module.scss";

interface BrandImageProperties extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "onError"
> {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function BrandImage({
  src,
  alt,
  className,
  ...properties
}: BrandImageProperties) {
  const [failedSource, setFailedSource] = useState<string>();
  return (
    <img
      loading="lazy"
      decoding="async"
      {...properties}
      src={src}
      alt={alt}
      className={[styles.image, className].filter(Boolean).join(" ")}
      data-brand-image=""
      data-image-failed={failedSource === src || undefined}
      onError={() => setFailedSource(src)}
    />
  );
}
