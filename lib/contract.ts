import { http } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";

// Contract addresses from .env
export const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;
export const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`;

// Singleton pattern: Create wagmi config ONCE
// This prevents "WalletConnect Core is already initialized" errors
let _config: ReturnType<typeof getDefaultConfig> | null = null;

function createWagmiConfig() {
  if (_config) return _config;
  
  _config = getDefaultConfig({
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
    ssr: true, // Enable SSR support
  });
  
  return _config;
}

// Export the singleton config
export const config = createWagmiConfig();

// MockUSDC ABI (minimal - only functions we need)
export const MockUSDC_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// GrailixVault ABI (minimal - only functions we need)
export const GrailixVault_ABI = [
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "internalDepositId", type: "string" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "internalWithdrawId", type: "string" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "predictionId", type: "uint256" },
      { name: "predictionHash", type: "bytes32" },
    ],
    name: "storePredictionHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "predictionId", type: "uint256" },
      { name: "outcomeHash", type: "bytes32" },
    ],
    name: "storeOutcomeHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "internalDepositId", type: "string" },
      { indexed: false, name: "txHash", type: "bytes32" },
    ],
    name: "Deposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "internalWithdrawId", type: "string" },
      { indexed: false, name: "txHash", type: "bytes32" },
    ],
    name: "WithdrawRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "predictionId", type: "uint256" },
      { indexed: false, name: "predictionHash", type: "bytes32" },
    ],
    name: "PredictionHashStored",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "predictionId", type: "uint256" },
      { indexed: false, name: "outcomeHash", type: "bytes32" },
    ],
    name: "OutcomeHashStored",
    type: "event",
  },
] as const;
