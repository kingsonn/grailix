export const MARKET_HOLIDAYS: {
  [date: string]: {
    name: string;
    status: "closed" | "early-close";
    open?: string;   // only for early close days
    close?: string;  // only for early close days
  };
} = {
  "2025-11-27": {
    name: "Thanksgiving",
    status: "closed"
  },

  "2025-11-28": {
    name: "Thanksgiving",
    status: "early-close",
    open: "2025-11-28T14:30:00.000Z",
    close: "2025-11-28T18:00:00.000Z"
  },

  "2025-12-24": {
    name: "Christmas",
    status: "early-close",
    open: "2025-12-24T14:30:00.000Z",
    close: "2025-12-24T18:00:00.000Z"
  },

  "2025-12-25": {
    name: "Christmas",
    status: "closed"
  },

  "2026-01-01": {
    name: "New Years Day",
    status: "closed"
  },

  "2026-01-19": {
    name: "Martin Luther King Jr. Day",
    status: "closed"
  },

  "2026-02-16": {
    name: "Washington's Birthday",
    status: "closed"
  },

  "2026-04-03": {
    name: "Good Friday",
    status: "closed"
  },

  "2026-05-25": {
    name: "Memorial Day",
    status: "closed"
  },

  "2026-06-19": {
    name: "Juneteenth",
    status: "closed"
  },

  "2026-07-03": {
    name: "Independence Day",
    status: "closed"
  },

  "2026-09-07": {
    name: "Labor Day",
    status: "closed"
  }
};
