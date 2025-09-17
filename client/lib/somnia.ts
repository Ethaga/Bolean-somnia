// Somnia Testnet chain configuration and Bolean protocol addresses
// Source: https://docs.somnia.network/developer/network-info

import { Chain } from "viem";

export const somniaTestnet: Chain = {
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.somnia.network/"] },
    public: { http: ["https://testnet.somnia.network/"] },
  },
  blockExplorers: {
    default: { name: "Somnia Explorer", url: "https://somnia-testnet.socialscan.io/" },
    socialscan: { name: "SocialScan", url: "https://somnia-testnet.socialscan.io/" },
  },
};

export const SOMNIA_CHAIN_ID_HEX = "0xC488"; // 50312

// Bolean protocol on Somnia Testnet
// These addresses are from Somnia docs/sample references and may evolve. Replace if you deploy new contracts.
export const BOLEAN_ADDRESSES = {
  lendingPool: "0x5e44F178E8cF9B2F5409B6f18ce936aB817C5a11",
  tokens: {
    tokenA: "0x841b8199E6d3Db3C6f264f6C2bd8848b3cA64223",
    tokenB: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
    tokenC: "0x4be0ddfebca9a5a4a617dee4dece99e7c862dceb",
  },
} as const;

export type BoleanAddresses = typeof BOLEAN_ADDRESSES;
