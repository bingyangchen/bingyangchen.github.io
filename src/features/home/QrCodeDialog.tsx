import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { profile } from "../../data/profile";
import { useTranslation } from "../../i18n/context";
import { IconXLarge } from "../../icons";
import styles from "./QrCodeDialog.module.scss";

interface QrCodeDialogProperties {
  opener: HTMLButtonElement;
  onClose: () => void;
}

export default function QrCodeDialog({ opener, onClose }: QrCodeDialogProperties) {
  const { dictionary } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [opener]);

  return createPortal(
    // Backdrop clicks supplement the close button and native Escape handling.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className={styles.qr_modal_overlay}
      aria-labelledby="qr-modal-title"
      aria-describedby="qr-modal-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className={styles.qr_modal_close_button}
        aria-label={dictionary.qrModal.close}
        onClick={onClose}
      >
        <IconXLarge sideLength="20" />
      </button>
      <div className={styles.qr_modal_content}>
        <div className={styles.qr_modal_code_panel}>
          <QRCodeSVG value={profile.urls.site} size={240} level="M" />
        </div>
        <div className={styles.qr_modal_title} id="qr-modal-title">
          {dictionary.name}
        </div>
        <p className={styles.qr_modal_cta} id="qr-modal-description">
          {dictionary.qrModal.scanToConnect}
        </p>
      </div>
    </dialog>,
    document.body,
  );
}
