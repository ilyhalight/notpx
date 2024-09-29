import path from "node:path";

export default {
  domain: "notpx.app",
  origin: "https://app.notpx.app",
  configDomain: "npx-cdn.fra1.cdn.digitaloceanspaces.com",
  proxy: [],
  apiId: Bun.env.API_ID,
  apiHash: Bun.env.API_HASH,
  maxLifetime: 1700, // seconds (real lifetime is 30 mins, but we get only ~28 mins to prevent errors)
  sessionsFolder: path.join(__dirname, "..", "sessions"),
  screenshotsFolder: path.join(__dirname, "..", "map"),
  referalId: Bun.env.REFERAL_ID ?? "f587778212",
  autoUpgrade: true,
  useFastRecharge: true, // fast recharge by goods
  checkPixelInfo: true,
  setPixelsToMap: true,
  screenMapDelay: 30, // seconds
  requestsDelay: {
    // seconds
    min: 0.1,
    max: 0.5,
  },
  runDelay: {
    // seconds
    onStart: 0, // Delay before run bot
    min: 3,
    max: 15,
  },
  claimDelay: {
    // seconds
    min: 1200,
    max: 4800,
  },
};
