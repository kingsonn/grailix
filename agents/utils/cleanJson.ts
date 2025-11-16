export function extractJson(text: string): any | null {
  if (!text) return null;

  // remove markdown fences
  text = text.replace(/```json/gi, "")
             .replace(/```/g, "")
             .trim();

  // find the first { ... }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    return null;
  }

  const jsonStr = text.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("❌ JSON Parse Error:", (err as any).message);
    return null;
  }
}