export type League = "bronze" | "silver" | "gold" | "platinum";

export type GeneralSquad = {
  id: number;
  name: string;
  slug: string | null;
  logo: string;
  players: null;
  totalBalance: null;
};

export interface WithoutSquad {
  id: number;
  name: number;
  slug: number;
  logo: number;
  players: null;
  totalBalance: null;
}

export type Squad = GeneralSquad | WithoutSquad;

export type PixelOwner = {
  id: number; // always 0
  firstName: string;
  lastName: string;
  balance: number;
  friends: number;
  intro: boolean;
  userPic: string;
  league: League;
  squad: Squad;
  goods: null;
  refLimit: number;
};

export interface CurrentUser extends PixelOwner {
  // id not null for you
  language: "en";
  isPremium: true;
}

export type Boost = "energyLimit" | "paintReward" | "reChargeSpeed";
export type Task =
  | "invite1fren"
  | "invite3fren"
  // | "invite10fren" // hidden
  | "spendStars"
  // | "walletVerification" // hidden
  // | "pixelInNickname" // hidden
  | "paint20pixels"
  | "joinSquad"
  | "leagueBonusSilver"
  | "leagueBonusGold"
  | "premium"
  | "channel"
  | "x";

export type Tasks = Record<Task, boolean>;
export type Boosts = Record<Boost, number>;

export type MiningStatus = {
  coins: number;
  speedPerSecond: number;
  fromStart: number;
  fromUpdate: number;
  maxMiningTime: number;
  claimed: number;
  repaintsTotal: number;
  userBalance: number;
  activated: boolean;
  league: League;
  charges: number;
  maxCharges: number;
  reChargeTimer: number;
  reChargeSpeed: number;
  goods: Record<string, number> | null; // idk
  tasks: Tasks;
  boosts: Boosts;
};

export type BoostResponse = Record<Boost, boolean>;
export type TaskResponse = Record<Task, boolean>;
