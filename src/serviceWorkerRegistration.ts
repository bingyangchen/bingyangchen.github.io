export async function unregisterLegacyServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  let registrations: readonly ServiceWorkerRegistration[];
  try {
    registrations = await navigator.serviceWorker.getRegistrations();
  } catch (error) {
    console.error("Could not query legacy service worker registrations", error);
    return;
  }

  const legacyScope = `${window.location.origin}/`;
  const legacyScriptUrl = `${legacyScope}service-worker.js`;
  for (const registration of registrations) {
    if (registration.scope !== legacyScope) continue;
    const workers = [
      registration.active,
      registration.waiting,
      registration.installing,
    ].filter((worker) => worker !== null);
    if (
      workers.length === 0 ||
      workers.some((worker) => worker.scriptURL !== legacyScriptUrl)
    )
      continue;

    try {
      await registration.unregister();
    } catch (error) {
      console.error("Could not unregister legacy service worker", error);
    }
  }
}
