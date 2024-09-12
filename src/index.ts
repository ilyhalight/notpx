import path from "node:path";
import { styleText } from "node:util";
import { sleep } from "bun";

import { PixelRequest } from "./requests/pixels";
import config from "./config";
import { UsersRequest } from "./requests/users";
import type { OCRData, OCRPixel } from "./types/ocr";
import type { Account, PixelInput } from "./types/bot";

class NotPixelBot {
  initialPos: PixelInput;
  width: number;
  height: number;
  pixels: OCRPixel[];
  initialPixels: OCRPixel[];
  placedPixels: OCRPixel[];

  accountsData: Account[] = [];
  totalPlaced = 0;
  lastClaimedAt = 0;
  claimDelay = config.claimDelay * 1000;
  intervalDelay = config.delay * 1000;
  timer: ReturnType<typeof setTimeout> | undefined = undefined;

  constructor(image: OCRData) {
    this.initialPos = image.initialPos;
    this.width = image.width;
    this.height = image.height;
    this.pixels = image.pixels;
    this.initialPixels = this.placedPixels = [];
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

  getInitAccountsData() {
    this.accountsData = config.auth.map((auth, idx) => {
      console.log(`Account #${idx}. Getting init data...`);
      return {
        id: idx + 1,
        balance: 0,
        tokens: 0,
        auth,
        lastErrorAt: 0,
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
          balance: miningStatus?.charges ?? 0,
          tokens: miningStatus?.userBalance ?? 0,
          lastErrorAt: balance ? 0 : account.lastErrorAt,
        };
      })
    );
    console.log("finish get accounts data");
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

    console.log(`Account #${account.id}. Placing pixel...`);
    const result = await pixelRequest.setPixel(x, y, color);
    if (!result) {
      console.error("Balance is emptied! Stop working...");
      account.balance = 0;
      account.lastErrorAt = Date.now();
      return this;
    }

    console.info(
      `Account #${account.id}. ${styleText("yellow", `Set pixel to ${x} ${y}`)}`
    );
    this.totalPlaced += 1;
    this.placedPixels.push(pixel);
    return this;
  }

  async claimAll() {
    const timestamp = Date.now();
    if (timestamp < this.lastClaimedAt + this.claimDelay) {
      return this;
    }

    console.log("claim all minings...");
    this.accountsData = await Promise.all(
      this.accountsData.map(async (account) => {
        console.log(`Account #${account.id}. Claiming minings...`);
        const miningStatus = await new UsersRequest(
          this.getRequestData(account.auth)
        ).claim();

        if (!miningStatus) {
          return account;
        }

        account.tokens += miningStatus.claimed;
        console.log(`Account #${account.id}. New balance: ${account.tokens}`);
        return account;
      })
    );

    this.lastClaimedAt = Date.now();
    console.log("finish claim");
    return this;
  }

  findAvailableAccount() {
    return this.accountsData.find(
      (account) => account.balance > 0 && !account.lastErrorAt
    );
  }

  async setPixels() {
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

          await this.setPixelIfNeed(account, pixel);
        })
      );
    } catch {}

    return this;
  }

  async run() {
    await this.getAccountsData();
    await this.claimAll();
    await this.setPixels();
    return this;
  }

  async runInloop() {
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
