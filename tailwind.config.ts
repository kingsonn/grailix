import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Grail Void (Base Theme)
        void: {
          black: "#05070A",
          smoke: "#0C1117",
          graphite: "#151A21",
        },
        // Grail Purple (Primary Brand)
        grail: {
          DEFAULT: "#7D2CFF",
          light: "#A66CFF",
          pale: "#C7A6FF",
        },
        // Accents
        auric: "#E8C547", // Gold for wins/payouts
        neon: "#1B8FFF", // Blue for interactions
        // Outcomes
        profit: "#00D98B",
        loss: "#FF2E5F",
      },
      backgroundImage: {
        'grail-radial': 'radial-gradient(circle at top, rgba(125,44,255,0.4) 0%, rgba(5,7,10,1) 70%)',
        'grail-gradient': 'linear-gradient(90deg, #7D2CFF, #A66CFF)',
        'void-gradient': 'linear-gradient(180deg, #05070A 0%, #0C1117 50%, #151A21 100%)',
      },
      boxShadow: {
        'grail': '0 0 12px rgba(125,44,255,0.35)',
        'grail-lg': '0 0 20px rgba(166,108,255,0.65)',
        'auric': '0 0 16px rgba(232,197,71,0.4)',
        'neon': '0 0 12px rgba(27,143,255,0.4)',
      },
      backdropBlur: {
        'grail': '20px',
      },
    },
  },
  plugins: [],
};
export default config;
