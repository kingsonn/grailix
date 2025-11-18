// pages/api/run-agent1.ts
/**
 * Secure API endpoint for Agent-1 (Ingestor)
 * Triggered by GitHub Actions CRON
 * Validates CRON_SECRET to prevent unauthorized access
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { runAgent1 } from "../../agents/agent-ingestor";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validate CRON_SECRET
  const auth = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!auth || auth !== expectedAuth) {
    console.error("❌ Unauthorized Agent-1 API call attempt");
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("🔐 Agent-1 API: Authorization validated");

  try {
    // Run Agent-1
    await runAgent1();

    return res.status(200).json({
      success: true,
      agent: "agent-1",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Agent-1 API error:", error);

    return res.status(500).json({
      success: false,
      agent: "agent-1",
      error: error?.message || "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
