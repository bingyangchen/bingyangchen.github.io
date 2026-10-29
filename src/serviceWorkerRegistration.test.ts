import { unregister } from "./serviceWorkerRegistration";

test("SITE-R15.2 既有 Registration 清理", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
  const remove = jest.fn().mockResolvedValue(true);
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { ready: Promise.resolve({ unregister: remove }) } });
  try {
    unregister();
    await Promise.resolve();
    expect(remove).toHaveBeenCalledTimes(1);
  } finally {
    if (descriptor) Object.defineProperty(navigator, "serviceWorker", descriptor);
    else Reflect.deleteProperty(navigator, "serviceWorker");
  }
});
