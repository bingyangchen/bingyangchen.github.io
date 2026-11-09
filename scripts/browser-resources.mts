import { getImageDecodeFailures } from "./image-decoding.mts";
import type { Page, HTTPRequest, HTTPResponse, ConsoleMessage } from "puppeteer";
export async function watchPageResources(page: Page) {
  const failures: string[] = [];
  let stopped = false;
  const describeRequest = (request: HTTPRequest) =>
    `${request.method()} ${request.url()} (${request.resourceType()})`;
  const onRequest = async (request: HTTPRequest) => {
    const url = new URL(request.url());
    const allowed =
      url.protocol === "data:" ||
      url.protocol === "blob:" ||
      ((url.protocol === "http:" || url.protocol === "https:") &&
        ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname));
    try {
      if (allowed) {
        await request.continue();
      } else {
        failures.push(`Unexpected external request: ${describeRequest(request)}`);
        await request.abort("blockedbyclient");
      }
    } catch (error) {
      if (!stopped)
        failures.push(`Request interception: ${describeRequest(request)}: ${error}`);
    }
  };
  const onRequestFailed = (request: HTTPRequest) => {
    // Picture changes and DOM replacement cancel obsolete images; current images still must decode.
    if (
      request.resourceType() === "image" &&
      request.failure()?.errorText === "net::ERR_ABORTED"
    )
      return;
    failures.push(
      `Request failed: ${describeRequest(request)}: ${request.failure()?.errorText}`,
    );
  };
  const onResponse = (response: HTTPResponse) => {
    const request = response.request();
    const status = response.status();
    if (status >= 400) failures.push(`HTTP ${status}: ${describeRequest(request)}`);
    const contentType = response.headers()["content-type"] ?? "";
    if (
      request.resourceType() === "image" &&
      status >= 200 &&
      status < 300 &&
      !contentType.startsWith("image/")
    )
      failures.push(
        `Invalid image response (${contentType}): ${describeRequest(request)}`,
      );
  };
  const onPageError = (error: unknown) =>
    failures.push(`Uncaught browser error: ${String(error)}`);
  const onConsole = (message: ConsoleMessage) => {
    if (message.type() === "error") {
      const location = message.location();
      failures.push(
        `Console error: ${message.text()} (${location.url ?? "page"}:${location.lineNumber ?? 0})`,
      );
    }
  };

  await page.setRequestInterception(true);
  page.on("request", onRequest);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);
  page.on("pageerror", onPageError);
  page.on("console", onConsole);

  return {
    failures,
    async assertLoaded() {
      const imageFailures = await page.evaluate(getImageDecodeFailures);
      const errors = [...failures, ...imageFailures];
      if (errors.length)
        throw new Error(`Browser resource failures:\n  ${errors.join("\n  ")}`);
    },
    stop() {
      stopped = true;
      page.off("request", onRequest);
      page.off("requestfailed", onRequestFailed);
      page.off("response", onResponse);
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
    },
  };
}
