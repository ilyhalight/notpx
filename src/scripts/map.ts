import path from "node:path";

import { PixelRequest } from "../requests/pixels";
import config from "../config";

const pixelRequest = new PixelRequest({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0",
  domain: config.domain,
  origin: config.origin,
  auth: "",
});

async function download() {
  console.log("Screenshoting map...");
  const data = await pixelRequest.getImage();
  if (!data) {
    return;
  }

  await Bun.write(
    path.resolve(config.screenshotsFolder, `${Date.now()}.webp`),
    data
  );
}

async function main() {
  await download();
  setInterval(async () => {
    await download();
  }, config.screenMapDelay * 1000);
}

await main();
