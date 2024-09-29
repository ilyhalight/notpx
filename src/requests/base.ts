import type { BaseConfig } from "../types/base";
import { getRandomProxy } from "../utils";

export default class {
  userAgent: string;
  domain: string;
  auth: string;
  proxy: string;
  origin: string;
  userId: number;

  constructor({ userAgent, domain, auth, origin, userId }: BaseConfig) {
    this.userAgent = userAgent;
    this.domain = domain;
    this.auth = auth;
    this.origin = origin;
    this.userId = userId ?? 0;
    this.proxy = getRandomProxy();
  }

  getHeaders(): Record<string, string> {
    return {
      "User-Agent": this.userAgent,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ru",
      Authorization: `initData ${this.auth}`,
      "Content-Type": "application/json",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      Referer: `${this.origin}/`,
      Origin: this.origin,
    };
  }

  getRequestOpts() {
    return {
      headers: this.getHeaders(),
      proxy: this.proxy,
    };
  }

  async request(pathname: string, opts: Record<string, unknown> = {}) {
    return await fetch(`https://${this.domain}${pathname}`, {
      ...opts,
      ...this.getRequestOpts(),
    });
  }
}
