export type Period = {
  ID: number;
  PeriodType: "break" | "round";
  RoundID: null | number;
  StartTime: string;
  EndTime: string; // iso date
};

export type PeriodsResponse = {
  allPeriods: Period[];
  activePeriod: Period;
};
