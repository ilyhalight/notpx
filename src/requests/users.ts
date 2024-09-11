import BaseRequest from "./base";
import type { CurrentUser, MiningStatus } from "../types/users";

export class UsersRequest extends BaseRequest {
  async me() {
    try {
      const res = await this.request(`/api/v1/users/me`);
      const data = await res.json();
      console.log(data);
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as CurrentUser;
    } catch (err: unknown) {
      console.error(
        "Failed to get info about me, reason:",
        (err as Error)?.message
      );
      return undefined;
    }
  }

  async getMiningStatus() {
    try {
      const res = await this.request(`/api/v1/mining/status`);
      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as MiningStatus;
    } catch (err: unknown) {
      console.error(
        "Failed to get mining status, reason:",
        (err as Error)?.message
      );
      return undefined;
    }
  }

  async claim() {
    try {
      const res = await this.request(`/api/v1/mining/claim`);
      if (res.status === 500) {
        // can't claim mining. Try again in xxx seconds
        const data = await res.text();
        throw new Error(data);
      }

      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as MiningStatus;
    } catch (err: unknown) {
      console.error("Failed to claim mining, reason:", (err as Error)?.message);
      return undefined;
    }
  }
}
