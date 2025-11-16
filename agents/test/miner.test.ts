import "dotenv/config";
import fs from "fs";
import path from "path";
import { minePredictionsFromRSS } from "../miner";

(async () => {
  const data = await minePredictionsFromRSS();

  console.log(`\n✅ Finished. Total predictions: ${data.length}`);

  const outPath = path.join(__dirname, "../test-output/mined.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

  console.log(`📁 Saved to ${outPath}`);
})();
