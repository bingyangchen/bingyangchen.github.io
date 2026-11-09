export async function getImageDecodeFailures(): Promise<string[]> {
  const getCandidate = (image: HTMLImageElement) =>
    [image.currentSrc, image.src, image.srcset] as const;
  const isCurrentCandidate = (
    image: HTMLImageElement,
    candidate: ReturnType<typeof getCandidate>,
  ) => candidate.every((value, index) => value === getCandidate(image)[index]);

  for (;;) {
    const images = Array.from(document.images);
    const imageToCandidate = new Map<
      HTMLImageElement,
      ReturnType<typeof getCandidate>
    >();
    const failures = await Promise.all(
      images.map(async (image) => {
        const loading = image.getAttribute("loading");
        try {
          // Decoding deferred images must not change the captured loading attributes.
          image.loading = "eager";
          while (image.isConnected) {
            const candidate = getCandidate(image);
            imageToCandidate.set(image, candidate);
            try {
              await image.decode();
            } catch {
              if (!image.isConnected) return null;
              if (isCurrentCandidate(image, candidate))
                return `Image cannot be decoded: ${image.currentSrc || image.src} (image)`;
              continue;
            }
            // Responsive selection can replace the request while decode is pending.
            if (isCurrentCandidate(image, candidate)) return null;
          }
          return null;
        } finally {
          if (loading === null) image.removeAttribute("loading");
          else image.setAttribute("loading", loading);
        }
      }),
    );
    const currentImages = Array.from(document.images);
    if (
      images.length === currentImages.length &&
      images.every((image, index) => {
        const candidate = imageToCandidate.get(image);
        return (
          currentImages[index] === image &&
          candidate !== undefined &&
          isCurrentCandidate(image, candidate)
        );
      })
    )
      return failures.filter((failure): failure is string => failure !== null);
  }
}
