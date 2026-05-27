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
      address: (process.env.PONDER_TICKET_MARKETPLACE_ADDRESS || "0xea8298ee1f7540968a321465c72416b4ccfea676") as `0x${string}`,
      startBlock: Number(process.env.PONDER_TICKET_MARKETPLACE_START_BLOCK || 42031592),
    },
    TicketNFT: {
      abi: TicketNFTAbi,
      chain: "baseSepolia",
      address: (process.env.PONDER_TICKET_NFT_ADDRESS || "0xbdc238baadb30716005f3feb2e054629ddecfdf0") as `0x${string}`,
      startBlock: Number(process.env.PONDER_TICKET_NFT_START_BLOCK || 42031592),
    },
  },
});
