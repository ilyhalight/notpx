import BaseRequest from "./base";
import type {
  Boost,
  BoostResponse,
  CurrentUser,
  GoodItem,
  MiningStatus,
  Task,
  TaskResponse,
} from "../types/users";

export class UsersRequest extends BaseRequest {
  async me() {
    try {
      const res = await this.request(`/api/v1/users/me`);
      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as CurrentUser;
    } catch (err) {
      console.error(
        `Failed to get info about me (userId: ${this.userId}), reason: ${
          (err as Error)?.message
        }`
      );
      return undefined;
    }
  }

  async getMiningStatus() {
    try {
      const res = await this.request(`/api/v1/mining/status`);
      if (res.status === 500) {
        // internal server error
        const data = await res.text();
        throw new Error(data);
      }

      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as MiningStatus;
    } catch (err) {
      console.error(
        `Failed to get mining status (userId: ${this.userId}), reason: ${
          (err as Error)?.message
        }`
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
    } catch (err) {
      console.error(
        `Failed to claim mining (userId: ${this.userId}), reason: ${
          (err as Error)?.message
        }`
      );
      return undefined;
    }
  }

  async checkTask(task: Task) {
    try {
      const res = await this.request(`/api/v1/mining/task/check/${task}`);
      if (res.status === 500) {
        // can't claim task. Try again in xxx seconds
        const data = await res.text();
        throw new Error(data);
      }

      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as TaskResponse;
    } catch (err) {
      console.error(
        `Failed to check mining task ${task} (userId: ${
          this.userId
        }), reason: ${(err as Error)?.message}`
      );
      return undefined;
    }
  }

  async checkBoost(boost: Boost) {
    try {
      const res = await this.request(`/api/v1/mining/boost/check/${boost}`);
      if (res.status === 500) {
        // can't claim boost. Try again in xxx seconds
        const data = await res.text();
        throw new Error(data);
      }

      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as BoostResponse;
    } catch (err) {
      console.error(
        `Failed to check mining boost ${boost} (userId: ${
          this.userId
        }), reason: ${(err as Error)?.message}`
      );
      return undefined;
    }
  }

  async activateSpecial(special: GoodItem) {
    try {
      const res = await this.request(`/api/v1/repaint/special`, {
        body: JSON.stringify({ pixelId: 1, type: Number(special) }),
        method: "POST",
      });

      const data = await res.text();
      if (res.status === 500) {
        throw new Error(data);
      }

      return data;
    } catch (err) {
      console.error(
        `Failed to activate special item ${special} (userId: ${
          this.userId
        }), reason: ${(err as Error)?.message}`
      );
      return undefined;
    }
  }
}
