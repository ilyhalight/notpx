import path from "node:path";
import { styleText } from "node:util";
import { sleep } from "bun";

import { PixelRequest } from "./requests/pixels";
import config from "./config";
import { UsersRequest } from "./requests/users";
import type { OCRData, OCRPixel } from "./types/ocr";
import type {
  Account,
  ChargeRestorationLevel,
  PixelInput,
  RepaintLevel,
} from "./types/bot";
import { ConfigRequest } from "./requests/config";
import type { Config } from "./types/config";
import { GoodItem, type Boosts, type Goods } from "./types/users";
import { getSessionsData } from "./sessions";
import { getInitData } from "./initData";
import { isDataObj, randDelay } from "./utils";
import { TemplateRequest } from "./requests/templates";
import { convertToPixels } from "./scripts/ocr";

const PIXELS_KEYS = ["initialPos", "width", "height", "totalPixels", "pixels"];
const isOCRData = (data: Record<string, any>) =>
  isDataObj<OCRData>(data, PIXELS_KEYS);

class NotPixelBot {
  initialPos!: PixelInput;
  width!: number;
  height!: number;
  pixels!: OCRPixel[];
  initialPixels!: OCRPixel[];
  placedPixels!: OCRPixel[];
  templateId: string | undefined;
  notpxConfig: Config | undefined;
  maxRepaintLevel: number | undefined;
  maxChargeRestorationLevel: number | undefined;

  accountsData: Account[] = [];
  repaintLevels: RepaintLevel[] = [];
  chargeRestorationLevels: ChargeRestorationLevel[] = [];
  totalPlaced = 0;
  lastClaimedAt = 0;
  lastUpdatedTemplateAt = 0;
  autoUpgrade = false;
  useFastRecharge = false;
  checkPixelInfo = false;
  setPixelsToMap = true;
  useTemplate = false;

  nextClaimDelay = 0;
  nextUpdatedTemplateDelay = 0;
  nextRunDelay = config.runDelay.onStart * 1000;
  maxLifetime = config.maxLifetime * 1000;
  timer: ReturnType<typeof setTimeout> | undefined = undefined;

  constructor(image: OCRData) {
    this.autoUpgrade = config.autoUpgrade;
    this.useFastRecharge = config.useFastRecharge;
    this.checkPixelInfo = config.checkPixelInfo;
    this.setPixelsToMap = config.setPixelsToMap;
    this.useTemplate = config.useTemplate;
    this.templateId = config.templateId;
    this.updateImage(image);
  }

  updateImage(image: OCRData) {
    this.initialPos = image.initialPos;
    this.initialPixels = this.placedPixels = [];
    this.width = image.width;
    this.height = image.height;
    this.pixels = image.pixels;
    this.calcPixels();
    return this;
  }

  randClaimDelay = () =>
    randDelay(config.claimDelay.min, config.claimDelay.max);

  randUpdateTemplateDelay = () =>
    randDelay(config.updateTemplateDelay.min, config.updateTemplateDelay.max);

  randRunDelay = () => randDelay(config.runDelay.min, config.runDelay.max);

  randRequestDelay = () =>
    randDelay(config.requestsDelay.min, config.requestsDelay.max);

  calcPixels() {
    const [initX, initY] = this.initialPos;
    this.initialPixels = this.pixels = this.pixels.map((pixel) => ({
      ...pixel,
      x: pixel.x + initX,
      y: pixel.y + initY,
    }));
    return this;
  }

  getRequestData(account: Account) {
    return {
      userAgent: account.sessionData.userAgent,
      domain: config.domain,
      auth: account.auth as string,
      origin: config.origin,
      userId: account.userId,
    };
  }

  async getBaseConfig() {
    this.notpxConfig = await new ConfigRequest().getConfig();
    if (!this.notpxConfig) {
      console.warn(
        "⚠️ | Auto upgrade disabled, because failed to get notpx config"
      );
      this.autoUpgrade = false;
    }

    if (!this.autoUpgrade) {
      return;
    }

    this.repaintLevels = Object.entries(
      this.notpxConfig!.UpgradeRepaint.levels
    ).map((level) => ({
      level: +level[0],
      price: level[1].Price,
      boost: level[1].Boost,
      max: level[1].Max ?? false,
    }));
    this.maxRepaintLevel = this.repaintLevels.find((level) => level.max)?.level;

    this.chargeRestorationLevels = Object.entries(
      this.notpxConfig!.UpgradeChargeRestoration.levels
    ).map((level) => ({
      level: +level[0],
      price: level[1].Price,
      chargeBoost: level[1].ChargeBoost,
      max: level[1].Max ?? false,
    }));
    this.maxChargeRestorationLevel = this.chargeRestorationLevels.find(
      (level) => level.max
    )?.level;
  }

  async getInitAccountsData() {
    const sessions = await getSessionsData();

    this.accountsData = await Promise.all(
      sessions.map(async (session, idx) => {
        console.log(`🦊 | Account #${session.id}. Getting initData...`);
        let auth = null;
        try {
          auth = await getInitData(session);
        } catch (err) {
          console.error(
            `😢 | Failed to get auth data for #${session.id} @${
              session.username
            } | ${session.firstName} ${session.lastName}, ${
              (err as Error).message
            }`
          );
        }

        return {
          id: idx + 1,
          userId: session.id,
          balance: 0,
          tokens: 0,
          repaintsTotal: 0,
          sessionData: session,
          auth,
          lastRenewAt: Date.now(),
          lastErrorAt: 0,
          boosts: {} as Boosts,
          goods: {} as Goods,
        };
      })
    );

    return this;
  }

  async tryRenewAuth() {
    this.accountsData = await Promise.all(
      this.accountsData.map(async (account) => {
        if (
          account.auth &&
          account.lastRenewAt + this.maxLifetime > Date.now()
        ) {
          return account;
        }

        const { sessionData: session } = account;
        console.log(`🦊 | Account #${session.id}. Getting initData...`);
        let auth = null;
        try {
          auth = await getInitData(session);
        } catch (err) {
          console.error(
            `❌ | Failed to get auth data for #${session.id} @${
              session.username
            } | ${session.firstName} ${session.lastName}, ${
              (err as Error).message
            }`
          );
        }

        return {
          ...account,
          auth,
          lastRenewAt: Date.now(),
        };
      })
    );
  }

  async getAccountsData() {
    this.accountsData = await Promise.all(
      this.accountsData.map(async (account) => {
        if (!account.auth) {
          console.log(
            `❄️ | Account #${account.userId}. Skipping unauthorized account...`
          );
          return account;
        }

        console.log(
          `📦 | Account #${account.userId}. Getting account mining status with random delay...`
        );
        await sleep(this.randRequestDelay());
        const miningStatus = await new UsersRequest(
          this.getRequestData(account)
        ).getMiningStatus();
        const balance = miningStatus?.charges ?? 0;
        return {
          ...account,
          balance,
          tokens: miningStatus?.userBalance ?? 0,
          lastErrorAt: balance ? 0 : Date.now(),
          boosts: miningStatus?.boosts ?? ({} as Boosts),
          goods: miningStatus?.goods ?? ({} as Goods),
          repaintsTotal: miningStatus?.repaintsTotal ?? 0,
        };
      })
    );
    return this;
  }

  async activateAccounts() {
    this.accountsData = await Promise.all(
      this.accountsData.map(async (account) => {
        if (!account.auth) {
          console.log(
            `❄️ | Account #${account.userId}. Skipping unauthorized account...`
          );
          return account;
        }

        console.log(
          `🤖 | Account #${account.userId}. Activating account with random delay...`
        );
        await sleep(this.randRequestDelay());
        const requestData = this.getRequestData(account);
        await new UsersRequest(requestData).me();
        if (this.useTemplate && this.templateId) {
          console.log(
            `🖼️ | Account #${account.userId}. Activating template with id ${this.templateId}...`
          );
          await sleep(this.randRequestDelay());
          await new TemplateRequest(
            this.getRequestData(account)
          ).subscribeTemplate(this.templateId);
        }
        return account;
      })
    );
    return this;
  }

  async setPixel(account: Account, pixel: OCRPixel) {
    const { x, y, color } = pixel;
    console.log(
      `🎨 | Account #${account.userId}. Placing pixel to ${x} ${y}...`
    );
    const result = await new PixelRequest(
      this.getRequestData(account)
    ).setPixel(x, y, color);
    if (!result) {
      console.warn("💤 | Balance is emptied! Waiting...");
      account.balance = 0;
      account.lastErrorAt = Date.now();
      return this;
    }

    console.info(
      `🎨 | Account #${account.userId}. ${styleText(
        "green",
        `Successfully set pixel to ${x} ${y}`
      )}`
    );
    this.totalPlaced += 1;
    this.placedPixels.push(pixel);
    return this;
  }

  async setPixelIfNeed(account: Account, pixel: OCRPixel) {
    const { x, y, color } = pixel;
    console.log(`🔍 | Account #${account.userId}. Checking pixel ${x} ${y}...`);

    const pixelRequest = new PixelRequest(this.getRequestData(account));
    const pixelInfo = await pixelRequest.getPixel(x, y);
    if (!pixelInfo || pixelInfo.pixel.color === color) {
      console.log(`⏭️ | Account #${account.userId}. Skip pixel ${x} ${y}...`);
      account.balance += 1;
      this.placedPixels.push(pixel);
      return this;
    }

    return await this.setPixel(account, pixel);
  }

  async tryUpgradeRepaintLevel(account: Account) {
    if (!account.auth) {
      console.log(
        `❄️ | Account #${account.userId}. Skipping unauthorized account...`
      );
      return account;
    }

    const { paintReward: currentRepaintLevel } = account.boosts;
    const nextRepaintLevel = this.repaintLevels.find(
      (repaintLevel) => repaintLevel.level === currentRepaintLevel + 1
    ) as RepaintLevel;
    if (
      !this.maxRepaintLevel ||
      !nextRepaintLevel ||
      currentRepaintLevel >= this.maxRepaintLevel ||
      nextRepaintLevel.price > account.tokens
    ) {
      return account;
    }

    const result = await new UsersRequest(
      this.getRequestData(account)
    ).checkBoost("paintReward");
    if (!result) {
      return account;
    }

    account.tokens -= nextRepaintLevel.price;
    console.log(
      `⬆️ | Account #${account.userId}. ${styleText(
        "green",
        `Successfully upgraded to ${nextRepaintLevel.level} repaint level for ${nextRepaintLevel.price}`
      )}. New balance: ${account.tokens}`
    );
    return account;
  }

  async tryUpgradeRechargeLevel(account: Account) {
    if (!account.auth) {
      console.log(
        `❄️ | Account #${account.userId}. Skipping unauthorized account...`
      );
      return account;
    }

    const { reChargeSpeed: currentRechargeLevel } = account.boosts;
    const nextRechargeLevel = this.chargeRestorationLevels.find(
      (reChargeLevel) => reChargeLevel.level === currentRechargeLevel + 1
    ) as ChargeRestorationLevel;
    if (
      !this.maxRepaintLevel ||
      !nextRechargeLevel ||
      currentRechargeLevel >= this.maxRepaintLevel ||
      nextRechargeLevel.price > account.tokens
    ) {
      return account;
    }

    const result = await new UsersRequest(
      this.getRequestData(account)
    ).checkBoost("reChargeSpeed");
    if (!result) {
      return account;
    }

    account.tokens -= nextRechargeLevel.price;
    console.log(
      `⬆️ | Account #${account.userId}. ${styleText(
        "green",
        `Successfully upgraded to ${nextRechargeLevel.level} recharge level for ${nextRechargeLevel.price}`
      )}. New balance: ${account.tokens}`
    );
    return account;
  }

  async claimAndUpgrade() {
    const timestamp = Date.now();
    if (timestamp < this.lastClaimedAt + this.nextClaimDelay) {
      return this;
    }

    this.nextClaimDelay = this.randClaimDelay();
    this.accountsData = await Promise.all(
      this.accountsData.map(async (account) => {
        if (!account.auth) {
          console.log(
            `❄️ | Account #${account.userId}. Skipping unauthorized account...`
          );
          return account;
        }

        await sleep(this.randRequestDelay());
        console.log(
          `⛏️ | Account #${account.userId}. Claiming minings with random delay...`
        );
        const userRequest = new UsersRequest(this.getRequestData(account));
        const miningStatus = await userRequest.claim();
        if (!miningStatus) {
          return account;
        }

        account.tokens += miningStatus.claimed;
        console.log(
          `💰 | Account #${account.userId}. New balance: ${account.tokens}. Total repaints: ${account.repaintsTotal}`
        );
        if (!this.autoUpgrade) {
          return account;
        }

        account = await this.tryUpgradeRepaintLevel(account);
        account = await this.tryUpgradeRechargeLevel(account);
        return account;
      })
    );

    this.lastClaimedAt = Date.now();
    return this;
  }

  async updateTemplate() {
    if (!this.useTemplate || !this.templateId) {
      return this;
    }

    const timestamp = Date.now();
    if (
      timestamp <
      this.lastUpdatedTemplateAt + this.nextUpdatedTemplateDelay
    ) {
      return this;
    }

    this.nextUpdatedTemplateDelay = this.randUpdateTemplateDelay();
    console.log(`🖼️ | Updating template data...`);
    const templateRequest = new TemplateRequest(
      this.getRequestData(this.accountsData[0])
    );
    const templateData = await templateRequest.getTemplate(this.templateId);
    if (!templateData) {
      return this;
    }

    const imageBlob = await templateRequest.getTemplateImage(this.templateId);
    if (!imageBlob) {
      return this;
    }

    const { x, y } = templateData;

    try {
      const imageArrayBuffer = await imageBlob.arrayBuffer();
      const { result: imageData } = await convertToPixels(imageArrayBuffer);
      imageData.initialPos = [x, y];

      this.updateImage(imageData);
      console.info(
        `🖼️ | ${styleText(
          "green",
          `Successfully updated image data for template #${this.templateId} (${x}, ${y})`
        )}`
      );
    } catch (err) {
      console.error(
        `❌ | Error on updating template image: ${(err as Error).message}`
      );
    }

    this.lastUpdatedTemplateAt = Date.now();
    return this;
  }

  async activateSpecials() {
    if (!this.useFastRecharge) {
      return this;
    }

    this.accountsData = await Promise.all(
      this.accountsData.map(async (account) => {
        if (!account.auth) {
          console.log(
            `❄️ | Account #${account.userId}. Skipping unauthorized account...`
          );
          return account;
        }

        if (
          account.balance ||
          !Object.keys(account.goods).includes(String(GoodItem.FAST_REPAINT))
        ) {
          return account;
        }

        await sleep(this.randRequestDelay());
        console.log(
          `⚡ | Account #${account.userId}. Activate fast repaints...`
        );
        const userRequest = new UsersRequest(this.getRequestData(account));
        await userRequest.activateSpecial(GoodItem.FAST_REPAINT);
        return account;
      })
    );

    return this;
  }

  findAvailableAccount() {
    return this.accountsData.find(
      (account) => account.auth && account.balance > 0 && !account.lastErrorAt
    );
  }

  async setPixels() {
    if (!this.setPixelsToMap) {
      return this;
    }

    try {
      let pixels = this.pixels.filter(
        (pixel) => !this.placedPixels.includes(pixel)
      );

      if (!pixels.length) {
        pixels = this.pixels = this.initialPixels;
        this.placedPixels = [];
      }

      await Promise.all(
        pixels.map(async (pixel) => {
          let account = this.findAvailableAccount();
          if (!account) {
            throw new Error("Availabled accounts not found. Waiting...");
          }

          account.balance -= 1;
          console.log(
            `🚧 | Account #${account.userId}. Randomize delay before set pixel...`
          );
          await sleep(this.randRequestDelay());

          this.checkPixelInfo
            ? await this.setPixelIfNeed(account, pixel)
            : await this.setPixel(account, pixel);
        })
      );
    } catch {}

    return this;
  }

  async run() {
    await this.tryRenewAuth();
    await this.getAccountsData();
    await this.updateTemplate();
    await this.activateSpecials();
    await this.claimAndUpgrade();
    await this.setPixels();
    return this;
  }

  protected async runTimed() {
    await this.run();
    this.nextRunDelay = this.randRunDelay();
    console.log(
      `💤 | Sleeping ${Math.floor(this.nextRunDelay / 1000)} secs...`
    );
    this.timer = setTimeout(
      async () => await this.runTimed(),
      this.nextRunDelay
    );
  }

  async runInloop() {
    await this.getBaseConfig();
    await this.activateAccounts();
    await this.runTimed();
  }
}

async function main() {
  console.log(`
 _   _       _    ______ _          _ 
| \\ | |     | |   | ___ (_)        | |
|  \\| | ___ | |_  | |_/ /___  _____| |
| . ' |/ _ \\| __| |  __/| \\ \\/ / _ \\ |
| |\\  | (_) | |_  | |   | |>  <  __/ |
\\_| \\_/\\___/ \\__| \\_|   |_/_/\\_\\___|_|

  ⚓ | Bot version: ${config.version}
  🚀 | Github: https://github.com/ilyhalight/notpx
  📦 | Dev: https://toil.cc

If you bought this script, congratulations, you were scamed
`);
  const file = Bun.file(path.resolve(__dirname, "..", "result.json"));
  const imageData = await file.json();
  if (!isOCRData(imageData)) {
    throw new Error("Image data doesn't found. Check README for get help");
  }

  // todo: add logging?
  const bot = new NotPixelBot(imageData);
  await bot.getInitAccountsData();
  await bot.runInloop();
}

await main();
