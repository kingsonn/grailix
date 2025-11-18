// pages/api/run-agent3.ts
/**
 * Secure API endpoint for Agent-3 (Resolver)
 * Triggered by GitHub Actions CRON
 * Validates CRON_SECRET to prevent unauthorized access
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { runResolver } from "../../agents/agent-resolver";

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
    console.error("❌ Unauthorized Agent-3 API call attempt");
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("🔐 Agent-3 API: Authorization validated");

  try {
    // Run Agent-3
    await runResolver();

    return res.status(200).json({
      success: true,
      agent: "agent-3",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Agent-3 API error:", error);

    return res.status(500).json({
      success: false,
      agent: "agent-3",
      error: error?.message || "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
