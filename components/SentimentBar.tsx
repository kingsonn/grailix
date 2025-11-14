"use client";

interface SentimentBarProps {
  sentimentYes: number;
  sentimentNo: number;
}

/**
 * Sentiment bar showing YES/NO distribution
 */
export default function SentimentBar({ sentimentYes, sentimentNo }: SentimentBarProps) {
  // Calculate percentages
  const total = sentimentYes + sentimentNo;
  const yesPercentage = total > 0 ? Math.round((sentimentYes / total) * 100) : 50;
  const noPercentage = total > 0 ? Math.round((sentimentNo / total) * 100) : 50;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-green-400 font-semibold">
          YES {yesPercentage}%
        </span>
        <span className="text-gray-400 text-xs">
          {sentimentYes + sentimentNo} votes
        </span>
        <span className="text-red-400 font-semibold">
          NO {noPercentage}%
        </span>
      </div>
      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden flex">
        <div
          className="bg-green-500 h-full transition-all duration-300"
          style={{ width: `${yesPercentage}%` }}
        />
        <div
          className="bg-red-500 h-full transition-all duration-300"
          style={{ width: `${noPercentage}%` }}
        />
      </div>
    </div>
  );
}
