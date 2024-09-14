export type UpgradeLevel = {
  Price: number;
  Max?: true;
};

export interface UpgradeRepaintLevel extends UpgradeLevel {
  Boost: number;
}

export interface UpgradeChargeRestorationLevel extends UpgradeLevel {
  ChargeBoost: number;
}

export interface UpgradeChargeCountLevel extends UpgradeLevel {
  Boost: number;
}

export type Config = {
  RepaintReward: number;
  BetaRefLimit: number;
  IsBeta: boolean;
  BronzeMax: number;
  SilverMax: number;
  GoldMax: number;
  PlatinumMax: number;
  SquadBronzeMax: number;
  SquadSilverMax: number;
  SquadGoldMax: number;
  SquadPlatinumMax: number;
  DefaultSpeed: number;
  MaxMiningTime: number;
  MinTimeToClaim: number; // in minutes
  NoBoostAdded: number;
  BoostPremium: number;
  BoostFor3Ref: number;
  BoostForSubscription: number;
  ChargesForPremium: number;
  ChargesForSubscription: number;
  ChargesFor3Ref: number;
  BoostForSquad: number;
  InitialCharges: number;
  Restore1ChargeMSec: number;
  DynamiteSquareSide: number;
  TokensForInvite1Fren: number;
  TokensForInvite3Frens: number;
  TokensForInvite10Frens: number;
  TokensForSpendStars: number;
  TokensForWalletVerification: number;
  TokensForPixelInNickname: number;
  TokensForPaint20Pixels: number;
  TokensForJoinSquad: number;
  TokensForTelegramPremium: number;
  TokensForJoinChannel: number;
  TokensForJoinX: number;
  InitialCoins: number;
  RefRewardCoinsPremium: number;
  TokensForSilverLeagueCommon: number;
  TokensForGoldLeagueCommon: number;
  TokensForPlatinumLeagueCommon: number;
  TokensForSilverLeaguePremium: number;
  TokensForGoldLeaguePremium: number;
  TokensForPlatinumLeaguePremium: number;
  TokensForSilverLeagueCommonReferral: number;
  TokensForGoldLeagueCommonReferral: number;
  TokensForPlatinumLeagueCommonReferral: number;
  TokensForSilverLeaguePremiumReferral: number;
  TokensForGoldLeaguePremiumReferral: number;
  TokensForPlatinumLeaguePremiumReferral: number;
  UpgradeRepaint: Record<"levels", Record<string, UpgradeRepaintLevel>>;
  UpgradeChargeRestoration: Record<
    "levels",
    Record<string, UpgradeChargeRestorationLevel>
  >;
  UpgradeChargeCount: Record<"levels", Record<string, UpgradeChargeCountLevel>>;
};
