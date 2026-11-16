import { useEffect, useRef, useState } from "react";
import avatarBackSmall from "../../assets/responsive/avatar_1-160.webp";
import avatarBackMedium from "../../assets/responsive/avatar_1-320.webp";
import avatarBackLarge from "../../assets/responsive/avatar_1-480.webp";
import avatarFrontSmall from "../../assets/responsive/avatar_2-160.webp";
import avatarFrontMedium from "../../assets/responsive/avatar_2-320.webp";
import avatarFrontLarge from "../../assets/responsive/avatar_2-480.webp";
import { RoundButton } from "../../components";
import { profile } from "../../data/profile";
import { useTranslation } from "../../i18n/context";
import { IconQrCode } from "../../icons";
import QrCodeDialog from "./QrCodeDialog";
import styles from "./Portrait.module.scss";

export default function Portrait() {
  const { dictionary } = useTranslation();
  const [isAvatarFlipped, setIsAvatarFlipped] = useState(false);
  const [isAvatarHoverSuppressed, setIsAvatarHoverSuppressed] = useState(false);
  const avatarPointerPositionRef = useRef<{ clientX: number; clientY: number } | null>(
    null,
  );
  const [qrCodeOpener, setQrCodeOpener] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    const recordPointerPosition = (event: PointerEvent) => {
      avatarPointerPositionRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
    };
    document.addEventListener("pointermove", recordPointerPosition, { passive: true });
    return () => document.removeEventListener("pointermove", recordPointerPosition);
  }, []);

  return (
    <>
      <div
        className={styles.avatar_container}
        onPointerLeave={() => setIsAvatarHoverSuppressed(false)}
      >
        <button
          type="button"
          className={styles.avatar_button}
          aria-label={dictionary.home.flipAvatar}
          aria-pressed={isAvatarFlipped}
          data-hover-suppressed={isAvatarHoverSuppressed || undefined}
          onClick={(event) => {
            const avatarContainer = event.currentTarget.parentElement!;
            const bounds = avatarContainer.getBoundingClientRect();
            const pointer = avatarPointerPositionRef.current;
            setIsAvatarFlipped((flipped) => !flipped);

            // Closing a dialog can delay :hover restoration past a keyboard click.
            setIsAvatarHoverSuppressed(
              event.detail > 0 ||
                avatarContainer.matches(":hover") ||
                (pointer !== null &&
                  pointer.clientX >= bounds.left &&
                  pointer.clientX < bounds.right &&
                  pointer.clientY >= bounds.top &&
                  pointer.clientY < bounds.bottom),
            );
          }}
        >
          <img
            className={`${styles.avatar} ${styles.front}`}
            src={avatarFrontSmall}
            srcSet={`${avatarFrontSmall} 160w, ${avatarFrontMedium} 320w, ${avatarFrontLarge} 480w`}
            sizes={styles.imageSizes}
            width={160}
            height={160}
            fetchPriority="high"
            alt={`${profile.name["zh-TW"]} (${profile.name.en})`}
          />
          <img
            className={`${styles.avatar} ${styles.back}`}
            src={avatarBackSmall}
            srcSet={`${avatarBackSmall} 160w, ${avatarBackMedium} 320w, ${avatarBackLarge} 480w`}
            sizes={styles.imageSizes}
            width={160}
            height={160}
            alt={`${profile.name["zh-TW"]} (${profile.name.en})`}
          />
        </button>
        <RoundButton
          className={styles.qr_avatar_fab}
          hintText={dictionary.qrModal.open}
          aria-haspopup="dialog"
          onClick={(event) => {
            setQrCodeOpener(event.currentTarget);
          }}
        >
          <IconQrCode sideLength="18" />
        </RoundButton>
      </div>
      {qrCodeOpener ? (
        <QrCodeDialog opener={qrCodeOpener} onClose={() => setQrCodeOpener(null)} />
      ) : null}
    </>
  );
}
