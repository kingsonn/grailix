import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runAgent1 } from "../../agents/agent-ingestor";

/**
 * Vercel API endpoint for Agent-1 (Ingestor)
 * Triggered by Vercel CRON or manual HTTP request
 * 
 * Local test:
 * http://localhost:3000/api/run-agent1
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("🔵 Executing Agent-1 via Vercel API");
    await runAgent1();
    return res.status(200).json({ ok: true, message: "Agent-1 completed successfully" });
  } catch (err) {
    console.error("Agent-1 error:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
