import { useState } from "react";
import type { ArtworkImage } from "./artwork";
import styles from "./Projects.module.scss";

export default function ProjectImage({
  image,
  className,
  secondary = false,
}: {
  image: ArtworkImage;
  className: string;
  secondary?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={`${styles.device} ${className}`}>
      <img
        className={styles.preview}
        src={image.preview}
        alt=""
        width={image.width}
        height={image.height}
        data-artwork-preview=""
        data-loaded={loaded || undefined}
      />
      <picture className={styles.fullSize}>
        {secondary && (
          // CSS hiding alone still downloads the desktop image on narrow screens.
          <source media={styles.compactArtworkMedia} srcSet={image.preview} />
        )}
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes="240px"
          alt=""
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
          data-artwork-image=""
          onLoad={(event) =>
            setLoaded(event.currentTarget.currentSrc !== image.preview)
          }
        />
      </picture>
    </span>
  );
}
