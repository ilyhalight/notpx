import path from "node:path";
import fs from "node:fs/promises";

import config from "../config";
import { convertSession, credentialsToSession } from "./convert";
import type { SessionData } from "../types/sessions";
import { isDataObj } from "../utils";

const { sessionsFolder } = config;
const SESSION_DATA = [
  "id",
  "username",
  "firstName",
  "lastName",
  "session",
  "addedAt",
];

const sessionPath = path.join(sessionsFolder, "sessions.json");

async function getSessionFiles() {
  try {
    const files = await fs.readdir(sessionsFolder, { withFileTypes: true });
    return files.filter((file) => file.name.endsWith(".session"));
  } catch (err) {
    console.error("Failed to get session files,", (err as Error).message);
    return [];
  }
}

async function getSessionsData(): Promise<SessionData[]> {
  try {
    const activeSessionFile = Bun.file(sessionPath);
    const sessions = await activeSessionFile.json();
    return sessions.filter((session: unknown) =>
      isDataObj<SessionData>(session, SESSION_DATA)
    );
  } catch {
    return [];
  }
}

async function updateSessions(sessions: SessionData[]) {
  const activeSessions = await getSessionsData();
  const allSessions = [...activeSessions, ...sessions];
  const updatedSessions: SessionData[] = [];
  for (const session of allSessions) {
    if (updatedSessions.find((s: SessionData) => s.id === session.id)) {
      continue;
    }

    if (!activeSessions.find((s: SessionData) => s.id === session.id)) {
      console.log(
        `✅ Session successfully added @${session.username} (id: ${session.id}) | ${session.firstName} ${session.lastName}`
      );
    }

    updatedSessions.push(session);
  }

  await Bun.write(sessionPath, JSON.stringify(updatedSessions, null, 2));
}

async function parseSessionDir() {
  const files = await getSessionFiles();
  if (!files.length) {
    return false;
  }

  const sessions = (
    await Promise.all(
      files.map(async (file) => await convertSession(file.name))
    )
  ).filter((file) => !!file);
  await updateSessions(sessions);
}

async function addManualSession() {
  const session = await credentialsToSession();
  await updateSessions([session]);
}

export { parseSessionDir, addManualSession, getSessionsData };
