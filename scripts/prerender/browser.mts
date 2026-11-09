import type { Browser } from "puppeteer";
export async function closeBrowser(browser: Browser | undefined, timeoutMs: number) {
  if (!browser) return;
  let timer;
  try {
    await Promise.race([
      browser.close(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Browser cleanup timed out")),
          timeoutMs,
        );
      }),
    ]);
  } catch (error) {
    browser.process()?.kill("SIGKILL");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
