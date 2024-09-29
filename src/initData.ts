import {
  MemoryStorage,
  TelegramClient,
  tl,
  type TransportFactory,
} from "@mtcute/bun";

import config from "./config";
import type { SessionData } from "./types/sessions";
import { getTransportByConfig } from "./utils";

const { apiId, apiHash } = config;

export async function getInitData(sessionData: SessionData) {
  const tg = new TelegramClient({
    apiId,
    apiHash,
    disableUpdates: true,
    storage: new MemoryStorage(),
    transport: getTransportByConfig as TransportFactory,
  });

  await tg.start({
    session: sessionData.session,
  });

  const peer = await tg.resolvePeer("notpixel");
  const inputBotApp: tl.RawInputBotAppShortName = {
    _: "inputBotAppShortName",
    botId: peer as unknown as tl.TypeInputUser,
    shortName: "app",
  };

  const webViewData = await tg.call({
    _: "messages.requestAppWebView",
    peer,
    writeAllowed: true,
    platform: "android", // it doesn't matter, it's not used in initData
    startParam: config.referalId,
    app: inputBotApp,
  });

  const webAppData = webViewData.url
    .split("#tgWebAppData=")?.[1]
    ?.split("&")?.[0];

  await tg.close();
  return decodeURIComponent(webAppData);
}
