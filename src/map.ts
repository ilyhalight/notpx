import path from "node:path";

import { PixelRequest } from "./requests/pixels";
import config from "./config";

const pixelRequest = new PixelRequest({
  userAgent: config.userAgent,
  domain: config.domain,
  auth: config.auth[0],
});

async function download() {
  console.log("Downloading...");
  const data = await pixelRequest.getImage();
  if (!data) {
    return;
  }

  await Bun.write(
    path.resolve(__dirname, "..", "map", `${Date.now()}.webp`),
    data
  );
}

async function main() {
  await download();
  setInterval(async () => {
    await download();
  }, config.delay * 1000);
}

await main();
