import config from "../config";
import type { BaseConfig } from "../types/base";

export default class {
  userAgent: string;
  domain: string;
  auth: string;
  proxy: string;

  constructor({ userAgent, domain, auth }: BaseConfig) {
    this.userAgent = userAgent;
    this.domain = domain;
    this.auth = auth;
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
    };
  }

  getRequestOpts() {
    return {
      headers: this.getHeaders(),
      referrer: `https://${this.domain}/`,
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
