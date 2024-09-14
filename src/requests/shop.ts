import BaseRequest from "./base";
import type { CurrentUser } from "../types/users";

export class ShopRequest extends BaseRequest {
  async list() {
    try {
      const res = await this.request(`/api/v1/buy/list`);
      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as CurrentUser;
    } catch (err: unknown) {
      console.error(
        "Failed to get shop buy list, reason:",
        (err as Error)?.message
      );
      return undefined;
    }
  }
}
