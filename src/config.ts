import path from "node:path";
import { version } from "../package.json";

export default {
  version,
  domain: "notpx.app",
  origin: "https://app.notpx.app",
  configDomain: "npx-cdn.fra1.cdn.digitaloceanspaces.com",
  proxy: [],
  apiId: Bun.env.API_ID,
  apiHash: Bun.env.API_HASH,
  maxLifetime: 1700, // seconds (real lifetime is 30 mins, but we get only ~28 mins to prevent errors)
  sessionsFolder: path.join(__dirname, "..", "sessions"),
  screenshotsFolder: path.join(__dirname, "..", "map"),
  referalId: Bun.env.REFERAL_ID || "f587778212",
  useTemplate: Bun.env.USE_TEMPLATE === "true",
  templateId: Bun.env.TEMPLATE_ID || "6804443506", // get by list of tempalates, or by templateId of image in desktop version or by sniffing requests
  autoUpgrade: Bun.env.AUTO_UPGRADE === "true",
  maxUpgrades: {
    repaintLevel: Number(Bun.env.MAX_REPAINT_LEVEL ?? 999),
    rechargeLevel: Number(Bun.env.MAX_RECHARGE_LEVEL ?? 999),
    energyLimit: Number(Bun.env.MAX_ENERGY_LEVEL ?? 999),
  },
  useFastRecharge: Bun.env.USE_FAST_RECHARGE === "true", // fast recharge by goods
  checkPixelInfo: Bun.env.CHECK_PIXEL_INFO === "true",
  setPixelsToMap: Bun.env.SET_PIXELS_TO_MAP === "true",
  screenMapDelay: 30, // seconds
  canvasSize: 1024,
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
  updateTemplateDelay: {
    // seconds
    min: 1200,
    max: 4800,
  },
};
