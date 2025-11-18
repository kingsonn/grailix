import { http } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";

/**
 * Wallet Client Singleton
 * Ensures WalletConnect/Wagmi is initialized only ONCE across the entire app
 * Prevents "WalletConnect Core is already initialized" errors
 */

// Module-scoped cache - persists across imports
let _walletClient: ReturnType<typeof getDefaultConfig> | null = null;

// Global keys for cross-module persistence (survives hot-reload in dev)
const GLOBAL_CLIENT_KEY = Symbol.for('__GRAILIX_WALLET_CLIENT__');
const GLOBAL_INIT_FLAG = Symbol.for('__GRAILIX_WALLET_INITIALIZED__');

// Type-safe global access
interface GlobalWithWallet {
  [GLOBAL_CLIENT_KEY]?: ReturnType<typeof getDefaultConfig>;
  [GLOBAL_INIT_FLAG]?: boolean;
}

const globalWithWallet = globalThis as unknown as GlobalWithWallet;

/**
 * Get or create the wallet client
 * Safe to call multiple times - will always return the same instance
 */
export function getWalletClient(): ReturnType<typeof getDefaultConfig> {
  // 1. Check module-scoped cache first (fastest)
  if (_walletClient) {
    return _walletClient;
  }

  // 2. Check global scope (survives hot-reload)
  if (globalWithWallet[GLOBAL_CLIENT_KEY]) {
    _walletClient = globalWithWallet[GLOBAL_CLIENT_KEY];
    return _walletClient!;
  }

  // 3. Check if already initialized (safety check)
  if (globalWithWallet[GLOBAL_INIT_FLAG]) {
    console.warn('[Grailix Wallet] WalletConnect already initialized globally');
    // Try to return existing client or create a new one
    if (globalWithWallet[GLOBAL_CLIENT_KEY]) {
      _walletClient = globalWithWallet[GLOBAL_CLIENT_KEY];
      return _walletClient!;
    }
  }

  // 4. Create new client (only happens once)
  console.log('[Grailix Wallet] Initializing WalletConnect client...');
  
  try {
    // Mark as initializing BEFORE creating to prevent race conditions
    globalWithWallet[GLOBAL_INIT_FLAG] = true;

    _walletClient = getDefaultConfig({
      appName: "Grailix",
      chains: [bscTestnet],
      wallets: [
        {
          groupName: "Recommended",
          wallets: [injectedWallet, metaMaskWallet],
        },
      ],
      transports: {
        [bscTestnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
      },
      projectId: "80c9842d3a91141274ff249d103235c4",
      ssr: true,
    });

    // Store in global scope for persistence
    globalWithWallet[GLOBAL_CLIENT_KEY] = _walletClient;

    console.log('[Grailix Wallet] WalletConnect client initialized successfully');
    
    return _walletClient;
  } catch (error) {
    console.error('[Grailix Wallet] Failed to initialize WalletConnect:', error);
    
    // If initialization failed but we have a global client, return it
    if (globalWithWallet[GLOBAL_CLIENT_KEY]) {
      _walletClient = globalWithWallet[GLOBAL_CLIENT_KEY];
      return _walletClient!;
    }
    
    throw error;
  }
}

/**
 * Check if wallet client is initialized
 */
export function isWalletInitialized(): boolean {
  return _walletClient !== null || globalWithWallet[GLOBAL_CLIENT_KEY] !== undefined;
}

/**
 * Reset wallet client (for testing/debugging only)
 * DO NOT use in production code
 */
export function resetWalletClient(): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Grailix Wallet] Resetting wallet client (dev only)');
    _walletClient = null;
    delete globalWithWallet[GLOBAL_CLIENT_KEY];
    delete globalWithWallet[GLOBAL_INIT_FLAG];
  } else {
    console.error('[Grailix Wallet] resetWalletClient() is only available in development');
  }
}
