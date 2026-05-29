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
      address: (process.env.PONDER_TICKET_MARKETPLACE_ADDRESS || "0xc077F17A989d531e41b0dc016599Cf320014220E") as `0x${string}`,
      startBlock: Number(process.env.PONDER_TICKET_MARKETPLACE_START_BLOCK || 42157697),
    },
    TicketNFT: {
      abi: TicketNFTAbi,
      chain: "baseSepolia",
      address: (process.env.PONDER_TICKET_NFT_ADDRESS || "0x9EAd372789a14C3e4e172B7d82920aD8Ff474ab7") as `0x${string}`,
      startBlock: Number(process.env.PONDER_TICKET_NFT_START_BLOCK || 42157697),
    },
  },
});
