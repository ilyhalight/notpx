import yaml from "js-yaml";

import BaseRequest from "./base";
import config from "../config";
import type { Config } from "../types/config";

export class ConfigRequest extends BaseRequest {
  constructor() {
    super({
      domain: config.configDomain,
      userAgent: config.userAgent,
      auth: "",
    });
  }

  getHeaders() {
    return {
      "User-Agent": this.userAgent,
      Accept: "*/*",
      "Accept-Language": "ru",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    };
  }

  async getConfig() {
    try {
      const res = await this.request(`/base/config.yml`);
      const data = await res.text();
      const doc = yaml.load(data);
      return doc as Config;
    } catch (err: unknown) {
      console.error(
        "Failed to get base config, reason:",
        (err as Error)?.message
      );
      return undefined;
    }
  }
}
