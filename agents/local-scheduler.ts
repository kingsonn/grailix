// agents/local-scheduler.ts
/**
 * Local Agent Scheduler
 * 
 * Runs Agent-1 and Agent-3 every 5 minutes on your local machine.
 * This is a fallback when GitHub Actions is unavailable.
 * 
 * Usage:
 *   npm run agents:local
 *   or
 *   npx tsx agents/local-scheduler.ts
 * 
 * Press Ctrl+C to stop.
 */

import "dotenv/config";
import { runAgent1 } from "./agent-ingestor";
import { runResolver } from "./agent-resolver";

// Configuration
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const RUN_ON_START = true; // Run immediately on startup

// State tracking
let isRunning = false;
let runCount = 0;

/**
 * Execute both agents sequentially
 */
async function executeAgents(): Promise<void> {
  if (isRunning) {
    console.log("⚠️  Previous execution still running, skipping this cycle...");
    return;
  }

  isRunning = true;
  runCount++;

  console.log("\n" + "=".repeat(60));
  console.log(`🚀 Starting Agent Execution Cycle #${runCount}`);
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log("=".repeat(60) + "\n");

  try {
    // Run Agent-1 (which automatically triggers Agent-2)
    console.log("📥 Executing Agent-1 (Ingestor)...\n");
    await runAgent1();
    console.log("\n✅ Agent-1 completed successfully\n");

    // Wait a bit between agents
    await sleep(2000);

    // Run Agent-3
    console.log("🔄 Executing Agent-3 (Resolver)...\n");
    await runResolver();
    console.log("\n✅ Agent-3 completed successfully\n");

    console.log("=".repeat(60));
    console.log(`✅ Cycle #${runCount} completed successfully`);
    console.log(`⏰ Finished at: ${new Date().toLocaleString()}`);
    console.log(`⏭️  Next run in 5 minutes...`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error(`❌ Error in cycle #${runCount}:`);
    console.error(error);
    console.error("=".repeat(60) + "\n");
    console.log("⏭️  Will retry in 5 minutes...\n");
  } finally {
    isRunning = false;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format milliseconds to human-readable time
 */
function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Main scheduler loop
 */
async function startScheduler(): Promise<void> {
  console.log("\n" + "█".repeat(60));
  console.log("🤖 GRAILIX LOCAL AGENT SCHEDULER");
  console.log("█".repeat(60));
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`⏱️  Interval: ${formatTime(INTERVAL_MS)}`);
  console.log(`🔄 Run on start: ${RUN_ON_START ? "Yes" : "No"}`);
  console.log("█".repeat(60) + "\n");

  console.log("💡 Tips:");
  console.log("   - Press Ctrl+C to stop the scheduler");
  console.log("   - Logs will show execution progress");
  console.log("   - Errors are logged but won't stop the scheduler\n");

  // Run immediately if configured
  if (RUN_ON_START) {
    console.log("🏃 Running agents immediately...\n");
    await executeAgents();
  }

  // Set up interval
  console.log(`⏰ Scheduler active. Next run at: ${new Date(Date.now() + INTERVAL_MS).toLocaleString()}\n`);

  setInterval(async () => {
    await executeAgents();
  }, INTERVAL_MS);
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandlers(): void {
  const shutdown = () => {
    console.log("\n\n" + "█".repeat(60));
    console.log("🛑 SHUTTING DOWN SCHEDULER");
    console.log("█".repeat(60));
    console.log(`📊 Total cycles completed: ${runCount}`);
    console.log(`⏰ Stopped at: ${new Date().toLocaleString()}`);
    console.log("█".repeat(60) + "\n");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

/**
 * Validate environment variables
 */
function validateEnvironment(): void {
  const required = [
    "GOOGLE_SERVICE_ACCOUNT_JSON",
    "GOOGLE_SHEET_ID",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GROQ_API_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\n💡 Make sure your .env.local file is configured correctly.\n");
    process.exit(1);
  }
}

/**
 * Entry point
 */
async function main(): Promise<void> {
  try {
    // Validate environment
    validateEnvironment();

    // Setup shutdown handlers
    setupShutdownHandlers();

    // Start the scheduler
    await startScheduler();
  } catch (error) {
    console.error("❌ Fatal error starting scheduler:", error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
