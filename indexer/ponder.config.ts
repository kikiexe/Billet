import { createConfig } from "ponder";
import { http } from "viem";

import { abi as TicketMarketplaceAbi } from "./abis/TicketMarketplace.js";
import { abi as TicketNFTAbi } from "./abis/TicketNFT.js";

export default createConfig({
  chains: {
    baseSepolia: {
      id: 84532,
      rpc: http(process.env.PONDER_RPC_URL_84532),
    },
  },
  contracts: {
    TicketMarketplace: {
      abi: TicketMarketplaceAbi,
      chain: "baseSepolia",
      address: (process.env.PONDER_TICKET_MARKETPLACE_ADDRESS || "0xa8e40f45053d84848c9b24a4175b15d84eeb541e") as `0x${string}`,
      startBlock: Number(process.env.PONDER_TICKET_MARKETPLACE_START_BLOCK || 42161011),
    },
    TicketNFT: {
      abi: TicketNFTAbi,
      chain: "baseSepolia",
      address: (process.env.PONDER_TICKET_NFT_ADDRESS || "0xb73c817eb4d4b6ba23a8f7a2032c6403b47b5870") as `0x${string}`,
      startBlock: Number(process.env.PONDER_TICKET_NFT_START_BLOCK || 42161011),
    },
  },
});
