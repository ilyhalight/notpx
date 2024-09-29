import { addManualSession, parseSessionDir } from "../sessions";

async function main() {
  const action = Bun.env.SESSION_ACTION;
  switch (action) {
    case "manual":
      await addManualSession();
      process.exit(0);
    case "parse":
      await parseSessionDir();
      break;
  }
}

await main();
