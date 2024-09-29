import { TcpTransport } from "@mtcute/bun";

import { HttpProxyTcpTransport } from "@mtcute/http-proxy";

import config from "./config";

export const isObject = (obj: unknown): obj is object =>
  obj != null && obj.constructor.name === "Object";

export const isDataObj = <T>(data: unknown, keys: string[]): data is T => {
  if (!isObject(data)) {
    return false;
  }

  return keys.every((key) => key in data);
};

export const randDelay = (min: number, max: number) =>
  Math.floor((Math.random() * (max - min) + min) * 1000);

export const getRandomProxy = (): string =>
  config.proxy[Math.floor(Math.random() * config.proxy.length)];

export const getTransportByConfig = () => {
  if (!config.proxy.length) {
    return new TcpTransport();
  }

  const proxyUrl = new URL(getRandomProxy());
  const { hostname: host, username: user, password, port } = proxyUrl;

  return new HttpProxyTcpTransport({
    host,
    port: +port,
    user,
    password,
  });
};
