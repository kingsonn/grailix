import { keccak256, toBytes } from "viem";

/**
 * Generate prediction hash from prediction metadata
 * Used for on-chain integrity verification
 */
export function generatePredictionHash(prediction: {
  id: number;
  prediction_text: string;
  asset?: string;
  expiry_timestamp: string;
}): `0x${string}` {
  const data = JSON.stringify({
    id: prediction.id,
    text: prediction.prediction_text,
    asset: prediction.asset,
    expiry: prediction.expiry_timestamp,
  });

  return keccak256(toBytes(data));
}

/**
 * Generate outcome hash from resolution metadata
 * Used for on-chain integrity verification
 */
export function generateOutcomeHash(outcome: {
  prediction_id: number;
  outcome_value: string;
  resolved_price?: number;
  resolved_timestamp: string;
}): `0x${string}` {
  const data = JSON.stringify({
    predictionId: outcome.prediction_id,
    outcome: outcome.outcome_value,
    price: outcome.resolved_price,
    timestamp: outcome.resolved_timestamp,
  });

  return keccak256(toBytes(data));
}
