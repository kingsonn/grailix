// agents/agent-ingestor.ts
/**
 * Agent-1: Google Sheets -> Supabase (ai_raw_inputs)
 *
 * Sheet header (case-sensitive) must include:
 *   raw_text | ticker | asset_type | source_name | source_url | processed
 *
 * You (human) fill the first 5 columns. Agent will set processed = TRUE.
 * asset_type must be either "crypto" or "stock"
 *
 * ENV variables required:
 *   - GOOGLE_SHEET_ID
 *   - GOOGLE_SERVICE_ACCOUNT_JSON  (single-line JSON string)
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Supabase table expected: ai_raw_inputs
 * Columns: id (uuid, auto), raw_text (text), ticker (text), asset_type (text), source_name (text), source_url (text), created_at (timestamp auto)
 */

import "dotenv/config";
import { GoogleAuth } from "google-auth-library";
import { sheets_v4 } from "@googleapis/sheets";
import { createClient } from "@supabase/supabase-js";
import { runAgent2ForIds } from "./agent-standardizer";

if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env var");
}
if (!process.env.GOOGLE_SHEET_ID) {
  throw new Error("Missing GOOGLE_SHEET_ID env var");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase env vars");
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
const READ_RANGE = "Sheet1!A1:F999"; // header + rows (now includes asset_type)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Parse creds once
const serviceAccountCreds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);

const auth = new GoogleAuth({
  credentials: serviceAccountCreds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const client = await auth.getClient();
  // cast to any to avoid typing mismatch between google libs (safe runtime)
  const typedClient = client as any;
  return new sheets_v4.Sheets({ auth: typedClient });
}

export async function runAgent1() {
  console.log("🔵 Agent-1 started at", new Date().toISOString());
  console.log("🔵 Agent-1: Starting ingestion (Sheets → ai_raw_inputs)...");

  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: READ_RANGE,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const rows = res.data.values || [];
  if (!rows || rows.length === 0) {
    console.log("No rows found in sheet.");
    return;
  }

  const header = (rows[0] || []).map((h) => String(h || "").trim());
  const rawIdx = header.indexOf("raw_text");
  const tickerIdx = header.indexOf("ticker");
  const assetTypeIdx = header.indexOf("asset_type");
  const srcNameIdx = header.indexOf("source_name");
  const srcUrlIdx = header.indexOf("source_url");
  const processedIdx = header.indexOf("processed");

  if (rawIdx === -1 || tickerIdx === -1 || assetTypeIdx === -1 || srcNameIdx === -1 || srcUrlIdx === -1) {
    throw new Error(
      "Sheet header missing required columns. Required header columns: raw_text, ticker, asset_type, source_name, source_url, processed"
    );
  }

  let insertedCount = 0;
  const updates: { range: string; values: string[] }[] = [];
  const newInsertedIds: string[] = [];

  // iterate over data rows (starting from sheet row 2 / index 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as (string | undefined)[];
    // normalize the row array to header length (avoid undefined)
    const rowSafe = Array.from({ length: Math.max(header.length, row.length) }, (_, k) =>
      String(row[k] ?? "").trim()
    );

    const raw_text = rowSafe[rawIdx] || "";
    const ticker = rowSafe[tickerIdx] || "";
    const asset_type = rowSafe[assetTypeIdx] || "";
    const source_name = rowSafe[srcNameIdx] || "";
    const source_url = rowSafe[srcUrlIdx] || "";
    const processed = processedIdx !== -1 ? rowSafe[processedIdx] : "";

    // skip blanks or already processed
    if (!raw_text || !ticker || !asset_type) {
      console.log(`Skipping sheet row ${i + 1} — missing raw_text, ticker, or asset_type.`);
      continue;
    }
    
    // validate asset_type
    const normalizedAssetType = asset_type.toLowerCase();
    if (normalizedAssetType !== "crypto" && normalizedAssetType !== "stock") {
      console.log(`Skipping sheet row ${i + 1} — invalid asset_type "${asset_type}". Must be "crypto" or "stock".`);
      continue;
    }
    if (processed && processed.toUpperCase() === "TRUE") {
      // already processed
      continue;
    }

    // Check for duplicates before inserting
    try {
      // Check if this exact raw_text + ticker combination already exists
      const { data: existingRows, error: checkError } = await supabase
        .from("ai_raw_inputs")
        .select("id")
        .eq("raw_text", raw_text)
        .eq("ticker", ticker)
        .limit(1);

      if (checkError) {
        console.error(`Error checking for duplicates for sheet row ${i + 1}:`, checkError);
        continue;
      }

      if (existingRows && existingRows.length > 0) {
        console.log(`Skipping sheet row ${i + 1} — duplicate already exists in ai_raw_inputs (ticker=${ticker})`);
        
        // Still mark as processed in sheet to avoid re-checking
        if (processedIdx !== -1) {
          const sheetRowNumber = i + 1;
          const updatedRow = rowSafe.slice(0, header.length);
          updatedRow[processedIdx] = "TRUE";
          updates.push({
            range: `Sheet1!A${sheetRowNumber}:F${sheetRowNumber}`,
            values: updatedRow,
          });
        }
        continue;
      }

      // Insert into Supabase ai_raw_inputs
      const { data: insertedRow, error } = await supabase.from("ai_raw_inputs").insert([
        {
          raw_text,
          ticker,
          asset_type: normalizedAssetType,
          source_name: source_name || null,
          source_url: source_url || null,
        },
      ]).select("id").single();
      
      if (insertedRow && insertedRow.id) {
        newInsertedIds.push(insertedRow.id); // collect for handoff
      }
      if (error) {
        console.error(`Supabase insert error for sheet row ${i + 1}:`, error);
        // Do not mark processed if insert failed
        continue;
      }

      insertedCount++;
      console.log(`Inserted sheet row ${i + 1} → ai_raw_inputs (ticker=${ticker})`);

      // schedule marking processed = TRUE if column exists
      if (processedIdx !== -1) {
        const sheetRowNumber = i + 1; // sheet is 1-indexed
        // rebuild updated row values up to header length and set processed col to TRUE
        const updatedRow = rowSafe.slice(0, header.length);
        updatedRow[processedIdx] = "TRUE";
        updates.push({
          range: `Sheet1!A${sheetRowNumber}:F${sheetRowNumber}`,
          values: updatedRow,
        });
      }
    } catch (err) {
      console.error(`Unexpected error inserting sheet row ${i + 1}:`, err);
    }
  }

  // Batch-update the sheet to mark rows processed
  if (updates.length > 0) {
    try {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: "RAW",
          data: updates.map((u) => ({ range: u.range, values: [u.values] })),
        },
      });
      console.log(`Marked ${updates.length} rows processed in Google Sheet.`);
    } catch (err) {
      console.error("Failed to update Google Sheet processed flags:", err);
    }
  } else {
    console.log("No rows required marking processed.");
  }
  console.log(`\n✅ Agent-1 complete. Inserted ${insertedCount} rows into ai_raw_inputs.`);
  if (newInsertedIds.length > 0) {
    console.log("Handing off to Agent-2 for immediate processing:", newInsertedIds.length, "rows");
    // runAgent2ForIds will process only those ids (and mark them processed)
    await runAgent2ForIds(newInsertedIds);
  }
  console.log("🔵 Agent-1 finished at", new Date().toISOString());
}

runAgent1();