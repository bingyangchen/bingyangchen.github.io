import { getImageDecodeFailures } from "../../scripts/image-decoding.mts";
import {
  type Page,
  type Request,
  type Route,
  type Response,
  type ConsoleMessage,
} from "@playwright/test";

export async function watchPageResources(page: Page) {
  const failures: string[] = [];
  const consoleMessages: string[] = [];
  let stopped = false;
  const describeRequest = (request: Request) =>
    `${request.method()} ${request.url()} (${request.resourceType()})`;
  const routeRequest = async (route: Route) => {
    try {
      const request = route.request();
      const url = new URL(request.url());
      if (
        ["data:", "blob:"].includes(url.protocol) ||
        (["http:", "https:"].includes(url.protocol) &&
          ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
      ) {
        await route.continue();
      } else {
        failures.push(`Unexpected external request: ${describeRequest(request)}`);
        await route.abort("blockedbyclient");
      }
    } catch (error) {
      if (!stopped)
        failures.push(
          `Request interception: ${route.request().url()}: ${String(error)}`,
        );
    }
  };
  const onRequestFailed = (request: Request) => {
    // Playwright reports delegation to the OS mail client as an aborted document navigation.
    if (
      request.isNavigationRequest() &&
      new URL(request.url()).protocol === "mailto:" &&
      request.failure()?.errorText === "net::ERR_ABORTED"
    )
      return;
    // Responsive image replacement cancels obsolete requests; current images still must decode.
    if (
      request.resourceType() === "image" &&
      request.failure()?.errorText === "net::ERR_ABORTED"
    )
      return;
    failures.push(
      `Request failed: ${describeRequest(request)}: ${request.failure()?.errorText}`,
    );
  };
  const onResponse = (response: Response) => {
    const request = response.request();
    const status = response.status();
    if (status >= 400) failures.push(`HTTP ${status}: ${describeRequest(request)}`);
    const type = response.headers()["content-type"] ?? "";
    if (
      request.resourceType() === "image" &&
      status >= 200 &&
      status < 300 &&
      !type.startsWith("image/")
    )
      failures.push(`Invalid image response (${type}): ${describeRequest(request)}`);
  };
  const onPageError = (error: Error) => {
    failures.push(`Uncaught browser error: ${error.message}`);
  };
  const onConsole = (message: ConsoleMessage) => {
    consoleMessages.push(`[${message.type()}] ${message.text()}`);
    if (message.type() === "error") {
      const location = message.location();
      failures.push(
        `Console error: ${message.text()} (${location.url}:${location.lineNumber})`,
      );
    }
  };
  await page.route("**/*", routeRequest);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  return {
    failures,
    consoleMessages,
    async assertLoaded() {
      const imageFailures = await page.evaluate(getImageDecodeFailures);
      const errors = [...failures, ...imageFailures];
      if (errors.length)
        throw new Error(`Browser resource failures:\n  ${errors.join("\n  ")}`);
    },
    async stop() {
      stopped = true;
      page.off("requestfailed", onRequestFailed);
      page.off("response", onResponse);
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
      if (!page.isClosed()) await page.unroute("**/*", routeRequest);
    },
  };
}
