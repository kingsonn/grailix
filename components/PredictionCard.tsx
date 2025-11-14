"use client";

import SentimentBar from "./SentimentBar";
import type { Prediction } from "@/types/supabase";

interface PredictionCardProps {
  prediction: Prediction;
  onSwipe: (position: "YES" | "NO" | "SKIP") => void;
}

/**
 * Prediction card component
 * Displays prediction details and handles swipe actions
 */
export default function PredictionCard({ prediction, onSwipe }: PredictionCardProps) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Prediction Text */}
      <h2 className="text-xl font-bold mb-4">{prediction.prediction_text}</h2>

      {/* Asset Badge */}
      {prediction.asset && (
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
          {prediction.asset}
        </span>
      )}

      {/* Source */}
      {prediction.source_name && (
        <p className="text-sm text-gray-600 mb-2">Source: {prediction.source_name}</p>
      )}

      {/* Expiry */}
      <p className="text-sm text-gray-500 mb-4">
        Expires: {new Date(prediction.expiry_timestamp).toLocaleString()}
      </p>

      {/* Sentiment Bar */}
      <div className="mb-6">
        <SentimentBar 
          sentimentYes={prediction.sentiment_yes} 
          sentimentNo={prediction.sentiment_no} 
        />
      </div>

      {/* Action Buttons (Desktop) */}
      <div className="flex gap-2">
        <button
          onClick={() => onSwipe?.("YES")}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          YES
        </button>
        <button
          onClick={() => onSwipe?.("SKIP")}
          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
        >
          SKIP
        </button>
        <button
          onClick={() => onSwipe?.("NO")}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          NO
        </button>
      </div>
    </div>
  );
}
