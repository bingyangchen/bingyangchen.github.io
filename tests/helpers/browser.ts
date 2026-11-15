import { type Page, type CDPSession } from "@playwright/test";

// Emulation overrides reset when their CDP session detaches.
const pageToSession = new WeakMap<Page, Promise<CDPSession>>();

function getCDPSession(page: Page) {
  let session = pageToSession.get(page);
  if (!session) {
    session = page.context().newCDPSession(page);
    pageToSession.set(page, session);
  }
  return session;
}

export async function setJavaScriptEnabled(page: Page, enabled: boolean) {
  const session = await getCDPSession(page);
  await session.send("Emulation.setScriptExecutionDisabled", { value: !enabled });
}
