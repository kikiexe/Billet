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
      address: (process.env.PONDER_TICKET_MARKETPLACE_ADDRESS || "0x44d565b75Ad385c340538DE9d3be348d7F6B48Fb") as `0x${string}`,
      startBlock: Number(process.env.PONDER_TICKET_MARKETPLACE_START_BLOCK || 42161011),
    },
    TicketNFT: {
      abi: TicketNFTAbi,
      chain: "baseSepolia",
      address: (process.env.PONDER_TICKET_NFT_ADDRESS || "0x2e8e67aA822D8E2c7FAC95D6B142830C7dbe1Ebc") as `0x${string}`,
      startBlock: Number(process.env.PONDER_TICKET_NFT_START_BLOCK || 42161011),
    },
  },
});
