import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./static-server.mts";

export { startStaticServer };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startStaticServer(
    fileURLToPath(new URL("../build/", import.meta.url)),
  );
  console.log(`Preview: ${server.origin} (no SPA fallback)`);
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      void server.close().catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
    });
}
