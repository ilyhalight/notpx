import path from "node:path";
import fs from "node:fs/promises";
import { Database } from "bun:sqlite";

import UserAgent from "user-agents";
import { MemoryStorage, TelegramClient, User } from "@mtcute/bun";
import {
  convertFromPyrogramSession,
  convertFromTelethonSession,
} from "@mtcute/convert";

import config from "../config";
import type {
  SessionData,
  SQLitePyrogramSession,
  SQLiteTelethonSession,
} from "../types/sessions";
import { isDataObj } from "../utils";

const { apiId, apiHash, sessionsFolder } = config;
const PYROGRAM_KEYS = ["dc_id", "test_mode", "auth_key", "user_id", "is_bot"];
const TELETHON_KEYS = ["dc_id", "server_address", "port", "auth_key"];

const isPyrogramData = (data: unknown) =>
  isDataObj<SQLitePyrogramSession>(data, PYROGRAM_KEYS);

const isTelethonData = (data: unknown) =>
  isDataObj<SQLiteTelethonSession>(data, TELETHON_KEYS);

async function getSessionFromFile(filename: string) {
  const sessionPath = path.join(sessionsFolder, filename);
  const fileExists = await fs.exists(sessionPath);
  if (!fileExists) {
    console.error(`Session file "${filename}" doesn't exists`);
    return undefined;
  }

  try {
    const db = new Database(sessionPath, { readonly: true });
    const dbData = db.query("SELECT * FROM sessions").get();
    db.close(false);
    if (isPyrogramData(dbData)) {
      return convertFromPyrogramSession({
        dcId: dbData.dc_id,
        isTest: dbData.test_mode,
        authKey: dbData.auth_key,
        userId: dbData.user_id,
        isBot: dbData.is_bot,
      });
    }

    if (isTelethonData(dbData)) {
      return convertFromTelethonSession({
        dcId: dbData.dc_id,
        ipAddress: dbData.server_address,
        ipv6: dbData.server_address.includes(":"),
        port: dbData.port,
        authKey: dbData.auth_key,
      });
    }

    throw new Error(
      "A file with an unsupported session type has been transferred"
    );
  } catch (err) {
    console.error(
      `Failed to convert transferred session file "${filename}" to string session, ${
        (err as Error).message
      }`
    );
    return undefined;
  }
}

async function getSessionData(
  tg: TelegramClient,
  client: User,
  addedFrom: "fs" | "manual" = "fs"
): Promise<SessionData> {
  const { id, username, firstName, lastName } = client;
  const session = await tg.exportSession();

  await tg.close();
  return {
    id,
    username,
    firstName,
    lastName,
    session,
    userAgent: new UserAgent({ deviceCategory: "mobile" }).toString(),
    addedFrom,
    addedAt: Date.now(),
  };
}

async function convertSession(filename: string): Promise<false | SessionData> {
  const sessionData = await getSessionFromFile(filename);
  if (!sessionData) {
    return false;
  }

  const tg = new TelegramClient({
    apiId,
    apiHash,
    disableUpdates: true,
    storage: new MemoryStorage(),
  });

  const client = await tg.start({
    session: sessionData,
  });

  return await getSessionData(tg, client, "fs");
}

/**
 * Interactive way to create session from credentials
 */
async function credentialsToSession() {
  console.log("🔏 | Manually adding session...");
  const tg = new TelegramClient({
    apiId,
    apiHash,
    disableUpdates: true,
    storage: new MemoryStorage(),
  });

  const client = await tg.start({
    phone: () => tg.input("Phone > "),
    code: () => tg.input("Code > "),
    password: () => tg.input("Password > "),
  });

  return await getSessionData(tg, client, "manual");
}

export { convertSession, getSessionFromFile, credentialsToSession };
