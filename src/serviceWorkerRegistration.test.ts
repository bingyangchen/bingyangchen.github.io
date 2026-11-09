import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { unregisterLegacyServiceWorkers } from "./serviceWorkerRegistration";

const LEGACY_SCOPE = `${window.location.origin}/`;
const LEGACY_SCRIPT_URL = `${LEGACY_SCOPE}service-worker.js`;
type Worker = Pick<ServiceWorker, "scriptURL">;

function makeRegistration(
  workers: Partial<Record<"active" | "waiting" | "installing", Worker | null>> = {
    active: { scriptURL: LEGACY_SCRIPT_URL },
  },
  scope = LEGACY_SCOPE,
) {
  return {
    scope,
    active: null,
    waiting: null,
    installing: null,
    ...workers,
    unregister: vi.fn().mockResolvedValue(true),
  };
}

const getRegistrations = vi.fn();

beforeEach(() => {
  getRegistrations.mockReset().mockResolvedValue([]);
  vi.stubGlobal("navigator", {
    serviceWorker: {
      getRegistrations,
      get ready() {
        throw new Error("Cleanup must not wait for an active worker");
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test.each([
  { active: { scriptURL: LEGACY_SCRIPT_URL } },
  { waiting: { scriptURL: LEGACY_SCRIPT_URL } },
  { installing: { scriptURL: LEGACY_SCRIPT_URL } },
  {
    active: { scriptURL: LEGACY_SCRIPT_URL },
    waiting: { scriptURL: LEGACY_SCRIPT_URL },
    installing: { scriptURL: LEGACY_SCRIPT_URL },
  },
])("SITE-R15.2 cleans known workers without waiting for ready: %j", async (workers) => {
  const registration = makeRegistration(workers);
  getRegistrations.mockResolvedValue([registration]);

  await unregisterLegacyServiceWorkers();

  expect(getRegistrations).toHaveBeenCalledTimes(1);
  expect(registration.unregister).toHaveBeenCalledTimes(1);
});

test.each([
  `${LEGACY_SCOPE}other-project/`,
  `${LEGACY_SCOPE}other-project`,
  `${LEGACY_SCOPE}?project=other`,
  "https://other.example/",
])("SITE-R15.3 preserves other scopes: %s", async (scope) => {
  const registration = makeRegistration(undefined, scope);
  getRegistrations.mockResolvedValue([registration]);

  await unregisterLegacyServiceWorkers();

  expect(registration.unregister).not.toHaveBeenCalled();
});

test.each([
  `${LEGACY_SCOPE}other-worker.js`,
  `${LEGACY_SCRIPT_URL}?version=other`,
  `${LEGACY_SCOPE}other-project/service-worker.js`,
  "https://other.example/service-worker.js",
])("SITE-R15.3 preserves other scripts: %s", async (scriptURL) => {
  const registration = makeRegistration({ active: { scriptURL } });
  getRegistrations.mockResolvedValue([registration]);

  await unregisterLegacyServiceWorkers();

  expect(registration.unregister).not.toHaveBeenCalled();
});

test.each(["active", "waiting", "installing"] as const)(
  "SITE-R15.3 preserves a registration with an unrelated %s worker",
  async (slot) => {
    const registration = makeRegistration({
      active: { scriptURL: LEGACY_SCRIPT_URL },
      waiting: { scriptURL: LEGACY_SCRIPT_URL },
      installing: { scriptURL: LEGACY_SCRIPT_URL },
      [slot]: { scriptURL: `${LEGACY_SCOPE}replacement-worker.js` },
    });
    getRegistrations.mockResolvedValue([registration]);

    await unregisterLegacyServiceWorkers();

    expect(registration.unregister).not.toHaveBeenCalled();
  },
);

test("SITE-R15.3 preserves registrations with no identifiable worker", async () => {
  const registration = makeRegistration({});
  getRegistrations.mockResolvedValue([registration]);

  await unregisterLegacyServiceWorkers();

  expect(registration.unregister).not.toHaveBeenCalled();
});

test("SITE-R15.3 finishes when no registrations exist", async () => {
  await expect(unregisterLegacyServiceWorkers()).resolves.toBeUndefined();
  expect(getRegistrations).toHaveBeenCalledTimes(1);
});

test("SITE-R15.3 supports browsers without the service worker API", async () => {
  vi.stubGlobal("navigator", {});

  await expect(unregisterLegacyServiceWorkers()).resolves.toBeUndefined();
  expect(getRegistrations).not.toHaveBeenCalled();
});

test("SITE-R15.3 handles registration query rejection", async () => {
  const error = new DOMException("Storage access denied", "SecurityError");
  getRegistrations.mockRejectedValue(error);
  const report = vi.spyOn(console, "error").mockImplementation(() => {});

  await expect(unregisterLegacyServiceWorkers()).resolves.toBeUndefined();

  expect(report).toHaveBeenCalledExactlyOnceWith(
    "Could not query legacy service worker registrations",
    error,
  );
});

test("SITE-R15.3 handles a synchronous registration query failure", async () => {
  const error = new DOMException("Storage access denied", "SecurityError");
  getRegistrations.mockImplementation(() => {
    throw error;
  });
  const report = vi.spyOn(console, "error").mockImplementation(() => {});

  await expect(unregisterLegacyServiceWorkers()).resolves.toBeUndefined();

  expect(report).toHaveBeenCalledExactlyOnceWith(
    "Could not query legacy service worker registrations",
    error,
  );
});

test("SITE-R15.3 handles unregister rejection", async () => {
  const registration = makeRegistration();
  const error = new DOMException("Unregister denied", "SecurityError");
  registration.unregister.mockRejectedValue(error);
  getRegistrations.mockResolvedValue([registration]);
  const report = vi.spyOn(console, "error").mockImplementation(() => {});

  await expect(unregisterLegacyServiceWorkers()).resolves.toBeUndefined();

  expect(report).toHaveBeenCalledExactlyOnceWith(
    "Could not unregister legacy service worker",
    error,
  );
});

test("SITE-R15.2 tolerates a registration already removed by another tab", async () => {
  const registration = makeRegistration();
  registration.unregister.mockResolvedValue(false);
  getRegistrations.mockResolvedValue([registration]);
  const report = vi.spyOn(console, "error").mockImplementation(() => {});

  await expect(unregisterLegacyServiceWorkers()).resolves.toBeUndefined();

  expect(registration.unregister).toHaveBeenCalledTimes(1);
  expect(report).not.toHaveBeenCalled();
});
