import config from "../config";
import type { BaseConfig } from "../types/base";

export default class {
  userAgent: string;
  domain: string;
  auth: string;
  proxy: string;
  origin: string;

  constructor({ userAgent, domain, auth, origin }: BaseConfig) {
    this.userAgent = userAgent;
    this.domain = domain;
    this.auth = auth;
    this.origin = origin;
    this.proxy = config.proxy[Math.floor(Math.random() * config.proxy.length)];
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
