import type { SessionData } from "./sessions";
import type { Boosts, Goods } from "./users";

export type PixelInput = [x: number, y: number];

export type Account = {
  id: number; // it isn't user id
  userId: number;
  sessionData: SessionData;
  balance: number;
  tokens: number;
  repaintsTotal: number;
  auth: string | null;
  lastRenewAt: number;
  lastErrorAt: number;
  boosts: Boosts;
  goods: Goods;
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
