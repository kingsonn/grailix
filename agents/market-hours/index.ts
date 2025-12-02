// agents/market-hours/index.ts
/**
 * Market hours utilities for NYSE/NASDAQ
 * Timezone: America/New_York
 * Regular hours: 09:30 - 16:00 ET
 * Early close: 09:30 - 13:00 ET
 */

import { DateTime } from "luxon";

type DateTimeType = InstanceType<typeof DateTime>;
import { MARKET_HOLIDAYS } from "./holidays";

const TIMEZONE = "America/New_York";
const REGULAR_OPEN_HOUR = 9;
const REGULAR_OPEN_MINUTE = 30;
const REGULAR_CLOSE_HOUR = 16;
const REGULAR_CLOSE_MINUTE = 0;
const EARLY_CLOSE_HOUR = 13;
const EARLY_CLOSE_MINUTE = 0;

/**
 * Get market open/close times for a specific date
 * Returns null if market is closed for the day
 */
export function getMarketOpenClose(date: DateTimeType): {
  open: DateTimeType;
  close: DateTimeType;
  isEarlyClose: boolean;
} | null {
  const dateKey = date.toFormat("yyyy-MM-dd");
  const holiday = MARKET_HOLIDAYS[dateKey];

  // Market closed for holiday
  if (holiday?.status === "closed") {
    return null;
  }

  // Early close day
  if (holiday?.status === "early-close") {
    const open = date.set({
      hour: REGULAR_OPEN_HOUR,
      minute: REGULAR_OPEN_MINUTE,
      second: 0,
      millisecond: 0,
    });
    const close = date.set({
      hour: EARLY_CLOSE_HOUR,
      minute: EARLY_CLOSE_MINUTE,
      second: 0,
      millisecond: 0,
    });
    return { open, close, isEarlyClose: true };
  }

  // Weekend check
  const dayOfWeek = date.weekday; // 1=Monday, 7=Sunday
  if (dayOfWeek === 6 || dayOfWeek === 7) {
    // Saturday or Sunday
    return null;
  }

  // Regular trading day
  const open = date.set({
    hour: REGULAR_OPEN_HOUR,
    minute: REGULAR_OPEN_MINUTE,
    second: 0,
    millisecond: 0,
  });
  const close = date.set({
    hour: REGULAR_CLOSE_HOUR,
    minute: REGULAR_CLOSE_MINUTE,
    second: 0,
    millisecond: 0,
  });
  return { open, close, isEarlyClose: false };
}

/**
 * Check if market is currently open
 */
export function isMarketOpen(timestamp?: DateTimeType): boolean {
  const now = timestamp || DateTime.now().setZone(TIMEZONE);
  const nowET = now.setZone(TIMEZONE);

  const marketTimes = getMarketOpenClose(nowET);
  if (!marketTimes) return false;

  return nowET >= marketTimes.open && nowET < marketTimes.close;
}

/**
 * Get the next market open time after a given timestamp
 */
export function getNextMarketOpen(afterTimestamp?: DateTimeType): DateTimeType {
  let current = (afterTimestamp || DateTime.now()).setZone(TIMEZONE);

  // Start checking from the next day if we're past market close today
  const todayMarket = getMarketOpenClose(current);
  if (todayMarket && current < todayMarket.open) {
    // Before today's open - return today's open
    return todayMarket.open.toUTC();
  }

  // Start from next day
  current = current.plus({ days: 1 }).startOf("day");

  // Search up to 10 days ahead (should find a trading day)
  for (let i = 0; i < 10; i++) {
    const marketTimes = getMarketOpenClose(current);
    if (marketTimes) {
      return marketTimes.open.toUTC();
    }
    current = current.plus({ days: 1 });
  }

  // Fallback: return next Monday 9:30 AM ET
  const nextMonday = current.set({ weekday: 1 });
  return nextMonday
    .set({
      hour: REGULAR_OPEN_HOUR,
      minute: REGULAR_OPEN_MINUTE,
      second: 0,
      millisecond: 0,
    })
    .toUTC();
}

/**
 * Get market close time for a specific date
 * Returns null if market is closed that day
 */
export function getMarketCloseForDate(date?: DateTimeType): {
  close: DateTimeType;
  isEarlyClose: boolean;
} | null {
  const targetDate = (date || DateTime.now()).setZone(TIMEZONE);
  const marketTimes = getMarketOpenClose(targetDate);

  if (!marketTimes) return null;

  return {
    close: marketTimes.close,
    isEarlyClose: marketTimes.isEarlyClose,
  };
}

/**
 * Calculate minutes until market close
 * Returns null if market is not open
 */
export function getMinutesUntilClose(timestamp?: DateTimeType): number | null {
  const now = timestamp || DateTime.now().setZone(TIMEZONE);
  const nowET = now.setZone(TIMEZONE);

  if (!isMarketOpen(nowET)) return null;

  const closeInfo = getMarketCloseForDate(nowET);
  if (!closeInfo) return null;

  const diff = closeInfo.close.diff(nowET, "minutes");
  return Math.floor(diff.minutes);
}

/**
 * Determine stock expiry and betting close based on current market status
 */
export function stockExpiryDecision(now?: DateTimeType): {
  expiry: DateTimeType;
  bettingClose: DateTimeType;
  questionType: "open" | "close";
} {
  const currentTime = (now || DateTime.now()).setZone(TIMEZONE);

  if (!isMarketOpen(currentTime)) {
    // Market closed - check if we're within 2 hours before next market open
    const nextOpen = getNextMarketOpen(currentTime);
    const minutesUntilOpen = nextOpen.diff(currentTime, "minutes").minutes;

    if (minutesUntilOpen <= 120) {
      // Within 2 hours of market open - expire at market close of that day
      const openDate = nextOpen.setZone(TIMEZONE);
      const closeInfo = getMarketCloseForDate(openDate);
      
      if (closeInfo) {
        const expiry = closeInfo.close;
        const bettingClose = expiry.minus({ minutes: 60 });
        return {
          expiry: expiry.toUTC(),
          bettingClose: bettingClose.toUTC(),
          questionType: "close",
        };
      }
    }

    // More than 2 hours before open - create open-type questions
    const expiry = nextOpen;
    const bettingClose = expiry.minus({ minutes: 1 });
    return {
      expiry,
      bettingClose,
      questionType: "open",
    };
  }

  // Market is open - check time until close
  const minutesToClose = getMinutesUntilClose(currentTime);

  if (minutesToClose === null || minutesToClose <= 120) {
    // Less than 2 hours to close - create open-type for next day
    const expiry = getNextMarketOpen(currentTime);
    const bettingClose = expiry.minus({ minutes: 1 });
    return {
      expiry,
      bettingClose,
      questionType: "open",
    };
  }

  // More than 2 hours to close - create close-type for today
  const closeInfo = getMarketCloseForDate(currentTime);
  if (!closeInfo) {
    // Fallback to next open
    const expiry = getNextMarketOpen(currentTime);
    const bettingClose = expiry.minus({ minutes: 1 });
    return {
      expiry,
      bettingClose,
      questionType: "open",
    };
  }

  const expiry = closeInfo.close;
  const bettingClose = expiry.minus({ minutes: 60 });

  return {
    expiry: expiry.toUTC(),
    bettingClose: bettingClose.toUTC(),
    questionType: "close",
  };
}

/**
 * Determine crypto expiry and betting close based on sentiment strength
 * Expiry timestamps are normalized to whole minutes (seconds and milliseconds set to 0)
 */
export function cryptoExpiryDecision(
  sentimentStrength: "strong" | "weak" | "neutral",
  now?: DateTimeType
): {
  expiry: DateTimeType;
  bettingClose: DateTimeType;
  windowHours: number;
} {
  const currentTime = now || DateTime.utc();

  let windowHours: number;
  if (sentimentStrength === "strong") {
    windowHours = 3;
  } else if (sentimentStrength === "weak") {
    windowHours = 6;
  } else {
    // Neutral - random pick or default to 6
    windowHours = Math.random() > 0.5 ? 3 : 6;
  }

  // Add window hours and normalize to whole minute (set seconds and milliseconds to 0)
  const expiry = currentTime
    .plus({ hours: windowHours })
    .set({ second: 0, millisecond: 0 });
  
  const bettingCloseOffset = windowHours === 3 ? 30 : 60;
  const bettingClose = expiry.minus({ minutes: bettingCloseOffset });

  return {
    expiry,
    bettingClose,
    windowHours,
  };
}
