import BaseRequest from "./base";
import type { PeriodsResponse } from "../types/tournament";

export class TournamentRequest extends BaseRequest {
  async getPeriods() {
    try {
      const res = await this.request(`/api/v1/tournament/periods`);
      return (await res.json()) as PeriodsResponse[];
    } catch (err) {
      console.error(
        "Failed to get tournament periods, reason:",
        (err as Error)?.message
      );
      return undefined;
    }
  }
}
