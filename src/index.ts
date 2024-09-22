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

class NotPixelBot {
  initialPos: PixelInput;
  width: number;
  height: number;
  pixels: OCRPixel[];
  initialPixels: OCRPixel[];
  placedPixels: OCRPixel[];
  notpxConfig: Config | undefined;
  maxRepaintLevel: number | undefined;
  maxChargeRestorationLevel: number | undefined;

  accountsData: Account[] = [];
  repaintLevels: RepaintLevel[] = [];
  chargeRestorationLevels: ChargeRestorationLevel[] = [];
  totalPlaced = 0;
  lastClaimedAt = 0;
  autoUpgrade = false;
  useFastRecharge = false;
  checkPixelInfo = false;
  setPixelsToMap = true;
  claimDelay = config.claimDelay * 1000;
  intervalDelay = config.delay * 1000;
  timer: ReturnType<typeof setTimeout> | undefined = undefined;

  constructor(image: OCRData) {
    this.initialPos = image.initialPos;
    this.width = image.width;
    this.height = image.height;
    this.pixels = image.pixels;
    this.initialPixels = this.placedPixels = [];
    this.autoUpgrade = config.autoUpgrade;
    this.checkPixelInfo = config.checkPixelInfo;
    this.setPixelsToMap = config.setPixelsToMap;
    this.calcPixels();
    this.getInitAccountsData();
  }

  calcPixels() {
    const [initX, initY] = this.initialPos;
    this.initialPixels = this.pixels = this.pixels.map((pixel) => ({
      ...pixel,
      x: pixel.x + initX,
      y: pixel.y + initY,
    }));
    return this;
  }

  getRequestData(auth: string) {
    return {
      userAgent: config.userAgent,
      domain: config.domain,
      auth,
    };
  }

  async getBaseConfig() {
    this.notpxConfig = await new ConfigRequest().getConfig();
    if (!this.notpxConfig) {
      console.error(
        "Auto upgrade disabled, because failed to get notpx config"
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

  getInitAccountsData() {
    this.accountsData = config.auth.map((auth, idx) => {
      console.log(`Account #${idx}. Getting init data...`);
      return {
        id: idx + 1,
        balance: 0,
        tokens: 0,
        repaintsTotal: 0,
        auth,
        lastErrorAt: 0,
        boosts: {} as Boosts,
        goods: {} as Goods,
      };
    });

    return this;
  }

  async getAccountsData() {
    console.log("Get accounts data...");
    this.accountsData = await Promise.all(
      this.accountsData.map(async (account) => {
        console.log(`Account #${account.id}. Getting account mining status...`);
        const miningStatus = await new UsersRequest(
          this.getRequestData(account.auth)
        ).getMiningStatus();
        const balance = miningStatus?.charges ?? 0;
        return {
          ...account,
          balance,
          tokens: miningStatus?.userBalance ?? 0,
          lastErrorAt: balance ? 0 : account.lastErrorAt,
          boosts: miningStatus?.boosts ?? ({} as Boosts),
          goods: miningStatus?.goods ?? ({} as Goods),
          repaintsTotal: miningStatus?.repaintsTotal ?? 0,
        };
      })
    );
    console.log("Finish get accounts data");
    return this;
  }

  async setPixel(account: Account, pixel: OCRPixel) {
    const { x, y, color } = pixel;
    console.log(`Account #${account.id}. Placing pixel to ${x} ${y}...`);
    const result = await new PixelRequest(
      this.getRequestData(account.auth)
    ).setPixel(x, y, color);
    if (!result) {
      console.error("Balance is emptied! Stop working...");
      account.balance = 0;
      account.lastErrorAt = Date.now();
      return this;
    }

    console.info(
      `Account #${account.id}. ${styleText(
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
    console.log(`Account #${account.id}. Checking pixel ${x} ${y}...`);

    const pixelRequest = new PixelRequest(this.getRequestData(account.auth));
    const pixelInfo = await pixelRequest.getPixel(x, y);
    if (!pixelInfo || pixelInfo.pixel.color === color) {
      console.log(`Account #${account.id}. Skip pixel ${x} ${y}...`);
      account.balance += 1;
      this.placedPixels.push(pixel);
      return this;
    }

    return await this.setPixel(account, pixel);
  }

  async tryUpgradeRepaintLevel(account: Account) {
    const { paintReward: currentRepaintLevel } = account.boosts;
    const nextRepaintLevel = this.repaintLevels.find(
      (repaintLevel) => repaintLevel.level === currentRepaintLevel + 1
    ) as RepaintLevel;
    if (
      !this.maxRepaintLevel ||
      currentRepaintLevel >= this.maxRepaintLevel ||
      nextRepaintLevel.price > account.tokens
    ) {
      return account;
    }

    const result = await new UsersRequest(
      this.getRequestData(account.auth)
    ).checkBoost("paintReward");
    if (!result) {
      return account;
    }

    account.tokens -= nextRepaintLevel.price;
    console.log(
      `Account #${account.id}. ${styleText(
        "green",
        `Successfully upgraded to ${nextRepaintLevel.level} repaint level for ${nextRepaintLevel.price}`
      )}. New balance: ${account.tokens}`
    );
    return account;
  }

  async tryUpgradeRechargeLevel(account: Account) {
    const { reChargeSpeed: currentRechargeLevel } = account.boosts;
    const nextRechargeLevel = this.chargeRestorationLevels.find(
      (reChargeLevel) => reChargeLevel.level === currentRechargeLevel + 1
    ) as ChargeRestorationLevel;
    if (
      !this.maxRepaintLevel ||
      currentRechargeLevel >= this.maxRepaintLevel ||
      nextRechargeLevel.price > account.tokens
    ) {
      return account;
    }

    const result = await new UsersRequest(
      this.getRequestData(account.auth)
    ).checkBoost("reChargeSpeed");
    if (!result) {
      return account;
    }

    account.tokens -= nextRechargeLevel.price;
    console.log(
      `Account #${account.id}. ${styleText(
        "green",
        `Successfully upgraded to ${nextRechargeLevel.level} recharge level for ${nextRechargeLevel.price}`
      )}. New balance: ${account.tokens}`
    );
    return account;
  }

  async claimAndUpgrade() {
    const timestamp = Date.now();
    if (timestamp < this.lastClaimedAt + this.claimDelay) {
      return this;
    }

    console.log("Claim all minings and upgrading...");
    this.accountsData = await Promise.all(
      this.accountsData.map(async (account) => {
        console.log(`Account #${account.id}. Claiming minings...`);
        const userRequest = new UsersRequest(this.getRequestData(account.auth));
        const miningStatus = await userRequest.claim();
        if (!miningStatus) {
          return account;
        }

        account.tokens += miningStatus.claimed;
        console.log(
          `Account #${account.id}. New balance: ${account.tokens}. Total repaints: ${account.repaintsTotal}`
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

  async activateSpecials() {
    if (!this.useFastRecharge) {
      return this;
    }

    console.log("Trying activate specials...");
    this.accountsData = await Promise.all(
      this.accountsData.map(async (account) => {
        if (
          account.balance ||
          !Object.keys(account.goods).includes(String(GoodItem.FAST_REPAINT))
        ) {
          return account;
        }

        console.log(`Account #${account.id}. Activate fast repaints...`);
        const userRequest = new UsersRequest(this.getRequestData(account.auth));
        await userRequest.activateSpecial(GoodItem.FAST_REPAINT);
        return account;
      })
    );

    return this;
  }

  findAvailableAccount() {
    return this.accountsData.find(
      (account) => account.balance > 0 && !account.lastErrorAt
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
          console.log(`Account #${account.id}. Randomize delay...`);
          await sleep(Math.random() * 1000);

          this.checkPixelInfo
            ? await this.setPixelIfNeed(account, pixel)
            : await this.setPixel(account, pixel);
        })
      );
    } catch {}

    return this;
  }

  async run() {
    await this.getAccountsData();
    await this.activateSpecials();
    await this.claimAndUpgrade();
    await this.setPixels();
    return this;
  }

  async runInloop() {
    await this.getBaseConfig();
    await this.run();
    setInterval(async () => {
      await this.run();
    }, this.intervalDelay);
  }
}

const isOCRData = (data: Record<string, any>): data is OCRData =>
  "initialPos" in data &&
  "width" in data &&
  "height" in data &&
  "totalPixels" in data &&
  "pixels" in data;

async function main() {
  console.log("Starting NotPixelBot...");
  const file = Bun.file(path.resolve(__dirname, "..", "result.json"));
  const imageData = await file.json();
  if (!isOCRData(imageData)) {
    throw new Error("Image data doesn't found. Check README for get help");
  }

  const bot = new NotPixelBot(imageData);
  await bot.runInloop();
}

await main();
