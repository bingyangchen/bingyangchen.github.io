import { openResumePrintDialog } from "./print";

test("SITE-R10.3 字型等待與替代路徑", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(document, "fonts");
  const print = jest.spyOn(window, "print").mockImplementation(() => {});
  let ready: () => void = () => {};
  const fontReady = new Promise<void>((resolve) => { ready = resolve; });
  try {
    Object.defineProperty(document, "fonts", { configurable: true, value: { ready: fontReady } });
    openResumePrintDialog();
    expect(print).not.toHaveBeenCalled();
    ready();
    await fontReady;
    expect(print).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, "fonts", { configurable: true, value: undefined });
    openResumePrintDialog();
    expect(print).toHaveBeenCalledTimes(2);
  } finally {
    if (descriptor) Object.defineProperty(document, "fonts", descriptor);
    else Reflect.deleteProperty(document, "fonts");
    print.mockRestore();
  }
});
