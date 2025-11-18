import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runResolver } from "../../agents/agent-resolver";

/**
 * Vercel API endpoint for Agent-3 (Resolver)
 * Triggered by Vercel CRON or manual HTTP request
 * 
 * Local test:
 * http://localhost:3000/api/run-agent3
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("🟣 Executing Agent-3 via Vercel API");
    await runResolver();
    return res.status(200).json({ ok: true, message: "Agent-3 completed successfully" });
  } catch (err) {
    console.error("Agent-3 error:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
