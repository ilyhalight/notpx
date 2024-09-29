export type SQLitePyrogramSession = {
  dc_id: number;
  test_mode: boolean;
  auth_key: Uint8Array;
  user_id: number;
  is_bot: boolean;
};

export type SQLiteTelethonSession = {
  dc_id: number;
  server_address: string;
  port: number;
  auth_key: Uint8Array;
};

export type SessionData = {
  id: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  session: string;
  userAgent: string;
  addedFrom: "fs" | "manual";
  addedAt: number;
};
