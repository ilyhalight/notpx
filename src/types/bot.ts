import type { Boosts } from "./users";

export type PixelInput = [x: number, y: number];

export type Account = {
  id: number;
  balance: number;
  tokens: number;
  repaintsTotal: number;
  auth: string;
  lastErrorAt: number;
  boosts: Boosts;
};

export type RepaintLevel = {
  level: number;
  price: number;
  boost: number;
  max: boolean;
};

export type ChargeRestorationLevel = {
  level: number;
  price: number;
  chargeBoost: number;
  max: boolean;
};
